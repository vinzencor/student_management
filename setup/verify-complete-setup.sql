-- =====================================================
-- VERIFICATION SCRIPT
-- Run this to check if the complete setup worked
-- =====================================================

-- Check 1: Verify all tables exist
SELECT 
    '📋 DATABASE TABLES' as check_type,
    table_name,
    '✅ Exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'staff', 'role_permissions', 'salary_records', 'staff_sessions',
    'students', 'leads', 'classes', 'attendance', 'fees', 
    'performance', 'communications'
)
ORDER BY table_name;

-- Check 2: Verify auth users exist
SELECT 
    '👤 AUTH USERS' as check_type,
    email,
    role,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
        ELSE '❌ Not Confirmed'
    END as status
FROM auth.users 
WHERE email LIKE '%@educare.com'
ORDER BY role, email;

-- Check 3: Verify staff records exist
SELECT 
    '👥 STAFF RECORDS' as check_type,
    email,
    role,
    first_name || ' ' || last_name as name,
    CASE 
        WHEN status = 'active' THEN '✅ Active'
        ELSE '❌ Inactive'
    END as status
FROM staff 
WHERE email LIKE '%@educare.com'
ORDER BY role, first_name;

-- Check 4: Verify role permissions exist
SELECT 
    '🔑 ROLE PERMISSIONS' as check_type,
    role,
    COUNT(*) as permission_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Has Permissions'
        ELSE '❌ No Permissions'
    END as status
FROM role_permissions 
GROUP BY role
ORDER BY role;

-- Check 5: Verify sample data exists
SELECT 
    '🎓 SAMPLE DATA' as check_type,
    'Students' as data_type,
    COUNT(*)::text as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Created'
        ELSE '❌ Missing'
    END as status
FROM students

UNION ALL

SELECT 
    '🎓 SAMPLE DATA' as check_type,
    'Leads' as data_type,
    COUNT(*)::text as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Created'
        ELSE '❌ Missing'
    END as status
FROM leads

UNION ALL

SELECT 
    '🎓 SAMPLE DATA' as check_type,
    'Salary Records' as data_type,
    COUNT(*)::text as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Created'
        ELSE '❌ Missing'
    END as status
FROM salary_records;

-- Check 6: Verify auth.users has role column
SELECT 
    '🔧 AUTH TABLE' as check_type,
    'role column' as feature,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'auth' 
            AND table_name = 'users' 
            AND column_name = 'role'
        ) THEN '✅ Added'
        ELSE '❌ Missing'
    END as status;

-- Summary Report
DO $$
DECLARE
    auth_count INTEGER;
    staff_count INTEGER;
    perm_count INTEGER;
    student_count INTEGER;
    lead_count INTEGER;
    salary_count INTEGER;
    admin_exists BOOLEAN;
    role_column_exists BOOLEAN;
BEGIN
    -- Count records
    SELECT COUNT(*) INTO auth_count FROM auth.users WHERE email LIKE '%@educare.com';
    SELECT COUNT(*) INTO staff_count FROM staff WHERE email LIKE '%@educare.com';
    SELECT COUNT(*) INTO perm_count FROM role_permissions;
    SELECT COUNT(*) INTO student_count FROM students;
    SELECT COUNT(*) INTO lead_count FROM leads;
    SELECT COUNT(*) INTO salary_count FROM salary_records;
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@educare.com') INTO admin_exists;
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'role'
    ) INTO role_column_exists;
    
    -- Print summary
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 COMPLETE SETUP VERIFICATION SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    IF admin_exists AND role_column_exists THEN
        RAISE NOTICE '✅ SETUP STATUS: COMPLETE AND READY!';
        RAISE NOTICE '';
        RAISE NOTICE '🔐 Primary Login:';
        RAISE NOTICE '   📧 Email: admin@educare.com';
        RAISE NOTICE '   🔑 Password: admin123';
        RAISE NOTICE '   👑 Role: Super Admin';
    ELSE
        RAISE NOTICE '❌ SETUP STATUS: INCOMPLETE';
        IF NOT admin_exists THEN
            RAISE NOTICE '   ⚠️  Super admin user not found';
        END IF;
        IF NOT role_column_exists THEN
            RAISE NOTICE '   ⚠️  Role column not added to auth.users';
        END IF;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Record Counts:';
    RAISE NOTICE '   👤 Auth Users: %', auth_count;
    RAISE NOTICE '   👥 Staff Records: %', staff_count;
    RAISE NOTICE '   🔑 Role Permissions: %', perm_count;
    RAISE NOTICE '   🎓 Sample Students: %', student_count;
    RAISE NOTICE '   📞 Sample Leads: %', lead_count;
    RAISE NOTICE '   💰 Salary Records: %', salary_count;
    
    RAISE NOTICE '';
    IF auth_count = 10 AND staff_count = 10 AND perm_count > 0 THEN
        RAISE NOTICE '🎉 ALL SYSTEMS GO!';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 Ready for:';
        RAISE NOTICE '   • Real Supabase authentication';
        RAISE NOTICE '   • Role-based access control';
        RAISE NOTICE '   • Complete staff management';
        RAISE NOTICE '   • All dashboard features';
        RAISE NOTICE '   • Production use';
    ELSE
        RAISE NOTICE '⚠️  SETUP ISSUES DETECTED';
        RAISE NOTICE '';
        RAISE NOTICE '📝 Recommended Actions:';
        RAISE NOTICE '   1. Re-run complete-database-setup.sql';
        RAISE NOTICE '   2. Check Supabase permissions';
        RAISE NOTICE '   3. Verify database connection';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
