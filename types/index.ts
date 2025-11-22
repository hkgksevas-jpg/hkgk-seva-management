import { Database } from './supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Seva = Database['public']['Tables']['sevas']['Row'];
export type Donor = Database['public']['Tables']['donors']['Row'];
export type Referral = Database['public']['Tables']['referrals']['Row'];

export type SevaWithStats = Seva & {
  user_booked_count?: number;
  user_blocked_count?: number;
  remaining_slots: number;
};

export type DonorWithDetails = Donor & {
  seva?: Seva;
  added_by_profile?: Profile;
};

export type UserWithStats = Profile & {
  total_donors?: number;
  total_amount?: number;
};

export interface SevaFormData {
  name: string;
  description?: string;
  total_slots: number;
}

export interface DonorFormData {
  donor_name: string;
  contact_phone?: string;
  contact_email?: string;
  payment_mode?: 'Cash' | 'Online' | 'Cheque' | 'UPI';
  payment_amount?: number;
  payment_date?: string;
  payment_status: 'pending' | 'partial' | 'paid';
  total_amount?: number;
  paid_amount?: number;
}

export interface PaymentHistory {
  id: string;
  donor_id: string;
  amount: number;
  payment_mode?: 'Cash' | 'Online' | 'Cheque' | 'UPI';
  payment_date: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface AuthFormData {
  email: string;
  password: string;
  full_name?: string;
  referral_code?: string;
}

export interface RevenueData {
  total_revenue: number;
  by_seva: { seva_name: string; amount: number }[];
  by_payment_mode: { mode: string; amount: number }[];
  by_date: { date: string; amount: number }[];
  payment_status_summary: { status: string; count: number; amount: number }[];
}
