-- Fix Missing External Payment Records
-- This script will create missing fee and transaction records for verified external payments

-- 1. First, ensure the transactions table has the required columns
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS related_id UUID;

-- 2. Create missing fee records for verified external payments
INSERT INTO fees (
  student_id, course_id, amount, paid_amount, due_date, paid_date,
  status, payment_date, payment_method, fee_type, description, created_at
)
SELECT DISTINCT
  efp.student_id,
  c.id as course_id,
  COALESCE(c.price, efp.course_fee, efp.payment_amount) as amount,
  efp.payment_amount as paid_amount,
  CURRENT_DATE + INTERVAL '30 days' as due_date,
  CASE 
    WHEN efp.payment_amount >= COALESCE(c.price, efp.course_fee, efp.payment_amount) 
    THEN efp.payment_date 
    ELSE NULL 
  END as paid_date,
  CASE 
    WHEN efp.payment_amount >= COALESCE(c.price, efp.course_fee, efp.payment_amount) 
    THEN 'paid'
    WHEN efp.payment_amount > 0 
    THEN 'partial'
    ELSE 'pending'
  END as status,
  efp.payment_date,
  efp.payment_method,
  'tuition' as fee_type,
  'External payment verified - ' || COALESCE(efp.course_name, 'Course fee') as description,
  efp.verified_at
FROM external_fee_payments efp
LEFT JOIN courses c ON efp.course_name = c.name
LEFT JOIN fees f ON efp.student_id = f.student_id
WHERE efp.status = 'verified' 
  AND efp.student_id IS NOT NULL
  AND f.id IS NULL;

-- 3. Update existing fee records that have zero paid_amount but should have payment reflected
UPDATE fees 
SET 
  paid_amount = COALESCE(paid_amount, 0) + efp.payment_amount,
  status = CASE 
    WHEN COALESCE(paid_amount, 0) + efp.payment_amount >= amount THEN 'paid'
    WHEN COALESCE(paid_amount, 0) + efp.payment_amount > 0 THEN 'partial'
    ELSE 'pending'
  END,
  paid_date = CASE 
    WHEN COALESCE(paid_amount, 0) + efp.payment_amount >= amount THEN efp.payment_date
    ELSE paid_date
  END,
  payment_date = efp.payment_date,
  payment_method = efp.payment_method,
  updated_at = NOW()
FROM external_fee_payments efp
WHERE fees.student_id = efp.student_id
  AND efp.status = 'verified'
  AND fees.paid_amount = 0
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.related_id = efp.student_id 
      AND t.amount = efp.payment_amount 
      AND t.date = efp.payment_date
      AND t.source = 'external_payment'
  );

-- 4. Create missing transaction records for verified external payments
INSERT INTO transactions (
  type, date, amount, category, sub_category, related_id,
  payment_mode, description, image_url, source, created_at
)
SELECT DISTINCT
  'income' as type,
  efp.payment_date,
  efp.payment_amount,
  'Student Fees' as category,
  efp.student_name as sub_category,
  efp.student_id as related_id,
  efp.payment_method as payment_mode,
  'External payment verified - ' || efp.student_name || ' - ' || COALESCE(efp.course_name, 'Course fee') as description,
  efp.payment_proof_url as image_url,
  'external_payment' as source,
  efp.verified_at as created_at
FROM external_fee_payments efp
WHERE efp.status = 'verified'
  AND efp.student_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.related_id = efp.student_id 
      AND t.amount = efp.payment_amount 
      AND t.date = efp.payment_date
      AND t.source = 'external_payment'
  );

-- 5. Create income table if it doesn't exist (optional legacy support)
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL,
  sub_type VARCHAR(100),
  amount DECIMAL(12,2) NOT NULL,
  payment_mode VARCHAR(50),
  remarks TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create missing income records for verified external payments (legacy support)
INSERT INTO income (
  date, type, sub_type, amount, payment_mode, remarks, image_url
)
SELECT DISTINCT
  efp.payment_date,
  'student_fees' as type,
  efp.student_name as sub_type,
  efp.payment_amount,
  efp.payment_method as payment_mode,
  'External payment verified - ' || COALESCE(efp.course_name, 'Course fee') as remarks,
  efp.payment_proof_url as image_url
FROM external_fee_payments efp
WHERE efp.status = 'verified'
  AND NOT EXISTS (
    SELECT 1 FROM income i
    WHERE i.sub_type = efp.student_name
      AND i.amount = efp.payment_amount
      AND i.date = efp.payment_date
      AND i.remarks LIKE '%External payment verified%'
  );

-- 6. Show summary of what was fixed
SELECT 
  'Fee Records Created' as action,
  COUNT(*) as count
FROM fees f
JOIN external_fee_payments efp ON f.student_id = efp.student_id
WHERE efp.status = 'verified' 
  AND f.description LIKE '%External payment verified%'
  AND f.created_at >= NOW() - INTERVAL '1 minute'

UNION ALL

SELECT 
  'Transaction Records Created' as action,
  COUNT(*) as count
FROM transactions t
WHERE t.source = 'external_payment'
  AND t.created_at >= NOW() - INTERVAL '1 minute'

UNION ALL

SELECT
  'Income Records Created' as action,
  COALESCE(COUNT(*), 0) as count
FROM income i
WHERE i.remarks LIKE '%External payment verified%'
  AND i.date >= CURRENT_DATE - INTERVAL '30 days';

-- 7. Verify the fix worked
SELECT 
  efp.student_name,
  efp.payment_amount,
  efp.course_name,
  efp.status as payment_status,
  f.amount as fee_total,
  f.paid_amount as fee_paid,
  f.status as fee_status,
  t.amount as transaction_amount,
  t.source as transaction_source,
  CASE 
    WHEN f.id IS NOT NULL AND f.paid_amount > 0 AND t.id IS NOT NULL 
    THEN '✅ FULLY SYNCED'
    WHEN f.id IS NOT NULL AND f.paid_amount > 0 
    THEN '⚠️ FEE SYNCED, MISSING TRANSACTION'
    WHEN t.id IS NOT NULL 
    THEN '⚠️ TRANSACTION SYNCED, MISSING FEE'
    ELSE '❌ NOT SYNCED'
  END as sync_status
FROM external_fee_payments efp
LEFT JOIN students s ON efp.student_id = s.id
LEFT JOIN fees f ON s.id = f.student_id
LEFT JOIN transactions t ON efp.student_id = t.related_id 
  AND efp.payment_amount = t.amount 
  AND efp.payment_date = t.date
  AND t.source = 'external_payment'
WHERE efp.status = 'verified'
ORDER BY efp.created_at DESC
LIMIT 10;
