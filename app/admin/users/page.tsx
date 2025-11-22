'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserWithStats } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Donor } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [userDonors, setUserDonors] = useState<Donor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // For each user, get their donor stats
      const usersWithStats = await Promise.all(
        (usersData || []).map(async (user) => {
          const { data: donorsData } = await supabase
            .from('donors')
            .select('payment_amount, payment_status')
            .eq('added_by', user.id);

          const totalDonors = donorsData?.length || 0;
          const totalAmount = donorsData
            ?.filter(d => d.payment_status === 'paid')
            .reduce((sum, d) => sum + (d.payment_amount || 0), 0) || 0;

          return {
            ...user,
            total_donors: totalDonors,
            total_amount: totalAmount,
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (user: UserWithStats) => {
    setSelectedUser(user);

    try {
      const { data: donorsData } = await supabase
        .from('donors')
        .select('*')
        .eq('added_by', user.id)
        .order('created_at', { ascending: false });

      setUserDonors(donorsData || []);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching user donors:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-muted-foreground mt-2">
          Manage and view all registered users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Total users: {users.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No users registered yet
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Total Donors</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{formatDateTime(user.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.total_donors}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(user.total_amount || 0)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewUser(user)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Donors
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Donors added by {selectedUser?.full_name}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.email} • {userDonors.length} total donors
            </DialogDescription>
          </DialogHeader>

          {userDonors.length === 0 ? (
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
                    <TableHead>Contact</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userDonors.map((donor) => (
                    <TableRow key={donor.id}>
                      <TableCell className="font-mono text-xs">
                        {donor.enrollment_number}
                      </TableCell>
                      <TableCell className="font-medium">{donor.donor_name}</TableCell>
                      <TableCell className="text-sm">
                        {donor.contact_phone || donor.contact_email || 'N/A'}
                      </TableCell>
                      <TableCell>{formatCurrency(donor.payment_amount)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={donor.payment_status === 'paid' ? 'default' : 'secondary'}
                        >
                          {donor.payment_status === 'paid' ? 'Paid' : 'Pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
