-- =====================================================
-- TEST SUPABASE CONNECTION AND PERMISSIONS
-- Run this to verify your Supabase setup is working
-- =====================================================

-- Test 1: Check if we can access basic system info
SELECT 
    'SYSTEM INFO' as test_type,
    current_database() as database_name,
    current_user as current_user,
    session_user as session_user,
    version() as postgres_version;

-- Test 2: Check if auth schema is accessible
SELECT 
    'AUTH SCHEMA' as test_type,
    COUNT(*) as user_count,
    'auth.users accessible' as status
FROM auth.users;

-- Test 3: Check if public schema tables exist
SELECT 
    'PUBLIC TABLES' as test_type,
    table_name,
    CASE WHEN table_type = 'BASE TABLE' THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('students', 'leads', 'staff', 'fees', 'attendance')
ORDER BY table_name;

-- Test 4: Check RLS status
SELECT 
    'RLS STATUS' as test_type,
    t.tablename,
    CASE WHEN c.relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename IN ('students', 'leads', 'staff', 'fees', 'attendance')
ORDER BY t.tablename;

-- Test 5: Check permissions for authenticated role
SELECT 
    'PERMISSIONS' as test_type,
    table_name,
    privilege_type,
    'GRANTED' as status
FROM information_schema.table_privileges 
WHERE grantee = 'authenticated' 
AND table_schema = 'public'
AND table_name IN ('students', 'leads', 'staff', 'fees', 'attendance')
ORDER BY table_name, privilege_type;

-- Test 6: Try to access each table
DO $$
DECLARE
    table_name text;
    table_names text[] := ARRAY['students', 'leads', 'staff', 'fees', 'attendance'];
    row_count integer;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TABLE ACCESS TEST:';
    RAISE NOTICE '====================';
    
    FOREACH table_name IN ARRAY table_names
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO row_count;
            RAISE NOTICE '✅ %: % rows (ACCESSIBLE)', table_name, row_count;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ %: ERROR - %', table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Test 7: Check for any remaining policies
SELECT 
    'POLICIES' as test_type,
    schemaname,
    tablename,
    policyname,
    'ACTIVE' as status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test 8: Check for role-related functions
SELECT 
    'FUNCTIONS' as test_type,
    routine_name,
    CASE WHEN routine_definition ILIKE '%set role%' THEN 'PROBLEMATIC' ELSE 'SAFE' END as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Test 9: Test auth.uid() function
SELECT 
    'AUTH FUNCTION' as test_type,
    CASE WHEN auth.uid() IS NULL THEN 'NO USER' ELSE 'USER FOUND' END as auth_status,
    auth.uid() as user_id;

-- Test 10: Final summary
DO $$
DECLARE
    tables_exist integer;
    rls_disabled integer;
    permissions_granted integer;
    policies_active integer;
BEGIN
    -- Count issues
    SELECT COUNT(*) INTO tables_exist
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name IN ('students', 'leads', 'staff', 'fees', 'attendance');
    
    SELECT COUNT(*) INTO rls_disabled
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public'
    AND t.tablename IN ('students', 'leads', 'staff', 'fees', 'attendance')
    AND c.relrowsecurity = false;
    
    SELECT COUNT(*) INTO permissions_granted
    FROM information_schema.table_privileges 
    WHERE grantee = 'authenticated' 
    AND table_schema = 'public'
    AND privilege_type = 'SELECT'
    AND table_name IN ('students', 'leads', 'staff', 'fees', 'attendance');
    
    SELECT COUNT(*) INTO policies_active
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 SUPABASE CONNECTION TEST SUMMARY:';
    RAISE NOTICE '===================================';
    RAISE NOTICE '📊 Tables exist: %/5', tables_exist;
    RAISE NOTICE '🔓 RLS disabled: %/5', rls_disabled;
    RAISE NOTICE '🔑 Permissions granted: %/5', permissions_granted;
    RAISE NOTICE '🛡️ Active policies: %', policies_active;
    RAISE NOTICE '';
    
    IF tables_exist = 5 AND rls_disabled = 5 AND permissions_granted >= 5 AND policies_active = 0 THEN
        RAISE NOTICE '✅ SUPABASE SETUP: PERFECT';
        RAISE NOTICE '🎯 403 errors should be GONE!';
    ELSE
        RAISE NOTICE '⚠️  SUPABASE SETUP: ISSUES DETECTED';
        RAISE NOTICE '📝 Run nuclear-fix-403.sql to resolve';
    END IF;
    
    RAISE NOTICE '';
END $$;
