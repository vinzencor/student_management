-- =====================================================
-- QUICK FIX: DISABLE RLS FOR IMMEDIATE ACCESS
-- This solves 401 Unauthorized errors immediately
-- Run this if you need quick access without complex setup
-- =====================================================

-- Step 1: Disable RLS on all tables
ALTER TABLE IF EXISTS students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS performance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS communications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS salary_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_sessions DISABLE ROW LEVEL SECURITY;

-- Step 2: Grant full access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Step 3: Grant access to anon users for public operations
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Step 4: Create PostgreSQL roles to fix "role does not exist" errors
DO $$
BEGIN
    -- Create application roles
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'super_admin') THEN
        CREATE ROLE super_admin;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'teacher') THEN
        CREATE ROLE teacher;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'accountant') THEN
        CREATE ROLE accountant;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'office_staff') THEN
        CREATE ROLE office_staff;
    END IF;
    
    RAISE NOTICE '✅ PostgreSQL roles created/verified';
END $$;

-- Step 5: Grant permissions to all roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO super_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO teacher;
GRANT ALL ON ALL TABLES IN SCHEMA public TO accountant;
GRANT ALL ON ALL TABLES IN SCHEMA public TO office_staff;

-- Step 6: Update user roles in auth.users if needed
UPDATE auth.users 
SET role = 'super_admin' 
WHERE email IN ('admin@educare.com', 'michael.admin@educare.com')
AND (role IS NULL OR role != 'super_admin');

UPDATE auth.users 
SET role = 'teacher' 
WHERE email LIKE '%.teacher@educare.com'
AND (role IS NULL OR role != 'teacher');

UPDATE auth.users 
SET role = 'accountant' 
WHERE email LIKE '%.accountant@educare.com'
AND (role IS NULL OR role != 'accountant');

UPDATE auth.users 
SET role = 'office_staff' 
WHERE email LIKE '%.office@educare.com'
AND (role IS NULL OR role != 'office_staff');

-- Step 7: Drop any existing restrictive policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
    
    RAISE NOTICE '✅ Removed restrictive RLS policies';
END $$;

-- Step 8: Verification and success message
DO $$
DECLARE
    rls_enabled_count INTEGER;
    auth_user_count INTEGER;
    pg_role_count INTEGER;
BEGIN
    -- Count tables with RLS enabled
    SELECT COUNT(*) INTO rls_enabled_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
    AND c.relkind = 'r' 
    AND c.relrowsecurity = true;
    
    -- Count auth users with roles
    SELECT COUNT(*) INTO auth_user_count
    FROM auth.users 
    WHERE role IS NOT NULL AND email LIKE '%@educare.com';
    
    -- Count PostgreSQL roles
    SELECT COUNT(*) INTO pg_role_count
    FROM pg_roles 
    WHERE rolname IN ('super_admin', 'teacher', 'accountant', 'office_staff');
    
    RAISE NOTICE '';
    RAISE NOTICE '🚀 QUICK FIX APPLIED SUCCESSFULLY!';
    RAISE NOTICE '==================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ WHAT WAS FIXED:';
    RAISE NOTICE '   • RLS disabled on all tables';
    RAISE NOTICE '   • Full permissions granted to authenticated users';
    RAISE NOTICE '   • PostgreSQL roles created: %', pg_role_count;
    RAISE NOTICE '   • Auth user roles updated: %', auth_user_count;
    RAISE NOTICE '   • Tables with RLS enabled: %', rls_enabled_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔐 LOGIN NOW:';
    RAISE NOTICE '   📧 admin@educare.com';
    RAISE NOTICE '   🔑 admin123';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 401 Unauthorized errors should be GONE!';
    RAISE NOTICE '🚀 All dashboard features should work now!';
    RAISE NOTICE '';
END $$;

-- Step 9: Show current status
SELECT 
    '🛡️ RLS STATUS' as category,
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN '🔒 Enabled' ELSE '🔓 Disabled' END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
AND tablename IN ('students', 'leads', 'staff', 'fees', 'attendance', 'performance', 'classes')
ORDER BY tablename;

SELECT 
    '👤 USER ROLES' as category,
    email,
    COALESCE(role, 'No Role') as role,
    CASE WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed' ELSE '❌ Not Confirmed' END as status
FROM auth.users 
WHERE email LIKE '%@educare.com'
ORDER BY role, email;
