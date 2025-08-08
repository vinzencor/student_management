-- =====================================================
-- ULTRA SIMPLE SETUP - GUARANTEED TO WORK
-- No fancy features, just the essentials
-- =====================================================

-- Create staff records (delete existing first to avoid conflicts)
DELETE FROM staff WHERE email IN ('admin@educare.com', 'teacher@educare.com', 'accountant@educare.com', 'office@educare.com');

INSERT INTO staff (first_name, last_name, email, phone, role, status, hire_date) VALUES 
('Super', 'Admin', 'admin@educare.com', '+1-555-0001', 'super_admin', 'active', CURRENT_DATE),
('John', 'Smith', 'teacher@educare.com', '+1-555-0002', 'teacher', 'active', CURRENT_DATE),
('Sarah', 'Johnson', 'accountant@educare.com', '+1-555-0003', 'accountant', 'active', CURRENT_DATE),
('Mike', 'Brown', 'office@educare.com', '+1-555-0004', 'office_staff', 'active', CURRENT_DATE);

-- Create role permissions (delete existing first)
DELETE FROM role_permissions;

INSERT INTO role_permissions (role, permission) VALUES 
-- Super Admin
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

-- Teacher
('teacher', 'view_dashboard'),
('teacher', 'view_students'),
('teacher', 'view_student_details'),
('teacher', 'view_student_reports'),

-- Accountant
('accountant', 'view_dashboard'),
('accountant', 'manage_fees'),
('accountant', 'view_financial_reports'),
('accountant', 'manage_salaries'),

-- Office Staff
('office_staff', 'view_dashboard'),
('office_staff', 'manage_students'),
('office_staff', 'manage_leads');

-- Show what was created
SELECT 'STAFF CREATED' as result, email, role FROM staff WHERE email LIKE '%@educare.com';
SELECT 'PERMISSIONS CREATED' as result, role, COUNT(*) as count FROM role_permissions GROUP BY role;
