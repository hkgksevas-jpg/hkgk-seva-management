'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function SetupAdminPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileInfo, setProfileInfo] = useState<any>(null);
  const { toast } = useToast();

  const checkProfile = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter an email',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/check-profile?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check profile');
      }

      setProfileInfo(data.profile);
      toast({
        title: 'Profile Found',
        description: `Current role: ${data.profile.role}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setProfileInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const setAsAdmin = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter an email',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/set-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set admin');
      }

      toast({
        title: 'Success',
        description: 'User has been set as admin! Please log out and log back in.',
      });

      // Refresh profile info
      checkProfile();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-saffron-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-saffron-600">
            Admin Setup
          </CardTitle>
          <CardDescription>
            Check and set admin role for users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@harekrishna.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={checkProfile}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Check Profile
            </Button>
            <Button
              onClick={setAsAdmin}
              className="flex-1"
              disabled={loading}
            >
              Set as Admin
            </Button>
          </div>

          {profileInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Profile Information:</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Email:</strong> {profileInfo.email}</p>
                <p><strong>Name:</strong> {profileInfo.full_name}</p>
                <p><strong>Role:</strong> <span className={profileInfo.role === 'admin' ? 'text-green-600 font-bold' : 'text-orange-600'}>{profileInfo.role}</span></p>
                <p><strong>Created:</strong> {new Date(profileInfo.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="font-semibold mb-2">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Enter the email address of the user you want to make admin</li>
              <li>Click &quot;Check Profile&quot; to see current role</li>
              <li>Click &quot;Set as Admin&quot; to change role to admin</li>
              <li>Log out and log back in to see admin dashboard</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
