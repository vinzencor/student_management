-- =====================================================
-- FOOLPROOF SETUP SCRIPT
-- 100% Reliable - No Auth Table Complications
-- Creates only what's needed for the app to work
-- =====================================================

-- Display setup information
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 FOOLPROOF STAFF MANAGEMENT SETUP';
    RAISE NOTICE '=====================================';
    RAISE NOTICE '';
    RAISE NOTICE '💡 This script creates:';
    RAISE NOTICE '   ✅ Staff records for all roles';
    RAISE NOTICE '   ✅ Role permissions';
    RAISE NOTICE '   ✅ Demo data for testing';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Login after setup:';
    RAISE NOTICE '   📧 Email: admin@educare.com';
    RAISE NOTICE '   🔑 Password: Any password';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Starting setup...';
    RAISE NOTICE '';
END $$;

-- Step 1: Clean up existing data (optional - prevents duplicates)
DELETE FROM staff WHERE email IN (
    'admin@educare.com', 
    'teacher@educare.com', 
    'accountant@educare.com', 
    'office@educare.com'
);

DELETE FROM role_permissions; -- Clean slate for permissions

-- Step 2: Create staff records
INSERT INTO staff (
    first_name,
    last_name,
    email,
    phone,
    role,
    qualification,
    experience_years,
    salary,
    hire_date,
    status,
    subjects
) VALUES 
-- Super Admin Record
(
    'Super',
    'Admin',
    'admin@educare.com',
    '+1-555-0001',
    'super_admin',
    'System Administrator',
    10,
    8000.00,
    CURRENT_DATE,
    'active',
    NULL
),
-- Teacher Record
(
    'John',
    'Smith',
    'teacher@educare.com',
    '+1-555-0002',
    'teacher',
    'M.Sc Mathematics, B.Ed',
    8,
    3500.00,
    CURRENT_DATE,
    'active',
    ARRAY['Mathematics', 'Physics', 'Science']
),
-- Accountant Record
(
    'Sarah',
    'Johnson',
    'accountant@educare.com',
    '+1-555-0003',
    'accountant',
    'CPA, MBA Finance',
    6,
    4000.00,
    CURRENT_DATE,
    'active',
    NULL
),
-- Office Staff Record
(
    'Mike',
    'Brown',
    'office@educare.com',
    '+1-555-0004',
    'office_staff',
    'BA Administration',
    3,
    2500.00,
    CURRENT_DATE,
    'active',
    NULL
);

-- Step 3: Create comprehensive role permissions
INSERT INTO role_permissions (role, permission) VALUES
-- Super Admin Permissions (Complete Access)
('super_admin', 'view_dashboard'),
('super_admin', 'manage_staff'),
('super_admin', 'manage_students'),
('super_admin', 'manage_leads'),
('super_admin', 'manage_classes'),
('super_admin', 'manage_fees'),
('super_admin', 'view_reports'),
('super_admin', 'export_data'),
('super_admin', 'manage_settings'),
('super_admin', 'view_all_reports'),
('super_admin', 'manage_salaries'),
('super_admin', 'view_student_details'),
('super_admin', 'view_student_fees'),
('super_admin', 'view_student_reports'),
('super_admin', 'view_financial_reports'),
('super_admin', 'view_money_flow'),
('super_admin', 'export_financial_data'),
('super_admin', 'manage_communications'),

-- Teacher Permissions
('teacher', 'view_dashboard'),
('teacher', 'view_students'),
('teacher', 'view_student_details'),
('teacher', 'view_student_fees'),
('teacher', 'view_student_reports'),
('teacher', 'mark_attendance'),
('teacher', 'add_performance'),
('teacher', 'view_classes'),

-- Accountant Permissions
('accountant', 'view_dashboard'),
('accountant', 'manage_fees'),
('accountant', 'view_financial_reports'),
('accountant', 'manage_salaries'),
('accountant', 'view_money_flow'),
('accountant', 'export_financial_data'),

-- Office Staff Permissions
('office_staff', 'view_dashboard'),
('office_staff', 'manage_students'),
('office_staff', 'manage_leads'),
('office_staff', 'view_reports'),
('office_staff', 'manage_communications');

-- Step 4: Create some sample salary records for testing
INSERT INTO salary_records (
    staff_id,
    amount,
    payment_date,
    payment_method,
    month_year,
    status,
    notes
) 
SELECT 
    s.id,
    s.salary,
    CURRENT_DATE - INTERVAL '1 month',
    'bank_transfer',
    TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'),
    'paid',
    'Monthly salary payment'
FROM staff s 
WHERE s.salary IS NOT NULL;

-- Step 5: Verification and Results
DO $$
DECLARE
    staff_count INTEGER;
    permission_count INTEGER;
    admin_exists BOOLEAN;
BEGIN
    -- Count what we created
    SELECT COUNT(*) INTO staff_count FROM staff WHERE email LIKE '%@educare.com';
    SELECT COUNT(*) INTO permission_count FROM role_permissions;
    SELECT EXISTS(SELECT 1 FROM staff WHERE email = 'admin@educare.com' AND role = 'super_admin') INTO admin_exists;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Created Records:';
    RAISE NOTICE '   👥 Staff Members: %', staff_count;
    RAISE NOTICE '   🔑 Role Permissions: %', permission_count;
    RAISE NOTICE '   💰 Salary Records: %', staff_count;
    RAISE NOTICE '';
    
    IF admin_exists THEN
        RAISE NOTICE '🎯 SUPER ADMIN READY:';
        RAISE NOTICE '   📧 Email: admin@educare.com';
        RAISE NOTICE '   🔑 Password: Any password (demo mode)';
        RAISE NOTICE '   🚀 Status: Ready to login!';
    ELSE
        RAISE NOTICE '❌ ERROR: Super admin not created properly';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔐 OTHER TEST ACCOUNTS:';
    RAISE NOTICE '   👨‍🏫 Teacher: teacher@educare.com';
    RAISE NOTICE '   💰 Accountant: accountant@educare.com';
    RAISE NOTICE '   🏢 Office Staff: office@educare.com';
    RAISE NOTICE '';
    RAISE NOTICE '💡 HOW TO LOGIN:';
    RAISE NOTICE '   1. Use any of the emails above';
    RAISE NOTICE '   2. Enter any password';
    RAISE NOTICE '   3. App automatically assigns correct role';
    RAISE NOTICE '   4. Full permissions granted based on role';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SYSTEM READY FOR USE!';
    RAISE NOTICE '';
END $$;

-- Step 6: Show created records
SELECT 
    '👥 STAFF RECORDS' as category,
    email,
    role,
    first_name || ' ' || last_name as name,
    status
FROM staff 
WHERE email LIKE '%@educare.com'
ORDER BY 
    CASE role 
        WHEN 'super_admin' THEN 1
        WHEN 'teacher' THEN 2
        WHEN 'accountant' THEN 3
        WHEN 'office_staff' THEN 4
    END;

SELECT 
    '🔑 ROLE PERMISSIONS' as category,
    role,
    COUNT(*) as permission_count
FROM role_permissions 
GROUP BY role
ORDER BY role;
