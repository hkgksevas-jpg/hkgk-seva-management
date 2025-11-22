export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: 'user' | 'admin'
          referral_code: string
          referred_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role?: 'user' | 'admin'
          referral_code: string
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: 'user' | 'admin'
          referral_code?: string
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sevas: {
        Row: {
          id: string
          name: string
          description: string | null
          total_slots: number
          booked_slots: number
          created_by: string | null
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          total_slots: number
          booked_slots?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          total_slots?: number
          booked_slots?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      donors: {
        Row: {
          id: string
          enrollment_number: string
          seva_id: string
          added_by: string
          donor_name: string
          contact_phone: string | null
          contact_email: string | null
          payment_mode: 'Cash' | 'Online' | 'Cheque' | 'UPI' | null
          payment_amount: number | null
          total_amount: number | null
          paid_amount: number | null
          payment_date: string | null
          payment_status: 'pending' | 'partial' | 'paid'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          enrollment_number?: string
          seva_id: string
          added_by: string
          donor_name: string
          contact_phone?: string | null
          contact_email?: string | null
          payment_mode?: 'Cash' | 'Online' | 'Cheque' | 'UPI' | null
          payment_amount?: number | null
          total_amount?: number | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_status?: 'pending' | 'partial' | 'paid'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          enrollment_number?: string
          seva_id?: string
          added_by?: string
          donor_name?: string
          contact_phone?: string | null
          contact_email?: string | null
          payment_mode?: 'Cash' | 'Online' | 'Cheque' | 'UPI' | null
          payment_amount?: number | null
          total_amount?: number | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_status?: 'pending' | 'partial' | 'paid'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_user_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
