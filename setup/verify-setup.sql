-- =====================================================
-- SETUP VERIFICATION SCRIPT
-- Run this to check if everything is set up correctly
-- =====================================================

-- Check 1: Verify auth users exist
SELECT 
    '🔐 AUTH USERS' as check_type,
    email,
    raw_user_meta_data->>'role' as role,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
        ELSE '❌ Not Confirmed'
    END as status
FROM auth.users 
WHERE email LIKE '%@educare.com'
ORDER BY email;

-- Check 2: Verify staff records exist
SELECT 
    '👥 STAFF RECORDS' as check_type,
    email,
    role,
    CASE 
        WHEN status = 'active' THEN '✅ Active'
        ELSE '❌ Inactive'
    END as status
FROM staff 
WHERE email LIKE '%@educare.com'
ORDER BY role, email;

-- Check 3: Verify role permissions exist
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

-- Check 4: Verify database tables exist
SELECT 
    '📊 DATABASE TABLES' as check_type,
    table_name,
    '✅ Exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('staff', 'role_permissions', 'salary_records', 'staff_sessions')
ORDER BY table_name;

-- Check 5: Show sample permissions for super_admin
SELECT 
    '🔓 SUPER ADMIN PERMISSIONS' as check_type,
    permission,
    '✅ Available' as status
FROM role_permissions 
WHERE role = 'super_admin'
ORDER BY permission;

-- Summary Report
DO $$
DECLARE
    auth_count INTEGER;
    staff_count INTEGER;
    perm_count INTEGER;
    admin_exists BOOLEAN;
BEGIN
    -- Count records
    SELECT COUNT(*) INTO auth_count FROM auth.users WHERE email LIKE '%@educare.com';
    SELECT COUNT(*) INTO staff_count FROM staff WHERE email LIKE '%@educare.com';
    SELECT COUNT(*) INTO perm_count FROM role_permissions WHERE role = 'super_admin';
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@educare.com') INTO admin_exists;
    
    -- Print summary
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 SETUP VERIFICATION SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    IF admin_exists THEN
        RAISE NOTICE '✅ Super Admin User: CREATED';
        RAISE NOTICE '   📧 Email: admin@educare.com';
        RAISE NOTICE '   🔑 Password: admin123';
    ELSE
        RAISE NOTICE '❌ Super Admin User: NOT FOUND';
        RAISE NOTICE '   ⚠️  Please run the setup script first!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Record Counts:';
    RAISE NOTICE '   👤 Auth Users: %', auth_count;
    RAISE NOTICE '   👥 Staff Records: %', staff_count;
    RAISE NOTICE '   🔑 Super Admin Permissions: %', perm_count;
    
    RAISE NOTICE '';
    IF auth_count > 0 AND staff_count > 0 AND perm_count > 0 THEN
        RAISE NOTICE '🎉 STATUS: SETUP COMPLETE!';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 Ready to login with:';
        RAISE NOTICE '   📧 admin@educare.com';
        RAISE NOTICE '   🔑 admin123';
    ELSE
        RAISE NOTICE '⚠️  STATUS: SETUP INCOMPLETE';
        RAISE NOTICE '';
        RAISE NOTICE '📝 Next Steps:';
        RAISE NOTICE '   1. Run setup/supabase-auth-setup.sql';
        RAISE NOTICE '   2. Check your Supabase project settings';
        RAISE NOTICE '   3. Verify database permissions';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
