-- Simple Cleanup for Duplicate Records (UUID-safe)
-- Run this to fix duplicate students and fee records

-- 1. First, let's see what duplicates we have
SELECT 
  'Current Duplicate Students' as issue,
  first_name,
  last_name,
  grade_level,
  COUNT(*) as count,
  string_agg(id::text, ', ') as student_ids
FROM students 
WHERE status = 'active'
GROUP BY first_name, last_name, grade_level
HAVING COUNT(*) > 1
ORDER BY first_name, last_name;

-- 2. Show duplicate fee records
SELECT 
  'Duplicate Fee Records' as issue,
  s.first_name || ' ' || s.last_name as student_name,
  s.grade_level,
  COUNT(f.id) as fee_count,
  SUM(f.amount) as total_amount,
  SUM(f.paid_amount) as total_paid,
  string_agg(f.id::text, ', ') as fee_ids
FROM students s
JOIN fees f ON s.id = f.student_id
WHERE s.status = 'active'
GROUP BY s.id, s.first_name, s.last_name, s.grade_level
HAVING COUNT(f.id) > 1
ORDER BY s.first_name;

-- 3. Create a temporary table to track which records to keep
CREATE TEMP TABLE records_to_keep AS
SELECT DISTINCT ON (first_name, last_name, grade_level)
  id as keep_student_id,
  first_name,
  last_name,
  grade_level
FROM students 
WHERE status = 'active'
ORDER BY first_name, last_name, grade_level, created_at;

-- 4. Create temp table for fee consolidation
CREATE TEMP TABLE fee_consolidation AS
SELECT 
  rtk.keep_student_id,
  f.course_id,
  MAX(f.amount) as amount, -- Use the highest amount (likely correct course fee)
  SUM(f.paid_amount) as total_paid_amount,
  MIN(f.created_at) as earliest_date,
  array_agg(f.id ORDER BY f.created_at) as all_fee_ids
FROM records_to_keep rtk
JOIN students s ON (s.first_name = rtk.first_name 
                   AND s.last_name = rtk.last_name 
                   AND s.grade_level = rtk.grade_level)
JOIN fees f ON s.id = f.student_id
GROUP BY rtk.keep_student_id, f.course_id;

-- 5. Update the kept student's fee records with consolidated amounts
UPDATE fees 
SET 
  student_id = fc.keep_student_id,
  paid_amount = fc.total_paid_amount,
  status = CASE 
    WHEN fc.total_paid_amount >= fc.amount THEN 'paid'
    WHEN fc.total_paid_amount > 0 THEN 'partial'
    ELSE 'pending'
  END,
  updated_at = NOW()
FROM fee_consolidation fc
WHERE fees.id = fc.all_fee_ids[1]; -- Update the first (oldest) fee record

-- 6. Delete duplicate fee records (keep only the first one)
DELETE FROM fees 
WHERE id IN (
  SELECT unnest(fc.all_fee_ids[2:]) -- Delete all except the first
  FROM fee_consolidation fc
  WHERE array_length(fc.all_fee_ids, 1) > 1
);

-- 7. Update external_fee_payments to point to the correct student
UPDATE external_fee_payments 
SET student_id = rtk.keep_student_id
FROM records_to_keep rtk
JOIN students s ON (s.first_name = rtk.first_name 
                   AND s.last_name = rtk.last_name 
                   AND s.grade_level = rtk.grade_level)
WHERE external_fee_payments.student_id = s.id;

-- 8. Update transactions to point to the correct student
UPDATE transactions 
SET related_id = rtk.keep_student_id
FROM records_to_keep rtk
JOIN students s ON (s.first_name = rtk.first_name 
                   AND s.last_name = rtk.last_name 
                   AND s.grade_level = rtk.grade_level)
WHERE transactions.related_id = s.id;

-- 9. Delete duplicate students (keep only the ones in records_to_keep)
DELETE FROM students 
WHERE id NOT IN (SELECT keep_student_id FROM records_to_keep)
  AND (first_name, last_name, grade_level) IN (
    SELECT first_name, last_name, grade_level 
    FROM records_to_keep
  );

-- 10. Clean up duplicate transactions
CREATE TEMP TABLE transaction_consolidation AS
SELECT DISTINCT ON (related_id, amount, date, source)
  id as keep_transaction_id,
  related_id,
  amount,
  date,
  source
FROM transactions
WHERE source = 'external_payment'
ORDER BY related_id, amount, date, source, created_at;

DELETE FROM transactions 
WHERE source = 'external_payment'
  AND id NOT IN (SELECT keep_transaction_id FROM transaction_consolidation);

-- 11. Show results after cleanup
SELECT 
  'After Cleanup - Students' as section,
  first_name || ' ' || last_name as student_name,
  grade_level,
  COUNT(*) as student_count
FROM students 
WHERE status = 'active'
GROUP BY first_name, last_name, grade_level
ORDER BY first_name;

-- 12. Show fee status after cleanup
SELECT 
  'After Cleanup - Fee Status' as section,
  s.first_name || ' ' || s.last_name as student_name,
  s.grade_level,
  COUNT(f.id) as fee_records,
  COALESCE(SUM(f.amount), 0) as total_fees,
  COALESCE(SUM(f.paid_amount), 0) as total_paid,
  COALESCE(SUM(f.amount) - SUM(f.paid_amount), 0) as remaining,
  CASE 
    WHEN COALESCE(SUM(f.paid_amount), 0) >= COALESCE(SUM(f.amount), 0) AND COALESCE(SUM(f.amount), 0) > 0 THEN '✅ Fully Paid'
    WHEN COALESCE(SUM(f.paid_amount), 0) > 0 THEN '⚠️ Partial'
    WHEN COALESCE(SUM(f.amount), 0) > 0 THEN '❌ Pending'
    ELSE '❓ No Fees'
  END as status
FROM students s
LEFT JOIN fees f ON s.id = f.student_id
WHERE s.status = 'active'
GROUP BY s.id, s.first_name, s.last_name, s.grade_level
ORDER BY s.first_name;

-- 13. Show transaction status
SELECT 
  'After Cleanup - Transactions' as section,
  COUNT(*) as total_external_payment_transactions,
  SUM(amount) as total_amount
FROM transactions 
WHERE source = 'external_payment';

-- Clean up temp tables
DROP TABLE IF EXISTS records_to_keep;
DROP TABLE IF EXISTS fee_consolidation;
DROP TABLE IF EXISTS transaction_consolidation;
