'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { Donor, Seva } from '@/types';
import { DonorForm } from '@/components/forms/donor-form';
import { DonorTable } from '@/components/tables/donor-table';
import { useToast } from '@/components/ui/use-toast';

export default function SevaDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  const [seva, setSeva] = useState<Seva | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);

  useEffect(() => {
    fetchSevaAndDonors();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`seva-${params.id}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'donors',
          filter: `seva_id=eq.${params.id}`,
        },
        () => {
          fetchSevaAndDonors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id, user]);

  const fetchSevaAndDonors = async () => {
    if (!user) return;

    try {
      // Fetch seva details
      const { data: sevaData, error: sevaError } = await supabase
        .from('sevas')
        .select('*')
        .eq('id', params.id)
        .single();

      if (sevaError) throw sevaError;
      setSeva(sevaData);

      // Fetch user's donors for this seva
      const { data: donorsData, error: donorsError } = await supabase
        .from('donors')
        .select('*')
        .eq('seva_id', params.id)
        .eq('added_by', user.id)
        .order('created_at', { ascending: false });

      if (donorsError) throw donorsError;
      setDonors(donorsData || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDonor = () => {
    setEditingDonor(null);
    setIsFormOpen(true);
  };

  const handleEditDonor = (donor: Donor) => {
    setEditingDonor(donor);
    setIsFormOpen(true);
  };

  const handleDeleteDonor = async (donorId: string) => {
    if (!confirm('Are you sure you want to delete this donor?')) return;

    try {
      const { error } = await supabase
        .from('donors')
        .delete()
        .eq('id', donorId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Donor deleted successfully',
      });

      fetchSevaAndDonors();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete donor',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingDonor(null);
    fetchSevaAndDonors();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-saffron-600" />
      </div>
    );
  }

  if (!seva) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Seva not found</p>
            <Button onClick={() => router.push('/user/sevas')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sevas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bookedCount = donors.filter(d => d.payment_status === 'paid' || d.payment_status === 'partial').length;
  const blockedCount = donors.filter(d => d.payment_status === 'pending').length;
  const remainingSlots = seva.total_slots - seva.booked_slots;

  return (
    <div className="p-8">
      <Button
        variant="ghost"
        onClick={() => router.push('/user/sevas')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Sevas
      </Button>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{seva.name}</CardTitle>
            <CardDescription>{seva.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Slots</p>
                <p className="text-2xl font-bold">{seva.total_slots}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold text-green-600">{remainingSlots}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Booked</p>
                <p className="text-2xl font-bold text-blue-600">{bookedCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Blocked</p>
                <p className="text-2xl font-bold text-orange-600">{blockedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Donors</CardTitle>
                <CardDescription>
                  Manage donors you&apos;ve added for this seva
                </CardDescription>
              </div>
              <Button onClick={handleAddDonor}>
                <Plus className="mr-2 h-4 w-4" />
                Add Donor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DonorTable
              donors={donors}
              onEdit={handleEditDonor}
              onDelete={handleDeleteDonor}
            />
          </CardContent>
        </Card>
      </div>

      <DonorForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        sevaId={params.id as string}
        donor={editingDonor}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
