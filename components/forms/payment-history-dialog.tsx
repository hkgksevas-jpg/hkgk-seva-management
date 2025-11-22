'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Donor, PaymentHistory } from '@/types';
import { Plus } from 'lucide-react';

const paymentSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  payment_mode: z.enum(['Cash', 'Online', 'Cheque', 'UPI']),
  payment_date: z.string().min(1, 'Payment date is required'),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donor: Donor;
  onSuccess: () => void;
}

export function PaymentHistoryDialog({ open, onOpenChange, donor, onSuccess }: PaymentHistoryDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const fetchPaymentHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('donor_id', donor.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch payment history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && donor) {
      fetchPaymentHistory();
    }
  }, [open, donor]);

  const onSubmit = async (data: PaymentFormValues) => {
    if (!user) return;

    try {
      const paymentAmount = parseFloat(data.amount);
      const newPaidAmount = (donor.paid_amount || 0) + paymentAmount;

      // Add payment to history
      const { error: historyError } = await supabase
        .from('payment_history')
        .insert({
          donor_id: donor.id,
          amount: paymentAmount,
          payment_mode: data.payment_mode,
          payment_date: data.payment_date,
          notes: data.notes || null,
          created_by: user.id,
        });

      if (historyError) throw historyError;

      // Update donor's paid amount
      const { error: donorError } = await supabase
        .from('donors')
        .update({
          paid_amount: newPaidAmount,
          payment_mode: data.payment_mode,
          payment_date: data.payment_date,
        })
        .eq('id', donor.id);

      if (donorError) throw donorError;

      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
      });

      reset();
      fetchPaymentHistory();
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record payment',
        variant: 'destructive',
      });
    }
  };

  const remainingAmount = (donor.total_amount || 0) - (donor.paid_amount || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment History - {donor.donor_name}</DialogTitle>
          <DialogDescription>
            Track and manage partial payments for this donor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">₹{(donor.total_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid Amount:</span>
                <span className="font-medium text-green-600">₹{(donor.paid_amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground font-semibold">Remaining:</span>
                <span className="font-bold text-orange-600">₹{remainingAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${((donor.paid_amount || 0) / (donor.total_amount || 1)) * 100}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Add New Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Record New Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      {...register('amount')}
                      placeholder="0.00"
                    />
                    {errors.amount && (
                      <p className="text-sm text-destructive">{errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_mode">Payment Mode *</Label>
                    <Select
                      onValueChange={(value) => setValue('payment_mode', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Online">Online</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.payment_mode && (
                      <p className="text-sm text-destructive">{errors.payment_mode.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_date">Payment Date *</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    {...register('payment_date')}
                  />
                  {errors.payment_date && (
                    <p className="text-sm text-destructive">{errors.payment_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    {...register('notes')}
                    placeholder="Add any notes about this payment"
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Recording...' : 'Record Payment'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Payment History List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-4">Loading...</p>
              ) : payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No payments recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">₹{payment.amount.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.payment_mode} • {new Date(payment.payment_date).toLocaleDateString('en-IN')}
                        </p>
                        {payment.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
