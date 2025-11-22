'use client';

import { Donor } from '@/types';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
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

interface DonorTableProps {
  donors: Donor[];
  onEdit: (donor: Donor) => void;
  onDelete: (donorId: string) => void;
}

export function DonorTable({ donors, onEdit, onDelete }: DonorTableProps) {
  if (donors.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No donors added yet. Click &quot;Add Donor&quot; to get started.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Enrollment #</TableHead>
            <TableHead>Donor Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Payment Mode</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                {donor.payment_mode ? (
                  <Badge variant="outline">{donor.payment_mode}</Badge>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>{formatCurrency(donor.payment_amount)}</TableCell>
              <TableCell>{formatDate(donor.payment_date)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    donor.payment_status === 'paid'
                      ? 'default'
                      : donor.payment_status === 'partial'
                      ? 'outline'
                      : 'secondary'
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
                <Badge
                  variant={donor.is_active ? 'default' : 'destructive'}
                >
                  {donor.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(donor)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(donor.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
