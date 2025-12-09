-- Test script to verify both fee payment fixes
-- Run this in Supabase SQL Editor to test the fixes

-- Test 1: Verify pending fees calculation
-- This should return the count of students with unpaid balances
SELECT 
    'Pending Fees Test' as test_name,
    COUNT(DISTINCT student_id) as students_with_pending_fees
FROM fees 
WHERE status != 'paid' 
AND (amount - COALESCE(paid_amount, 0)) > 0;

-- Test 2: Show detailed breakdown of pending fees by student
SELECT 
    'Detailed Pending Fees' as test_name,
    student_id,
    SUM(amount) as total_amount,
    SUM(COALESCE(paid_amount, 0)) as total_paid,
    SUM(amount - COALESCE(paid_amount, 0)) as remaining_balance,
    COUNT(*) as fee_records_count
FROM fees 
WHERE status != 'paid'
GROUP BY student_id 
HAVING SUM(amount - COALESCE(paid_amount, 0)) > 0
ORDER BY remaining_balance DESC;

-- Test 3: Check for potential duplicate constraint violations
-- This shows if there are any existing duplicates that would violate the unique constraint
SELECT 
    'Duplicate Check' as test_name,
    student_id,
    fee_type,
    description,
    COUNT(*) as duplicate_count
FROM fees 
GROUP BY student_id, fee_type, description 
HAVING COUNT(*) > 1;

-- Test 4: Verify the unique constraint exists
SELECT 
    'Constraint Check' as test_name,
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'fees' 
AND constraint_type = 'UNIQUE'
AND constraint_name = 'unique_student_fee_type_desc';

-- Test 5: Show current fee statuses distribution
SELECT 
    'Status Distribution' as test_name,
    status,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    SUM(COALESCE(paid_amount, 0)) as total_paid
FROM fees 
GROUP BY status 
ORDER BY count DESC;
