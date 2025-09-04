-- Add 'warning' status to fees table for monthly fee cycle system
-- Run this in your Supabase SQL Editor

-- 1. Drop the existing constraint
ALTER TABLE fees DROP CONSTRAINT IF EXISTS fees_status_check;

-- 2. Add the new constraint with 'warning' status
ALTER TABLE fees ADD CONSTRAINT fees_status_check 
CHECK (status IN ('pending', 'paid', 'overdue', 'partial', 'warning'));

-- 3. Verify the constraint was added
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'fees_status_check';

-- 4. Test the new status by updating a sample record (optional)
-- UPDATE fees SET status = 'warning' WHERE id = 'some-fee-id';

-- 5. Show current fee statuses
SELECT 
  status,
  COUNT(*) as count
FROM fees 
GROUP BY status
ORDER BY status;
