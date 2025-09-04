-- Simple External Payment Test (No Income Table)
-- Run this to check if external payments are working

-- 1. Check recent external payments
SELECT 
  'Recent External Payments' as section,
  efp.student_name,
  efp.payment_amount,
  efp.course_name,
  efp.status,
  efp.created_at
FROM external_fee_payments efp
ORDER BY efp.created_at DESC
LIMIT 5;

-- 2. Check if verified payments have fee records
SELECT 
  'Fee Records Check' as section,
  efp.student_name,
  efp.payment_amount as payment_amount,
  f.amount as fee_total,
  f.paid_amount as fee_paid,
  f.status as fee_status,
  CASE 
    WHEN f.id IS NULL THEN '❌ NO FEE RECORD'
    WHEN f.paid_amount = 0 THEN '❌ PAYMENT NOT REFLECTED'
    WHEN f.paid_amount > 0 THEN '✅ PAYMENT REFLECTED'
    ELSE '❓ UNKNOWN'
  END as status
FROM external_fee_payments efp
LEFT JOIN students s ON efp.student_id = s.id
LEFT JOIN fees f ON s.id = f.student_id
WHERE efp.status = 'verified'
ORDER BY efp.created_at DESC
LIMIT 5;

-- 3. Check if verified payments have transaction records
SELECT 
  'Transaction Records Check' as section,
  efp.student_name,
  efp.payment_amount,
  t.amount as transaction_amount,
  t.source,
  t.category,
  CASE 
    WHEN t.id IS NULL THEN '❌ NO TRANSACTION'
    WHEN t.source = 'external_payment' THEN '✅ TRANSACTION RECORDED'
    ELSE '⚠️ WRONG SOURCE'
  END as status
FROM external_fee_payments efp
LEFT JOIN transactions t ON efp.student_id = t.related_id 
  AND efp.payment_amount = t.amount 
  AND efp.payment_date = t.date
WHERE efp.status = 'verified'
ORDER BY efp.created_at DESC
LIMIT 5;

-- 4. Summary
SELECT 
  'SUMMARY' as section,
  COUNT(*) as total_verified_payments,
  SUM(CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END) as with_fee_records,
  SUM(CASE WHEN f.paid_amount > 0 THEN 1 ELSE 0 END) as with_payment_reflected,
  SUM(CASE WHEN t.id IS NOT NULL THEN 1 ELSE 0 END) as with_transaction_records
FROM external_fee_payments efp
LEFT JOIN students s ON efp.student_id = s.id
LEFT JOIN fees f ON s.id = f.student_id
LEFT JOIN transactions t ON efp.student_id = t.related_id 
  AND efp.payment_amount = t.amount 
  AND efp.payment_date = t.date
  AND t.source = 'external_payment'
WHERE efp.status = 'verified';

-- 5. Check for problems
SELECT 
  'PROBLEMS FOUND' as section,
  'Missing Fee Records' as issue,
  COUNT(*) as count
FROM external_fee_payments efp
LEFT JOIN students s ON efp.student_id = s.id
LEFT JOIN fees f ON s.id = f.student_id
WHERE efp.status = 'verified' AND f.id IS NULL

UNION ALL

SELECT 
  'PROBLEMS FOUND' as section,
  'Zero Paid Amount' as issue,
  COUNT(*) as count
FROM external_fee_payments efp
LEFT JOIN students s ON efp.student_id = s.id
LEFT JOIN fees f ON s.id = f.student_id
WHERE efp.status = 'verified' AND f.paid_amount = 0

UNION ALL

SELECT 
  'PROBLEMS FOUND' as section,
  'Missing Transactions' as issue,
  COUNT(*) as count
FROM external_fee_payments efp
LEFT JOIN transactions t ON efp.student_id = t.related_id 
  AND efp.payment_amount = t.amount 
  AND efp.payment_date = t.date
  AND t.source = 'external_payment'
WHERE efp.status = 'verified' AND t.id IS NULL;
