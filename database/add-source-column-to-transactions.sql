-- Add source column to transactions table for tracking payment origins
-- Run this in your Supabase SQL Editor

-- Add source column if it doesn't exist
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';

-- Add sub_category column if it doesn't exist  
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100);

-- Add related_id column if it doesn't exist
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS related_id UUID;

-- Update existing transactions to have proper source values
UPDATE transactions 
SET source = 'manual' 
WHERE source IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(source);

-- Add comment to explain source values
COMMENT ON COLUMN transactions.source IS 'Source of transaction: manual, external_payment, fee_management';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;
