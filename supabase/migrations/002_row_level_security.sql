-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sevas ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sevas policies
CREATE POLICY "Anyone authenticated can view active sevas"
  ON sevas FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all sevas"
  ON sevas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert sevas"
  ON sevas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update sevas"
  ON sevas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete sevas"
  ON sevas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Donors policies
CREATE POLICY "Users can view own donors"
  ON donors FOR SELECT
  USING (added_by = auth.uid());

CREATE POLICY "Admins can view all donors"
  ON donors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own donors"
  ON donors FOR INSERT
  WITH CHECK (added_by = auth.uid());

CREATE POLICY "Users can update own donors"
  ON donors FOR UPDATE
  USING (added_by = auth.uid());

CREATE POLICY "Users can delete own donors"
  ON donors FOR DELETE
  USING (added_by = auth.uid());

-- Referrals policies
CREATE POLICY "Users can view own referrals as referrer"
  ON referrals FOR SELECT
  USING (referrer_id = auth.uid());

CREATE POLICY "Admins can view all referrals"
  ON referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);
