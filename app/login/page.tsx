'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('No user data returned');
      }

      // Wait a bit for session to be established
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw new Error(`Failed to fetch profile: ${profileError.message}`);
      }

      // If profile doesn't exist, create one via API
      if (!profile) {
        const response = await fetch('/api/profile/ensure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.user.id,
            email: data.user.email,
            fullName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
            role: 'user'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Profile creation error:', errorData);
          throw new Error('Failed to create profile. Please contact support.');
        }

        const { profile: newProfile } = await response.json();

        toast({
          title: 'Success',
          description: 'Profile created and logged in successfully',
        });

        router.push('/user/sevas');
        router.refresh();
        return;
      }

      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });

      // Redirect based on role
      if (profile?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/user/sevas');
      }
      router.refresh();
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to login',
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
          <CardTitle className="text-3xl font-bold text-saffron-600">
            Hare Krishna
          </CardTitle>
          <CardDescription>
            Sign in to your Seva Management account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
