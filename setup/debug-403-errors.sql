-- =====================================================
-- DEBUG 403 ERRORS - Find What's Causing Permission Issues
-- Run this to identify the source of 403 Forbidden errors
-- =====================================================

-- Check 1: Show all RLS policies that might be blocking access
SELECT 
    '🛡️ RLS POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check 2: Show RLS status on all tables
SELECT 
    '🔒 RLS STATUS' as check_type,
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check 3: Check permissions for authenticated role
SELECT 
    '🔑 AUTHENTICATED PERMISSIONS' as check_type,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE grantee = 'authenticated' 
AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- Check 4: Check permissions for anon role
SELECT 
    '👤 ANON PERMISSIONS' as check_type,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE grantee = 'anon' 
AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- Check 5: Look for any functions that might be setting roles
SELECT 
    '⚙️ FUNCTIONS' as check_type,
    routine_name,
    routine_type,
    security_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND (routine_definition ILIKE '%set role%' OR routine_definition ILIKE '%set_role%')
ORDER BY routine_name;

-- Check 6: Check for any triggers that might interfere
SELECT 
    '🔄 TRIGGERS' as check_type,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check 7: Show current database roles
SELECT 
    '🎭 DATABASE ROLES' as check_type,
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM pg_roles 
WHERE rolname IN ('authenticated', 'anon', 'service_role', 'super_admin', 'teacher', 'accountant', 'office_staff')
ORDER BY rolname;

-- Check 8: Show auth.users data
SELECT 
    '👥 AUTH USERS' as check_type,
    email,
    role,
    email_confirmed_at IS NOT NULL as confirmed,
    created_at
FROM auth.users 
WHERE email LIKE '%@educare.com'
ORDER BY email;

-- Check 9: Check if tables exist and are accessible
DO $$
DECLARE
    current_table text;
    table_names text[] := ARRAY['students', 'leads', 'staff', 'fees', 'attendance', 'performance', 'classes'];
    has_select boolean;
    has_insert boolean;
    has_update boolean;
    has_delete boolean;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 TABLE ACCESS CHECK:';
    RAISE NOTICE '=====================';

    FOREACH current_table IN ARRAY table_names
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = current_table AND table_schema = 'public') THEN
            -- Check permissions for authenticated role
            SELECT has_table_privilege('authenticated', current_table, 'SELECT') INTO has_select;
            SELECT has_table_privilege('authenticated', current_table, 'INSERT') INTO has_insert;
            SELECT has_table_privilege('authenticated', current_table, 'UPDATE') INTO has_update;
            SELECT has_table_privilege('authenticated', current_table, 'DELETE') INTO has_delete;

            RAISE NOTICE '📊 Table: % | SELECT: % | INSERT: % | UPDATE: % | DELETE: %',
                         current_table,
                         CASE WHEN has_select THEN '✅' ELSE '❌' END,
                         CASE WHEN has_insert THEN '✅' ELSE '❌' END,
                         CASE WHEN has_update THEN '✅' ELSE '❌' END,
                         CASE WHEN has_delete THEN '✅' ELSE '❌' END;
        ELSE
            RAISE NOTICE '❌ Table: % does not exist', current_table;
        END IF;
    END LOOP;
END $$;

-- Check 10: Show summary of issues
DO $$
DECLARE
    rls_enabled_count INTEGER;
    policy_count INTEGER;
    missing_permissions INTEGER;
    auth_user_count INTEGER;
BEGIN
    -- Count issues
    SELECT COUNT(*) INTO rls_enabled_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
    AND c.relkind = 'r' 
    AND c.relrowsecurity = true;
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    SELECT COUNT(*) INTO missing_permissions
    FROM information_schema.tables t
    LEFT JOIN information_schema.table_privileges p ON (
        p.table_name = t.table_name
        AND p.grantee = 'authenticated'
        AND p.privilege_type = 'SELECT'
    )
    WHERE t.table_schema = 'public'
    AND t.table_name IN ('students', 'leads', 'staff', 'fees', 'attendance')
    AND p.privilege_type IS NULL;
    
    SELECT COUNT(*) INTO auth_user_count
    FROM auth.users 
    WHERE email LIKE '%@educare.com' AND role IS NOT NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔍 ISSUE SUMMARY:';
    RAISE NOTICE '================';
    RAISE NOTICE '🔒 Tables with RLS enabled: %', rls_enabled_count;
    RAISE NOTICE '🛡️ Active RLS policies: %', policy_count;
    RAISE NOTICE '❌ Tables missing SELECT permission: %', missing_permissions;
    RAISE NOTICE '👤 Auth users with roles: %', auth_user_count;
    RAISE NOTICE '';
    
    IF rls_enabled_count > 0 OR policy_count > 0 OR missing_permissions > 0 THEN
        RAISE NOTICE '⚠️  ISSUES FOUND - Run ultimate-fix-403.sql to resolve';
    ELSE
        RAISE NOTICE '✅ NO OBVIOUS ISSUES - Problem might be in application code';
    END IF;
END $$;
