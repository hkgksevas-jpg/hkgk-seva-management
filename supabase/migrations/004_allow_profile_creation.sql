-- Allow users to insert their own profile during login if it doesn't exist
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
