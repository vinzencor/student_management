-- =====================================================
-- MINIMAL SETUP SCRIPT (Most Reliable)
-- This avoids all auth table complications
-- Just creates the essential staff and permission records
-- =====================================================

-- Clean up any existing records first (optional)
DELETE FROM staff WHERE email IN ('admin@educare.com', 'teacher@educare.com', 'accountant@educare.com', 'office@educare.com');

-- Create staff records
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
    'active',
    NULL
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
    'active',
    ARRAY['Mathematics', 'Physics', 'Science']
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
    'active',
    NULL
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
    'active',
    NULL
);

-- Ensure role permissions exist
-- First, clean up existing permissions to avoid duplicates
DELETE FROM role_permissions;

-- Insert all role permissions
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
('accountant', 'export_financial_data');

-- Verification queries
SELECT 
    '✅ STAFF RECORDS CREATED' as status,
    email,
    role,
    first_name || ' ' || last_name as name
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
    '✅ PERMISSIONS CREATED' as status,
    role,
    COUNT(*) as permission_count
FROM role_permissions 
GROUP BY role
ORDER BY role;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 MINIMAL SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Created Records:';
    RAISE NOTICE '   👤 Super Admin: admin@educare.com';
    RAISE NOTICE '   👨‍🏫 Teacher: teacher@educare.com';
    RAISE NOTICE '   💰 Accountant: accountant@educare.com';
    RAISE NOTICE '   🏢 Office Staff: office@educare.com';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 LOGIN INSTRUCTIONS:';
    RAISE NOTICE '   📧 Email: admin@educare.com';
    RAISE NOTICE '   🔑 Password: Any password (e.g., admin123)';
    RAISE NOTICE '';
    RAISE NOTICE '💡 How it works:';
    RAISE NOTICE '   • The app recognizes admin@educare.com';
    RAISE NOTICE '   • Automatically grants super admin access';
    RAISE NOTICE '   • Uses demo authentication mode';
    RAISE NOTICE '   • All permissions are properly assigned';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready to use! No more "Access Denied" errors!';
    RAISE NOTICE '';
END $$;
