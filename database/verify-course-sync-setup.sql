-- Verification script to check if course fee sync is set up correctly
-- Run this after the main migration to verify everything is working

-- 1. Check if fees table has all required columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'fees' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if courses table exists and has price column
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'courses' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'name', 'price', 'status')
ORDER BY ordinal_position;

-- 3. Check if trigger function exists
SELECT 
  routine_name,
  routine_type,
  routine_definition IS NOT NULL as has_definition
FROM information_schema.routines 
WHERE routine_name = 'sync_student_fees_on_course_update'
  AND routine_schema = 'public';

-- 4. Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'course_price_update_trigger'
  AND event_object_table = 'courses';

-- 5. Check current fee data summary
SELECT 
  'Fee Data Summary' as info,
  COUNT(*) as total_fees,
  COUNT(course_id) as fees_with_course_id,
  COUNT(CASE WHEN paid_amount > 0 THEN 1 END) as fees_with_payments,
  SUM(amount) as total_amount,
  SUM(paid_amount) as total_paid
FROM fees;

-- 6. Check course and student relationship
SELECT 
  'Course-Student Relationships' as info,
  COUNT(DISTINCT c.id) as total_courses,
  COUNT(DISTINCT s.id) as total_students,
  COUNT(DISTINCT s.course_id) as students_with_primary_course
FROM courses c
FULL OUTER JOIN students s ON c.id = s.course_id
WHERE c.status = 'active' OR c.status IS NULL;

-- 7. Check for any fees without course_id that could be linked
SELECT 
  'Fees that could be linked to courses' as info,
  COUNT(*) as fees_without_course_id,
  COUNT(CASE WHEN s.course_id IS NOT NULL THEN 1 END) as can_be_linked_to_primary_course
FROM fees f
JOIN students s ON f.student_id = s.id
WHERE f.course_id IS NULL;

-- 8. Test the manual sync function (dry run - just check if it exists)
SELECT 
  routine_name,
  'Manual sync function available' as status
FROM information_schema.routines 
WHERE routine_name = 'manual_sync_course_fees'
  AND routine_schema = 'public';

-- 9. Show sample data for verification
SELECT 
  'Sample Fee Records' as info,
  f.id,
  f.student_id,
  f.course_id,
  f.amount,
  f.paid_amount,
  f.status,
  c.name as course_name,
  c.price as course_price,
  s.first_name || ' ' || s.last_name as student_name
FROM fees f
LEFT JOIN courses c ON f.course_id = c.id
LEFT JOIN students s ON f.student_id = s.id
ORDER BY f.created_at DESC
LIMIT 10;

-- 10. Final status check
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees' AND column_name = 'course_id') 
      AND EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'course_price_update_trigger')
      AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'sync_student_fees_on_course_update')
    THEN '✅ Course fee synchronization is set up correctly!'
    ELSE '❌ Setup incomplete - please check the migration results above'
  END as final_status;
