-- Clean Up Duplicate Records from External Payments
-- Run this to fix existing duplicate students and fee records

-- 1. Find duplicate students (same name and grade)
SELECT 
  'Duplicate Students Found' as issue,
  first_name,
  last_name,
  grade_level,
  COUNT(*) as duplicate_count
FROM students 
WHERE status = 'active'
GROUP BY first_name, last_name, grade_level
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 2. Find students with duplicate fee records
SELECT 
  'Students with Multiple Fee Records' as issue,
  s.first_name,
  s.last_name,
  s.grade_level,
  COUNT(f.id) as fee_count,
  SUM(f.amount) as total_fees,
  SUM(f.paid_amount) as total_paid
FROM students s
JOIN fees f ON s.id = f.student_id
WHERE s.status = 'active'
GROUP BY s.id, s.first_name, s.last_name, s.grade_level
HAVING COUNT(f.id) > 1
ORDER BY fee_count DESC;

-- 3. Merge duplicate students (keep the one with more complete data)
-- This will identify which students to merge
WITH duplicate_students AS (
  SELECT 
    first_name,
    last_name,
    grade_level,
    array_agg(id ORDER BY created_at) as student_ids,
    array_agg(created_at ORDER BY created_at) as created_dates
  FROM students 
  WHERE status = 'active'
  GROUP BY first_name, last_name, grade_level
  HAVING COUNT(*) > 1
)
SELECT 
  'Students to Merge' as action,
  first_name || ' ' || last_name as student_name,
  grade_level,
  student_ids[1] as keep_student_id,
  student_ids[2:] as merge_student_ids
FROM duplicate_students;

-- 4. Clean up duplicate fee records for the same student
-- Remove duplicate fees and consolidate payments
WITH duplicate_fees AS (
  SELECT 
    student_id,
    course_id,
    array_agg(id ORDER BY created_at) as fee_ids,
    array_agg(amount ORDER BY created_at) as amounts,
    array_agg(paid_amount ORDER BY created_at) as paid_amounts,
    SUM(paid_amount) as total_paid
  FROM fees
  GROUP BY student_id, course_id
  HAVING COUNT(*) > 1
)
SELECT 
  'Duplicate Fees to Clean' as action,
  df.student_id,
  s.first_name || ' ' || s.last_name as student_name,
  df.course_id,
  c.name as course_name,
  df.fee_ids[1] as keep_fee_id,
  df.fee_ids[2:] as remove_fee_ids,
  df.total_paid as consolidated_paid_amount
FROM duplicate_fees df
JOIN students s ON df.student_id = s.id
LEFT JOIN courses c ON df.course_id = c.id;

-- 5. ACTUAL CLEANUP - Consolidate duplicate fee records
-- Update the first fee record with consolidated payment amount
UPDATE fees
SET
  paid_amount = consolidated.total_paid,
  status = CASE
    WHEN consolidated.total_paid >= fees.amount THEN 'paid'
    WHEN consolidated.total_paid > 0 THEN 'partial'
    ELSE 'pending'
  END,
  updated_at = NOW()
FROM (
  SELECT DISTINCT ON (student_id, course_id)
    student_id,
    course_id,
    id as keep_fee_id,
    SUM(paid_amount) OVER (PARTITION BY student_id, course_id) as total_paid
  FROM fees
  ORDER BY student_id, course_id, created_at
) consolidated
WHERE fees.id = consolidated.keep_fee_id;

-- 6. Delete duplicate fee records (keep only the first one by creation date)
DELETE FROM fees
WHERE id IN (
  SELECT f.id
  FROM fees f
  JOIN (
    SELECT DISTINCT ON (student_id, course_id)
      student_id,
      course_id,
      id as keep_id
    FROM fees
    ORDER BY student_id, course_id, created_at
  ) first_fees ON f.student_id = first_fees.student_id
    AND COALESCE(f.course_id::text, 'null') = COALESCE(first_fees.course_id::text, 'null')
  WHERE f.id != first_fees.keep_id
    AND EXISTS (
      SELECT 1 FROM fees f2
      WHERE f2.student_id = f.student_id
        AND COALESCE(f2.course_id::text, 'null') = COALESCE(f.course_id::text, 'null')
      GROUP BY f2.student_id, f2.course_id
      HAVING COUNT(*) > 1
    )
);

