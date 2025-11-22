import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, email, fullName, role } = await request.json();

    // Create Supabase admin client (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ profile: existingProfile });
    }

    // Generate referral code
    const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create profile
    const { data: newProfile, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        full_name: fullName || email.split('@')[0] || 'User',
        referral_code: referralCode,
        role: role || 'user'
      })
      .select('id, role')
      .single();

    if (error) {
      console.error('Profile creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create profile', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: newProfile });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
