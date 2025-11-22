'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import { Donor, Seva, Profile } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PaymentHistoryDialog } from '@/components/forms/payment-history-dialog';

interface DonorWithUser extends Donor {
  user?: Profile;
}

export default function AdminSevaDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [seva, setSeva] = useState<Seva | null>(null);
  const [donors, setDonors] = useState<DonorWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  useEffect(() => {
    fetchSevaAndDonors();
  }, [params.id]);

  const fetchSevaAndDonors = async () => {
    try {
      // Fetch seva details
      const { data: sevaData, error: sevaError } = await supabase
        .from('sevas')
        .select('*')
        .eq('id', params.id)
        .single();

      if (sevaError) throw sevaError;
      setSeva(sevaData);

      // Fetch all donors for this seva with user info
      const { data: donorsData, error: donorsError } = await supabase
        .from('donors')
        .select('*')
        .eq('seva_id', params.id)
        .order('created_at', { ascending: false });

      if (donorsError) throw donorsError;

      // Fetch user profiles for each donor
      const donorsWithUsers = await Promise.all(
        (donorsData || []).map(async (donor) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', donor.added_by)
            .single();

          return {
            ...donor,
            user: userData,
          };
        })
      );

      setDonors(donorsWithUsers);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  if (!seva) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Seva not found</p>
            <Button onClick={() => router.push('/admin/sevas')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sevas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRevenue = donors.reduce((sum, d) => sum + (d.paid_amount || 0), 0);

  return (
    <div className="p-8">
      <Button
        variant="ghost"
        onClick={() => router.push('/admin/sevas')}
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Slots</p>
                <p className="text-2xl font-bold">{seva.total_slots}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Booked</p>
                <p className="text-2xl font-bold text-green-600">{seva.booked_slots}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold text-blue-600">
                  {seva.total_slots - seva.booked_slots}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Donors</p>
                <p className="text-2xl font-bold">{donors.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-saffron-600">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Donors</CardTitle>
            <CardDescription>
              Complete list of donors for this seva across all users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {donors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No donors added yet
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enrollment #</TableHead>
                      <TableHead>Donor Name</TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donors.map((donor) => (
                      <TableRow key={donor.id}>
                        <TableCell className="font-mono text-xs">
                          {donor.enrollment_number}
                        </TableCell>
                        <TableCell className="font-medium">{donor.donor_name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{donor.user?.full_name || 'Unknown'}</div>
                            <div className="text-muted-foreground text-xs">
                              {donor.user?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {donor.contact_phone && <div>{donor.contact_phone}</div>}
                            {donor.contact_email && (
                              <div className="text-muted-foreground">{donor.contact_email}</div>
                            )}
                            {!donor.contact_phone && !donor.contact_email && (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(donor.total_amount || 0)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-600">
                            {formatCurrency(donor.paid_amount || 0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-orange-600">
                            {formatCurrency((donor.total_amount || 0) - (donor.paid_amount || 0))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              donor.payment_status === 'paid'
                                ? 'default'
                                : donor.payment_status === 'partial'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {donor.payment_status === 'paid'
                              ? 'Paid'
                              : donor.payment_status === 'partial'
                              ? 'Partial'
                              : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(donor.payment_status === 'partial' ||
                            donor.payment_status === 'pending') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedDonor(donor);
                                setPaymentDialogOpen(true);
                              }}
                            >
                              <CreditCard className="h-3 w-3 mr-1" />
                              Add Payment
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedDonor && (
        <PaymentHistoryDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          donor={selectedDonor}
          onSuccess={() => {
            fetchSevaAndDonors();
            setPaymentDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
