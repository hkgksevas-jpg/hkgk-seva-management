'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Users, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { generateReferralLink, copyToClipboard, formatDateTime } from '@/lib/utils';
import { Profile } from '@/types';

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchReferrals();
  }, [profile]);

  const fetchReferrals = async () => {
    if (!profile) return;

    try {
      // Get all referred users
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('referred_by', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!profile) return;

    const link = generateReferralLink(profile.referral_code);
    const success = await copyToClipboard(link);

    if (success) {
      toast({
        title: 'Success',
        description: 'Referral link copied to clipboard!',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  if (!profile) return null;

  const referralLink = generateReferralLink(profile.referral_code);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Referrals</h1>
        <p className="text-muted-foreground mt-2">
          Share your referral link and track who signs up
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
            <CardDescription>
              Share this link with others to invite them to join
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 bg-muted p-3 rounded-md font-mono text-sm break-all">
                {referralLink}
              </div>
              <Button onClick={handleCopyLink}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Referrals</CardTitle>
                <CardDescription>
                  People who signed up using your referral link
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 bg-saffron-50 px-4 py-2 rounded-full">
                <Users className="h-5 w-5 text-saffron-600" />
                <span className="text-2xl font-bold text-saffron-700">
                  {referrals.length}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading...
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No referrals yet. Start sharing your link!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-saffron-100 flex items-center justify-center">
                        <span className="text-saffron-700 font-semibold">
                          {referral.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{referral.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {referral.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Joined</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(referral.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
