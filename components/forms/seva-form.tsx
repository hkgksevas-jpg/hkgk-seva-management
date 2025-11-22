'use client';

import { useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Seva } from '@/types';

const sevaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  total_slots: z.string().min(1, 'Total slots is required'),
  amount_options: z.string().optional(),
  is_active: z.boolean().default(true),
});

type SevaFormValues = z.infer<typeof sevaSchema>;

interface SevaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seva?: Seva | null;
  onSuccess: () => void;
}

export function SevaForm({ open, onOpenChange, seva, onSuccess }: SevaFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SevaFormValues>({
    resolver: zodResolver(sevaSchema),
    defaultValues: {
      name: '',
      description: '',
      total_slots: '',
      amount_options: '',
      is_active: true,
    },
  });

  const isActive = watch('is_active');

  useEffect(() => {
    if (seva) {
      reset({
        name: seva.name,
        description: seva.description || '',
        total_slots: seva.total_slots.toString(),
        amount_options: seva.amount_options ? seva.amount_options.join(', ') : '',
        is_active: seva.is_active,
      });
    } else {
      reset({
        name: '',
        description: '',
        total_slots: '',
        amount_options: '',
        is_active: true,
      });
    }
  }, [seva, reset]);

  const onSubmit = async (data: SevaFormValues) => {
    if (!user) return;

    try {
      // Parse amount options from comma-separated string
      let amountOptionsArray: number[] = [];
      if (data.amount_options && data.amount_options.trim()) {
        amountOptionsArray = data.amount_options
          .split(',')
          .map(amt => parseFloat(amt.trim()))
          .filter(amt => !isNaN(amt) && amt > 0);
      }

      const sevaData = {
        name: data.name,
        description: data.description || null,
        total_slots: parseInt(data.total_slots),
        amount_options: amountOptionsArray,
        is_active: data.is_active,
        created_by: user.id,
      };

      if (seva) {
        // Update existing seva
        const { error } = await supabase
          .from('sevas')
          .update(sevaData)
          .eq('id', seva.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Seva updated successfully',
        });
      } else {
        // Create new seva
        const { error } = await supabase
          .from('sevas')
          .insert(sevaData);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Seva created successfully',
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save seva',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{seva ? 'Edit Seva' : 'Create New Seva'}</DialogTitle>
          <DialogDescription>
            {seva ? 'Update seva details' : 'Add a new seva to the system'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Seva Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter seva name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="Enter description (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_slots">Total Slots *</Label>
            <Input
              id="total_slots"
              type="number"
              min="1"
              {...register('total_slots')}
              placeholder="Enter total slots"
            />
            {errors.total_slots && (
              <p className="text-sm text-destructive">{errors.total_slots.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount_options">Amount Options</Label>
            <Input
              id="amount_options"
              {...register('amount_options')}
              placeholder="e.g., 5000, 10000, 15000"
            />
            <p className="text-xs text-muted-foreground">
              Enter comma-separated amounts that donors can choose from
            </p>
            {errors.amount_options && (
              <p className="text-sm text-destructive">{errors.amount_options.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active Status</Label>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
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
              {isSubmitting ? 'Saving...' : seva ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
