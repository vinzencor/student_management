-- Test External Payment Flow
-- Run this to verify external payments are working correctly

-- 1. Check if required tables exist
SELECT 
  'external_fee_payments' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'external_fee_payments') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'transactions' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'fees' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fees') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT
  'students' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students')
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- 2. Check if transactions table has source column
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
  AND column_name IN ('source', 'sub_category', 'related_id')
ORDER BY column_name;

-- 3. Check recent external payments and their verification status
SELECT 
  efp.id,
  efp.student_name,
  efp.course_name,
  efp.payment_amount,
  efp.status,
  efp.verified_at,
  efp.created_at
FROM external_fee_payments efp
ORDER BY efp.created_at DESC
LIMIT 10;

-- 4. Check if verified payments have corresponding fee records
SELECT 
  efp.student_name,
  efp.payment_amount as payment_amount,
  efp.course_name,
  efp.status as payment_status,
  f.amount as fee_total,
  f.paid_amount as fee_paid,
  f.status as fee_status,
  CASE 
    WHEN f.id IS NULL THEN '❌ NO FEE RECORD'
    WHEN f.paid_amount = 0 THEN '❌ PAYMENT NOT REFLECTED'
    ELSE '✅ PAYMENT REFLECTED'
  END as fee_sync_status
FROM external_fee_payments efp
LEFT JOIN students s ON efp.student_id = s.id
LEFT JOIN fees f ON s.id = f.student_id
WHERE efp.status = 'verified'
ORDER BY efp.created_at DESC
LIMIT 10;

-- 5. Check if verified payments have corresponding transaction records
SELECT 
  efp.student_name,
  efp.payment_amount,
  efp.status as payment_status,
  t.amount as transaction_amount,
  t.source as transaction_source,
  t.category as transaction_category,
  CASE 
    WHEN t.id IS NULL THEN '❌ NO TRANSACTION RECORD'
    WHEN t.source != 'external_payment' THEN '⚠️ WRONG SOURCE'
    ELSE '✅ TRANSACTION RECORDED'
  END as transaction_sync_status
FROM external_fee_payments efp
LEFT JOIN transactions t ON efp.student_id = t.related_id 
  AND efp.payment_amount = t.amount 
  AND efp.payment_date = t.date
WHERE efp.status = 'verified'
ORDER BY efp.created_at DESC
LIMIT 10;

-- 6. Check fee amounts vs payment amounts (should match for proper sync)
SELECT
  efp.student_name,
  efp.payment_amount,
  efp.course_name,
  efp.course_fee,
  f.amount as fee_total,
  f.paid_amount as fee_paid,
  f.status as fee_status,
  CASE
    WHEN f.paid_amount = efp.payment_amount THEN '✅ AMOUNTS MATCH'
    WHEN f.paid_amount = 0 THEN '❌ PAYMENT NOT REFLECTED'
    WHEN f.paid_amount != efp.payment_amount THEN '⚠️ AMOUNT MISMATCH'
    ELSE '❓ UNKNOWN STATUS'
  END as amount_sync_status
FROM external_fee_payments efp
LEFT JOIN students s ON efp.student_id = s.id
LEFT JOIN fees f ON s.id = f.student_id
WHERE efp.status = 'verified'
ORDER BY efp.created_at DESC
LIMIT 10;

-- 7. Summary of external payment integration status
SELECT
  COUNT(*) as total_verified_payments,
  COUNT(f.id) as payments_with_fee_records,
  COUNT(t.id) as payments_with_transaction_records,
  SUM(CASE WHEN f.paid_amount > 0 THEN 1 ELSE 0 END) as fees_with_paid_amount,
  ROUND(COUNT(f.id) * 100.0 / COUNT(*), 2) as fee_sync_percentage,
  ROUND(COUNT(t.id) * 100.0 / COUNT(*), 2) as transaction_sync_percentage,
  ROUND(SUM(CASE WHEN f.paid_amount > 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as payment_reflection_percentage
FROM external_fee_payments efp
LEFT JOIN students s ON efp.student_id = s.id
LEFT JOIN fees f ON s.id = f.student_id
LEFT JOIN transactions t ON efp.student_id = t.related_id
  AND efp.payment_amount = t.amount
  AND efp.payment_date = t.date
  AND t.source = 'external_payment'
WHERE efp.status = 'verified';

-- 8. Check for any errors or inconsistencies
SELECT 
  'Missing Fee Records' as issue_type,
  COUNT(*) as count
FROM external_fee_payments efp
LEFT JOIN students s ON efp.student_id = s.id
LEFT JOIN fees f ON s.id = f.student_id
WHERE efp.status = 'verified' AND f.id IS NULL

UNION ALL

SELECT 
  'Zero Paid Amount in Fees' as issue_type,
  COUNT(*) as count
FROM external_fee_payments efp
LEFT JOIN students s ON efp.student_id = s.id
LEFT JOIN fees f ON s.id = f.student_id
WHERE efp.status = 'verified' AND f.paid_amount = 0

UNION ALL

SELECT 
  'Missing Transaction Records' as issue_type,
  COUNT(*) as count
FROM external_fee_payments efp
LEFT JOIN transactions t ON efp.student_id = t.related_id 
  AND efp.payment_amount = t.amount 
  AND efp.payment_date = t.date
  AND t.source = 'external_payment'
WHERE efp.status = 'verified' AND t.id IS NULL;
