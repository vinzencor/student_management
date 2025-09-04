-- Verify Database Setup
-- Run this after the fix-auth-schema-issues.sql to verify everything is working

-- Check 1: Verify all required tables exist
SELECT 
    '📋 REQUIRED TABLES' as check_type,
    table_name,
    '✅ Exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'parents', 'staff', 'students', 'courses', 'classes', 'leads', 
    'fees', 'attendance', 'performance', 'communications', 
    'transactions', 'income_types', 'expense_types', 'student_courses',
    'receipts', 'fee_receipts', 'external_fee_payments'
)
ORDER BY table_name;

-- Check 2: Verify RLS status (should be disabled for now)
SELECT 
    '🔒 RLS STATUS' as check_type,
    tablename,
    CASE WHEN rowsecurity THEN '🔒 ENABLED' ELSE '🔓 DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'parents', 'staff', 'students', 'courses', 'classes', 'leads', 
    'fees', 'attendance', 'performance', 'communications', 
    'transactions', 'income_types', 'expense_types'
)
ORDER BY tablename;

-- Check 3: Verify permissions for authenticated role
SELECT 
    '🔑 AUTHENTICATED PERMISSIONS' as check_type,
    table_name,
    privilege_type,
    'Granted' as status
FROM information_schema.table_privileges 
WHERE grantee = 'authenticated' 
AND table_schema = 'public'
AND table_name IN ('students', 'staff', 'leads', 'fees', 'transactions')
ORDER BY table_name, privilege_type;

-- Check 4: Verify demo data exists
SELECT 
    '👤 DEMO STAFF' as check_type,
    first_name || ' ' || last_name as name,
    email,
    role,
    status
FROM staff 
WHERE email = 'admin@educare.com';

-- Check 5: Verify income and expense types
SELECT 
    '💰 INCOME TYPES' as check_type,
    name,
    CASE WHEN is_default THEN '✅ Default' ELSE '📝 Custom' END as type,
    CASE WHEN is_active THEN '✅ Active' ELSE '❌ Inactive' END as status
FROM income_types 
ORDER BY is_default DESC, name;

SELECT 
    '💸 EXPENSE TYPES' as check_type,
    name,
    CASE WHEN is_default THEN '✅ Default' ELSE '📝 Custom' END as type,
    CASE WHEN is_active THEN '✅ Active' ELSE '❌ Inactive' END as status
FROM expense_types 
ORDER BY is_default DESC, name;

-- Check 6: Test basic table access
DO $$
DECLARE
    table_count INTEGER;
    accessible_tables INTEGER := 0;
    table_names TEXT[] := ARRAY['students', 'staff', 'leads', 'fees', 'transactions'];
    table_name TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TABLE ACCESS TEST:';
    RAISE NOTICE '====================';
    
    FOREACH table_name IN ARRAY table_names
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO table_count;
            accessible_tables := accessible_tables + 1;
            RAISE NOTICE '✅ % table: % records', table_name, table_count;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ % table: Access denied or error', table_name;
        END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 SUMMARY: %/% tables accessible', accessible_tables, array_length(table_names, 1);
    
    IF accessible_tables = array_length(table_names, 1) THEN
        RAISE NOTICE '🎉 All tables are accessible!';
    ELSE
        RAISE NOTICE '⚠️  Some tables have access issues';
    END IF;
END $$;

-- Check 7: Verify foreign key relationships
SELECT 
    '🔗 FOREIGN KEY RELATIONSHIPS' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('students', 'fees', 'attendance', 'performance')
ORDER BY tc.table_name, kcu.column_name;

-- Final status check
SELECT 
    '🎯 FINAL STATUS' as check_type,
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN (
                'parents', 'staff', 'students', 'courses', 'classes', 'leads', 
                'fees', 'attendance', 'performance', 'communications', 
                'transactions', 'income_types', 'expense_types'
            )
        ) >= 13 THEN '🎉 Database setup is COMPLETE!'
        ELSE '⚠️  Database setup is INCOMPLETE'
    END as status,
    'You can now login with admin@educare.com and any password' as login_info;
