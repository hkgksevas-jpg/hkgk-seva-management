'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { SevaWithStats } from '@/types';

export default function SevasPage() {
  const [sevas, setSevas] = useState<SevaWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    fetchSevas();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('sevas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sevas',
        },
        () => {
          fetchSevas();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'donors',
        },
        () => {
          fetchSevas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchSevas = async () => {
    if (!user) return;

    try {
      // Fetch all active sevas
      const { data: sevasData, error: sevasError } = await supabase
        .from('sevas')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (sevasError) throw sevasError;

      // For each seva, get user's booked and blocked counts
      const sevasWithStats = await Promise.all(
        (sevasData || []).map(async (seva) => {
          const { data: userDonors } = await supabase
            .from('donors')
            .select('payment_status')
            .eq('seva_id', seva.id)
            .eq('added_by', user.id);

          const bookedCount = userDonors?.filter(d => d.payment_status === 'paid').length || 0;
          const blockedCount = userDonors?.filter(d => d.payment_status === 'pending').length || 0;
          const remainingSlots = seva.total_slots - seva.booked_slots;

          return {
            ...seva,
            user_booked_count: bookedCount,
            user_blocked_count: blockedCount,
            remaining_slots: remainingSlots,
          };
        })
      );

      setSevas(sevasWithStats);
    } catch (error) {
      console.error('Error fetching sevas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-saffron-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Available Sevas</h1>
        <p className="text-muted-foreground mt-2">
          Browse and manage your seva enrollments
        </p>
      </div>

      {sevas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No active sevas available at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sevas.map((seva) => (
            <Card key={seva.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{seva.name}</CardTitle>
                <CardDescription>{seva.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Slots:</span>
                    <span className="font-medium">{seva.total_slots}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className="font-medium text-green-600">
                      {seva.remaining_slots}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Your Booked:</span>
                    <span className="font-medium text-blue-600">
                      {seva.user_booked_count}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Your Blocked:</span>
                    <span className="font-medium text-orange-600">
                      {seva.user_blocked_count}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-saffron-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(seva.booked_slots / seva.total_slots) * 100}%`,
                    }}
                  />
                </div>

                <Link href={`/user/sevas/${seva.id}`}>
                  <Button className="w-full">Manage Donors</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
