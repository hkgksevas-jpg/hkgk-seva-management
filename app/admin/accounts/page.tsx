'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { formatCurrency, downloadCSV } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface RevenueStats {
  totalRevenue: number;
  bySeva: { seva_name: string; amount: number; count: number }[];
  byPaymentMode: { mode: string; amount: number; count: number }[];
  byStatus: { status: string; amount: number; count: number }[];
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function AdminAccountsPage() {
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    bySeva: [],
    byPaymentMode: [],
    byStatus: [],
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      // Fetch all donors with seva info
      const { data: donorsData } = await supabase
        .from('donors')
        .select(`
          *,
          sevas:seva_id (
            id,
            name
          )
        `);

      if (!donorsData) return;

      // Calculate total revenue
      const totalRevenue = donorsData
        .filter(d => d.payment_status === 'paid')
        .reduce((sum, d) => sum + (d.payment_amount || 0), 0);

      // Group by seva
      const sevaMap = new Map<string, { amount: number; count: number; name: string }>();
      donorsData
        .filter(d => d.payment_status === 'paid')
        .forEach(donor => {
          const sevaName = (donor.sevas as any)?.name || 'Unknown';
          const current = sevaMap.get(sevaName) || { amount: 0, count: 0, name: sevaName };
          sevaMap.set(sevaName, {
            amount: current.amount + (donor.payment_amount || 0),
            count: current.count + 1,
            name: sevaName,
          });
        });

      const bySeva = Array.from(sevaMap.values()).map(v => ({
        seva_name: v.name,
        amount: v.amount,
        count: v.count,
      }));

      // Group by payment mode
      const modeMap = new Map<string, { amount: number; count: number }>();
      donorsData
        .filter(d => d.payment_status === 'paid' && d.payment_mode)
        .forEach(donor => {
          const mode = donor.payment_mode || 'Not Specified';
          const current = modeMap.get(mode) || { amount: 0, count: 0 };
          modeMap.set(mode, {
            amount: current.amount + (donor.payment_amount || 0),
            count: current.count + 1,
          });
        });

      const byPaymentMode = Array.from(modeMap.entries()).map(([mode, data]) => ({
        mode,
        ...data,
      }));

      // Group by status
      const statusMap = new Map<string, { amount: number; count: number }>();
      donorsData.forEach(donor => {
        const status = donor.payment_status === 'paid' ? 'Paid' : 'Pending';
        const current = statusMap.get(status) || { amount: 0, count: 0 };
        statusMap.set(status, {
          amount: current.amount + (donor.payment_amount || 0),
          count: current.count + 1,
        });
      });

      const byStatus = Array.from(statusMap.entries()).map(([status, data]) => ({
        status,
        ...data,
      }));

      setStats({
        totalRevenue,
        bySeva,
        byPaymentMode,
        byStatus,
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportSevaReport = () => {
    const data = stats.bySeva.map(item => ({
      'Seva Name': item.seva_name,
      'Total Amount': item.amount,
      'Number of Donors': item.count,
    }));
    downloadCSV(data, 'seva-revenue-report');
  };

  const handleExportPaymentModeReport = () => {
    const data = stats.byPaymentMode.map(item => ({
      'Payment Mode': item.mode,
      'Total Amount': item.amount,
      'Number of Transactions': item.count,
    }));
    downloadCSV(data, 'payment-mode-report');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Accounts & Reports</h1>
        <p className="text-muted-foreground mt-2">
          Financial reports and analytics
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{formatCurrency(stats.totalRevenue)}</CardTitle>
            <CardDescription>Total Revenue (Paid Donors)</CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="seva" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="seva">By Seva</TabsTrigger>
            <TabsTrigger value="payment">By Payment Mode</TabsTrigger>
            <TabsTrigger value="status">By Status</TabsTrigger>
          </TabsList>

          <TabsContent value="seva" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue by Seva</CardTitle>
                    <CardDescription>Breakdown of revenue per seva</CardDescription>
                  </div>
                  <Button onClick={handleExportSevaReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {stats.bySeva.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.bySeva}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="seva_name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Bar dataKey="amount" fill="#f97316" />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-6 space-y-2">
                      {stats.bySeva.map((item) => (
                        <div
                          key={item.seva_name}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{item.seva_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.count} donors
                            </p>
                          </div>
                          <p className="text-lg font-bold text-saffron-600">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue by Payment Mode</CardTitle>
                    <CardDescription>Distribution across payment methods</CardDescription>
                  </div>
                  <Button onClick={handleExportPaymentModeReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {stats.byPaymentMode.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.byPaymentMode}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ mode, percent }) =>
                            `${mode}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {stats.byPaymentMode.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="mt-6 space-y-2">
                      {stats.byPaymentMode.map((item, index) => (
                        <div
                          key={item.mode}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div>
                              <p className="font-medium">{item.mode}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.count} transactions
                              </p>
                            </div>
                          </div>
                          <p className="text-lg font-bold text-saffron-600">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Payment Status</CardTitle>
                <CardDescription>Paid vs Pending payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.byStatus.map((item) => (
                    <div
                      key={item.status}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-lg">{item.status}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.count} donors
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-saffron-600">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
