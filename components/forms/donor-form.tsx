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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Donor } from '@/types';

const donorSchema = z.object({
  donor_name: z.string().min(1, 'Name is required'),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  payment_mode: z.enum(['Cash', 'Online', 'Cheque', 'UPI']).optional(),
  total_amount: z.string().optional(),
  paid_amount: z.string().optional(),
  payment_date: z.string().optional(),
  payment_status: z.enum(['pending', 'partial', 'paid']),
  is_active: z.boolean().default(true),
});

type DonorFormValues = z.infer<typeof donorSchema>;

interface DonorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sevaId: string;
  donor?: Donor | null;
  onSuccess: () => void;
}

export function DonorForm({ open, onOpenChange, sevaId, donor, onSuccess }: DonorFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();
  const [sevaAmounts, setSevaAmounts] = useState<number[]>([]);
  const [selectedAmount, setSelectedAmount] = useState<string>('custom');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DonorFormValues>({
    resolver: zodResolver(donorSchema),
    defaultValues: {
      donor_name: '',
      contact_phone: '',
      contact_email: '',
      total_amount: '',
      paid_amount: '',
      payment_date: '',
      payment_status: 'pending',
      is_active: true,
    },
  });

  // Fetch seva amount options
  useEffect(() => {
    const fetchSevaAmounts = async () => {
      const { data } = await supabase
        .from('sevas')
        .select('amount_options')
        .eq('id', sevaId)
        .single();

      if (data?.amount_options) {
        setSevaAmounts(data.amount_options);
      }
    };

    if (sevaId) {
      fetchSevaAmounts();
    }
  }, [sevaId, supabase]);

  const paymentStatus = watch('payment_status');
  const isActive = watch('is_active');

  useEffect(() => {
    if (donor) {
      const totalAmt = donor.total_amount?.toString() || '';
      const paidAmt = donor.paid_amount?.toString() || '';

      reset({
        donor_name: donor.donor_name,
        contact_phone: donor.contact_phone || '',
        contact_email: donor.contact_email || '',
        payment_mode: donor.payment_mode || undefined,
        total_amount: totalAmt,
        paid_amount: paidAmt,
        payment_date: donor.payment_date || '',
        payment_status: donor.payment_status,
        is_active: donor.is_active ?? true,
      });

      // Check if total amount matches one of the seva amounts
      if (donor.total_amount && sevaAmounts.includes(donor.total_amount)) {
        setSelectedAmount(donor.total_amount.toString());
      } else if (donor.total_amount) {
        setSelectedAmount('custom');
      }
    } else {
      reset({
        donor_name: '',
        contact_phone: '',
        contact_email: '',
        total_amount: '',
        paid_amount: '',
        payment_date: '',
        payment_status: 'pending',
        is_active: true,
      });
      setSelectedAmount('custom');
    }
  }, [donor, reset, sevaAmounts]);

  const onSubmit = async (data: DonorFormValues) => {
    if (!user) return;

    try {
      const totalAmount = data.total_amount ? parseFloat(data.total_amount) : 0;
      const paidAmount = data.paid_amount ? parseFloat(data.paid_amount) : 0;

      const donorData = {
        seva_id: sevaId,
        added_by: user.id,
        donor_name: data.donor_name,
        contact_phone: data.contact_phone || null,
        contact_email: data.contact_email || null,
        payment_mode: data.payment_mode || null,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        payment_date: data.payment_date || null,
        payment_status: data.payment_status,
        is_active: data.is_active,
      };

      if (donor) {
        // Update existing donor
        const { error } = await supabase
          .from('donors')
          .update(donorData)
          .eq('id', donor.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Donor updated successfully',
        });
      } else {
        // Create new donor
        const { error } = await supabase
          .from('donors')
          .insert(donorData);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Donor added successfully',
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save donor',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{donor ? 'Edit Donor' : 'Add New Donor'}</DialogTitle>
          <DialogDescription>
            {donor ? 'Update donor information' : 'Add a new donor for this seva'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="donor_name">Donor Name *</Label>
            <Input
              id="donor_name"
              {...register('donor_name')}
              placeholder="Enter donor name"
            />
            {errors.donor_name && (
              <p className="text-sm text-destructive">{errors.donor_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              {...register('contact_phone')}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              {...register('contact_email')}
              placeholder="donor@example.com"
            />
            {errors.contact_email && (
              <p className="text-sm text-destructive">{errors.contact_email.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between space-x-2 py-2">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Donor Status</Label>
              <p className="text-xs text-muted-foreground">
                Active donors can participate in sevas
              </p>
            </div>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
          </div>

          {sevaAmounts && sevaAmounts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="amount_selection">Select Amount</Label>
              <Select
                value={selectedAmount}
                onValueChange={(value) => {
                  setSelectedAmount(value);
                  if (value !== 'custom') {
                    setValue('total_amount', value);
                  } else {
                    setValue('total_amount', '');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select amount option" />
                </SelectTrigger>
                <SelectContent>
                  {sevaAmounts.map((amount) => (
                    <SelectItem key={amount} value={amount.toString()}>
                      ₹{amount.toLocaleString('en-IN')}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="total_amount">Total Amount</Label>
            <Input
              id="total_amount"
              type="number"
              step="0.01"
              {...register('total_amount')}
              placeholder="0.00"
              disabled={selectedAmount !== 'custom' && sevaAmounts.length > 0}
            />
            <p className="text-xs text-muted-foreground">
              Total commitment amount for this seva
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paid_amount">Paid Amount</Label>
            <Input
              id="paid_amount"
              type="number"
              step="0.01"
              {...register('paid_amount')}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Amount paid so far (leave 0 for pending, full amount for paid)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_status">Payment Status *</Label>
            <Select
              value={paymentStatus}
              onValueChange={(value) => setValue('payment_status', value as 'pending' | 'partial' | 'paid')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Status will auto-update based on paid amount
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_mode">Payment Mode</Label>
            <Select
              onValueChange={(value) => setValue('payment_mode', value as any)}
              defaultValue={donor?.payment_mode || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">Payment Date</Label>
            <Input
              id="payment_date"
              type="date"
              {...register('payment_date')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : donor ? 'Update' : 'Add Donor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
