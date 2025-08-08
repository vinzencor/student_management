-- Update fees table to track paid amounts and remaining balances

-- Add paid_amount column to fees table
ALTER TABLE fees 
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) DEFAULT 0;

-- Add remaining_amount as computed column
ALTER TABLE fees 
ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(12,2) GENERATED ALWAYS AS (amount - COALESCE(paid_amount, 0)) STORED;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_fees_paid_amount ON fees(paid_amount);
CREATE INDEX IF NOT EXISTS idx_fees_remaining_amount ON fees(remaining_amount);

-- Update existing fees to have paid_amount = 0 where null
UPDATE fees SET paid_amount = 0 WHERE paid_amount IS NULL;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON fees TO authenticated;
