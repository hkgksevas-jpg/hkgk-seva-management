-- Add amount options to sevas table
ALTER TABLE sevas
ADD COLUMN amount_options DECIMAL(10,2)[] DEFAULT '{}';

-- Add partial payment tracking to donors table
ALTER TABLE donors
ADD COLUMN total_amount DECIMAL(10,2) DEFAULT 0 CHECK (total_amount >= 0),
ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 0 CHECK (paid_amount >= 0),
ADD COLUMN remaining_amount DECIMAL(10,2) DEFAULT 0 CHECK (remaining_amount >= 0);

-- Update payment_status to include 'partial' option
ALTER TABLE donors
DROP CONSTRAINT IF EXISTS donors_payment_status_check;

ALTER TABLE donors
ADD CONSTRAINT donors_payment_status_check
CHECK (payment_status IN ('pending', 'partial', 'paid'));

-- Create a function to calculate remaining amount
CREATE OR REPLACE FUNCTION calculate_remaining_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.remaining_amount := NEW.total_amount - NEW.paid_amount;

  -- Update payment status based on amounts
  IF NEW.paid_amount = 0 THEN
    NEW.payment_status := 'pending';
  ELSIF NEW.paid_amount >= NEW.total_amount THEN
    NEW.payment_status := 'paid';
  ELSE
    NEW.payment_status := 'partial';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate remaining amount
CREATE TRIGGER trigger_calculate_remaining_amount
  BEFORE INSERT OR UPDATE ON donors
  FOR EACH ROW
  EXECUTE FUNCTION calculate_remaining_amount();

-- Create payments history table for tracking partial payments
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES donors(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_mode TEXT CHECK (payment_mode IN ('Cash', 'Online', 'Cheque', 'UPI')),
  payment_date DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for payment history
CREATE INDEX idx_payment_history_donor_id ON payment_history(donor_id);

-- Add comment for clarity
COMMENT ON COLUMN sevas.amount_options IS 'Array of available amount options for this seva (e.g., {5000, 10000, 15000})';
COMMENT ON COLUMN donors.total_amount IS 'Total amount the donor committed to pay';
COMMENT ON COLUMN donors.paid_amount IS 'Total amount paid so far';
COMMENT ON COLUMN donors.remaining_amount IS 'Remaining amount to be paid';
COMMENT ON TABLE payment_history IS 'History of all payments made by donors for partial payment tracking';
