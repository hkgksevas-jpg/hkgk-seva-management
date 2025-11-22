-- Add total_amount and paid_amount columns to donors table
ALTER TABLE donors
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) CHECK (total_amount >= 0),
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0 CHECK (paid_amount >= 0);

-- Migrate existing payment_amount data to paid_amount
UPDATE donors
SET paid_amount = COALESCE(payment_amount, 0),
    total_amount = COALESCE(payment_amount, 0)
WHERE paid_amount IS NULL OR total_amount IS NULL;

-- Drop the old payment_status constraint
ALTER TABLE donors
DROP CONSTRAINT IF EXISTS donors_payment_status_check;

-- Add new payment_status constraint that includes 'partial'
ALTER TABLE donors
ADD CONSTRAINT donors_payment_status_check
CHECK (payment_status IN ('pending', 'partial', 'paid'));

-- Update the trigger function to handle partial payments as booked
CREATE OR REPLACE FUNCTION update_seva_booked_slots()
RETURNS TRIGGER AS $$
BEGIN
  -- If payment status changed from pending to paid/partial, increment booked_slots
  IF (TG_OP = 'UPDATE' AND OLD.payment_status = 'pending' AND NEW.payment_status IN ('paid', 'partial')) THEN
    UPDATE sevas
    SET booked_slots = booked_slots + 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.seva_id;
  END IF;

  -- If payment status changed from paid/partial to pending, decrement booked_slots
  IF (TG_OP = 'UPDATE' AND OLD.payment_status IN ('paid', 'partial') AND NEW.payment_status = 'pending') THEN
    UPDATE sevas
    SET booked_slots = booked_slots - 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.seva_id;
  END IF;

  -- If new donor is added with paid/partial status, increment booked_slots
  IF (TG_OP = 'INSERT' AND NEW.payment_status IN ('paid', 'partial')) THEN
    UPDATE sevas
    SET booked_slots = booked_slots + 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.seva_id;
  END IF;

  -- If donor is deleted and was paid/partial, decrement booked_slots
  IF (TG_OP = 'DELETE' AND OLD.payment_status IN ('paid', 'partial')) THEN
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

-- Add comment for clarity
COMMENT ON COLUMN donors.total_amount IS 'Total commitment amount for the seva';
COMMENT ON COLUMN donors.paid_amount IS 'Amount paid so far (can be partial)';
COMMENT ON COLUMN donors.payment_amount IS 'DEPRECATED: Use paid_amount instead';
