-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sevas table
CREATE TABLE sevas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  total_slots INTEGER NOT NULL CHECK (total_slots > 0),
  booked_slots INTEGER DEFAULT 0 CHECK (booked_slots >= 0),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT slots_check CHECK (booked_slots <= total_slots)
);

-- Donors table
CREATE TABLE donors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_number TEXT UNIQUE NOT NULL,
  seva_id UUID REFERENCES sevas(id) ON DELETE CASCADE NOT NULL,
  added_by UUID REFERENCES profiles(id) NOT NULL,
  donor_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  payment_mode TEXT CHECK (payment_mode IN ('Cash', 'Online', 'Cheque', 'UPI')),
  payment_amount DECIMAL(10,2) CHECK (payment_amount >= 0),
  payment_date DATE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Referrals tracking table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES profiles(id) NOT NULL,
  referred_user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(referrer_id, referred_user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_sevas_is_active ON sevas(is_active);
CREATE INDEX idx_donors_seva_id ON donors(seva_id);
CREATE INDEX idx_donors_added_by ON donors(added_by);
CREATE INDEX idx_donors_payment_status ON donors(payment_status);
CREATE INDEX idx_donors_enrollment_number ON donors(enrollment_number);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = code) INTO exists;

    EXIT WHEN NOT exists;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate enrollment number
CREATE OR REPLACE FUNCTION generate_enrollment_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  sequence_num INTEGER;
  enrollment_num TEXT;
BEGIN
  year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(
    CASE
      WHEN enrollment_number LIKE 'SEVA-' || year || '-%'
      THEN SUBSTRING(enrollment_number FROM LENGTH('SEVA-' || year || '-') + 1)::INTEGER
      ELSE 0
    END
  ), 0) + 1
  INTO sequence_num
  FROM donors;

  -- Format: SEVA-YYYY-NNNNN
  enrollment_num := 'SEVA-' || year || '-' || LPAD(sequence_num::TEXT, 5, '0');

  RETURN enrollment_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate enrollment number before insert
CREATE OR REPLACE FUNCTION set_enrollment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.enrollment_number IS NULL OR NEW.enrollment_number = '' THEN
    NEW.enrollment_number := generate_enrollment_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_enrollment_number
  BEFORE INSERT ON donors
  FOR EACH ROW
  EXECUTE FUNCTION set_enrollment_number();

-- Function to update seva booked_slots when donor payment status changes
CREATE OR REPLACE FUNCTION update_seva_booked_slots()
RETURNS TRIGGER AS $$
BEGIN
  -- If payment status changed from pending to paid, increment booked_slots
  IF (TG_OP = 'UPDATE' AND OLD.payment_status = 'pending' AND NEW.payment_status = 'paid') THEN
    UPDATE sevas
    SET booked_slots = booked_slots + 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.seva_id;
  END IF;

  -- If payment status changed from paid to pending, decrement booked_slots
  IF (TG_OP = 'UPDATE' AND OLD.payment_status = 'paid' AND NEW.payment_status = 'pending') THEN
    UPDATE sevas
    SET booked_slots = booked_slots - 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.seva_id;
  END IF;

  -- If new donor is added with paid status, increment booked_slots
  IF (TG_OP = 'INSERT' AND NEW.payment_status = 'paid') THEN
    UPDATE sevas
    SET booked_slots = booked_slots + 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.seva_id;
  END IF;

  -- If donor is deleted and was paid, decrement booked_slots
  IF (TG_OP = 'DELETE' AND OLD.payment_status = 'paid') THEN
    UPDATE sevas
    SET booked_slots = booked_slots - 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = OLD.seva_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_seva_booked_slots
  AFTER INSERT OR UPDATE OR DELETE ON donors
  FOR EACH ROW
  EXECUTE FUNCTION update_seva_booked_slots();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sevas_updated_at BEFORE UPDATE ON sevas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donors_updated_at BEFORE UPDATE ON donors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_code TEXT;
  referrer_id UUID;
BEGIN
  -- Generate referral code
  ref_code := generate_referral_code();

  -- Insert into profiles
  INSERT INTO profiles (id, email, full_name, referral_code, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    ref_code,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );

  -- Handle referral if present
  IF NEW.raw_user_meta_data->>'referred_by' IS NOT NULL THEN
    -- Find referrer by referral code
    SELECT id INTO referrer_id
    FROM profiles
    WHERE referral_code = NEW.raw_user_meta_data->>'referred_by';

    IF referrer_id IS NOT NULL THEN
      -- Update referred_by in profile
      UPDATE profiles
      SET referred_by = referrer_id
      WHERE id = NEW.id;

      -- Create referral record
      INSERT INTO referrals (referrer_id, referred_user_id)
      VALUES (referrer_id, NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
