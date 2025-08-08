-- =====================================================
-- SIMPLE SETUP SCRIPT (No Auth User Creation)
-- This only creates staff records and permissions
-- Use this if the main script fails due to auth permissions
-- =====================================================

-- Step 1: Create staff records for all roles
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
    status
) VALUES 
-- Super Admin
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
    'active'
),
-- Sample Teacher
(
    'John',
    'Smith',
    'teacher@educare.com',
    '+1-555-0002',
    'teacher',
    'M.Sc Mathematics',
    8,
    3500.00,
    CURRENT_DATE,
    'active'
),
-- Sample Accountant
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
    'active'
),
-- Sample Office Staff
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
    'active'
)
ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();

-- Step 2: Update staff table to include subjects for teachers
UPDATE staff 
SET subjects = ARRAY['Mathematics', 'Physics', 'Science']
WHERE role = 'teacher' AND subjects IS NULL;

-- Step 3: Ensure role permissions exist (insert if not already there)
INSERT INTO role_permissions (role, permission) VALUES
-- Super Admin permissions (full access)
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

-- Teacher permissions
('teacher', 'view_dashboard'),
('teacher', 'view_students'),
('teacher', 'view_student_details'),
('teacher', 'view_student_fees'),
('teacher', 'view_student_reports'),
('teacher', 'mark_attendance'),
('teacher', 'add_performance'),
('teacher', 'view_classes'),

-- Office Staff permissions
('office_staff', 'view_dashboard'),
('office_staff', 'manage_students'),
('office_staff', 'manage_leads'),
('office_staff', 'view_reports'),
('office_staff', 'manage_communications'),

-- Accountant permissions
('accountant', 'view_dashboard'),
('accountant', 'manage_fees'),
('accountant', 'view_financial_reports'),
('accountant', 'manage_salaries'),
('accountant', 'view_money_flow'),
('accountant', 'export_financial_data')
ON CONFLICT (role, permission) DO NOTHING;

-- Step 4: Verify the setup
SELECT 
    'STAFF RECORDS' as table_name,
    email,
    role::text,
    (status = 'active')::text::boolean as active
FROM staff 
WHERE email LIKE '%@educare.com'
ORDER BY role, email;

-- Step 5: Show role permissions count
SELECT 
    'ROLE PERMISSIONS' as table_name,
    role,
    COUNT(*) as permission_count
FROM role_permissions 
GROUP BY role
ORDER BY role;

-- Step 6: Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ SIMPLE SETUP COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 What was created:';
    RAISE NOTICE '   👥 Staff records for all roles';
    RAISE NOTICE '   🔑 Role permissions for all roles';
    RAISE NOTICE '   📧 admin@educare.com staff record';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Login Instructions:';
    RAISE NOTICE '   📧 Email: admin@educare.com';
    RAISE NOTICE '   🔑 Password: Any password (demo mode)';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Note: This uses demo authentication.';
    RAISE NOTICE '   The app will recognize admin@educare.com';
    RAISE NOTICE '   and automatically grant super admin access.';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 You can now login and use all features!';
END $$;
