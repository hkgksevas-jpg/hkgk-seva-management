'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalSevas: 0,
    totalUsers: 0,
    totalDonors: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total sevas
      const { count: sevasCount } = await supabase
        .from('sevas')
        .select('*', { count: 'exact', head: true });

      // Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user');

      // Get total donors and revenue
      const { data: donorsData } = await supabase
        .from('donors')
        .select('payment_amount, payment_status');

      const paidDonors = donorsData?.filter(d => d.payment_status === 'paid') || [];
      const totalRevenue = paidDonors.reduce(
        (sum, donor) => sum + (donor.payment_amount || 0),
        0
      );

      setStats({
        totalSevas: sevasCount || 0,
        totalUsers: usersCount || 0,
        totalDonors: paidDonors.length,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Sevas',
      value: stats.totalSevas,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Donors',
      value: stats.totalDonors,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-saffron-600',
      bgColor: 'bg-saffron-50',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your Seva management system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