-- 7. Clean up duplicate transaction records
DELETE FROM transactions
WHERE id IN (
  SELECT t.id
  FROM transactions t
  JOIN (
    SELECT DISTINCT ON (related_id, amount, date, source)
      related_id,
      amount,
      date,
      source,
      id as keep_id
    FROM transactions
    WHERE source = 'external_payment'
    ORDER BY related_id, amount, date, source, created_at
  ) first_transactions ON t.related_id = first_transactions.related_id
    AND t.amount = first_transactions.amount
    AND t.date = first_transactions.date
    AND t.source = first_transactions.source
  WHERE t.id != first_transactions.keep_id
    AND EXISTS (
      SELECT 1 FROM transactions t2
      WHERE t2.related_id = t.related_id
        AND t2.amount = t.amount
        AND t2.date = t.date
        AND t2.source = t.source
      GROUP BY t2.related_id, t2.amount, t2.date, t2.source
      HAVING COUNT(*) > 1
    )
);

-- 8. Update external_fee_payments to point to the correct student
UPDATE external_fee_payments 
SET student_id = correct_student.id
FROM (
  SELECT DISTINCT ON (efp.student_name, efp.student_class)
    efp.id as payment_id,
    s.id,
    efp.student_name,
    efp.student_class
  FROM external_fee_payments efp
  JOIN students s ON s.first_name ILIKE split_part(efp.student_name, ' ', 1)
    AND s.grade_level = efp.student_class
    AND s.status = 'active'
  WHERE efp.status = 'verified'
  ORDER BY efp.student_name, efp.student_class, s.created_at
) correct_student
WHERE external_fee_payments.id = correct_student.payment_id;

-- 9. Verify the cleanup worked
SELECT 
  'Cleanup Results' as section,
  'Remaining Duplicate Students' as metric,
  COUNT(*) as count
FROM (
  SELECT first_name, last_name, grade_level
  FROM students 
  WHERE status = 'active'
  GROUP BY first_name, last_name, grade_level
  HAVING COUNT(*) > 1
) duplicates

UNION ALL

SELECT 
  'Cleanup Results' as section,
  'Remaining Duplicate Fees' as metric,
  COUNT(*) as count
FROM (
  SELECT student_id, course_id
  FROM fees
  GROUP BY student_id, course_id
  HAVING COUNT(*) > 1
) duplicate_fees

UNION ALL

SELECT 
  'Cleanup Results' as section,
  'Students with Correct Payments' as metric,
  COUNT(*) as count
FROM students s
JOIN fees f ON s.id = f.student_id
WHERE s.status = 'active' AND f.paid_amount > 0;

-- 10. Show current status after cleanup
SELECT 
  s.first_name || ' ' || s.last_name as student_name,
  s.grade_level,
  COUNT(f.id) as fee_records,
  SUM(f.amount) as total_fees,
  SUM(f.paid_amount) as total_paid,
  SUM(f.amount) - SUM(f.paid_amount) as remaining,
  CASE 
    WHEN SUM(f.paid_amount) >= SUM(f.amount) THEN '✅ Fully Paid'
    WHEN SUM(f.paid_amount) > 0 THEN '⚠️ Partial'
    ELSE '❌ Pending'
  END as status
FROM students s
LEFT JOIN fees f ON s.id = f.student_id
WHERE s.status = 'active'
GROUP BY s.id, s.first_name, s.last_name, s.grade_level
ORDER BY s.first_name;
