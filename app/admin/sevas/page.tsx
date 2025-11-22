'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Seva } from '@/types';
import { SevaForm } from '@/components/forms/seva-form';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function AdminSevasPage() {
  const [sevas, setSevas] = useState<Seva[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSeva, setEditingSeva] = useState<Seva | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchSevas();
  }, []);

  const fetchSevas = async () => {
    try {
      const { data, error } = await supabase
        .from('sevas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSevas(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch sevas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSeva = () => {
    setEditingSeva(null);
    setIsFormOpen(true);
  };

  const handleEditSeva = (seva: Seva) => {
    setEditingSeva(seva);
    setIsFormOpen(true);
  };

  const handleDeleteSeva = async (sevaId: string) => {
    if (!confirm('Are you sure you want to delete this seva? This will also delete all associated donors.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sevas')
        .delete()
        .eq('id', sevaId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Seva deleted successfully',
      });

      fetchSevas();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete seva',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingSeva(null);
    fetchSevas();
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seva Management</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage sevas
          </p>
        </div>
        <Button onClick={handleAddSeva}>
          <Plus className="mr-2 h-4 w-4" />
          Add Seva
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            Loading...
          </CardContent>
        </Card>
      ) : sevas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No sevas created yet.
            </p>
            <Button onClick={handleAddSeva}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Seva
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sevas.map((seva) => (
            <Card key={seva.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{seva.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {seva.description}
                    </CardDescription>
                  </div>
                  {!seva.is_active && (
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Slots:</span>
                    <span className="font-medium">{seva.total_slots}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Booked:</span>
                    <span className="font-medium text-green-600">
                      {seva.booked_slots}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className="font-medium text-blue-600">
                      {seva.total_slots - seva.booked_slots}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-saffron-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(seva.booked_slots / seva.total_slots) * 100}%`,
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Link href={`/admin/sevas/${seva.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEditSeva(seva)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteSeva(seva.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SevaForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        seva={editingSeva}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
