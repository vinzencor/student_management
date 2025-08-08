-- =====================================================
-- COMPLETE SUPABASE AUTH + STAFF SETUP
-- Creates 10 staff members with proper auth users
-- Adds role field to auth.users for easy role management
-- =====================================================

-- Step 1: Add role column to auth.users table (if it doesn't exist)
DO $$
BEGIN
    -- Check if role column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN role VARCHAR(20) DEFAULT 'teacher';
        RAISE NOTICE '✅ Added role column to auth.users table';
    ELSE
        RAISE NOTICE '✅ Role column already exists in auth.users table';
    END IF;
END $$;

-- Step 2: Clean up existing data
DELETE FROM staff WHERE email LIKE '%@educare.com';
DELETE FROM auth.users WHERE email LIKE '%@educare.com';
DELETE FROM role_permissions;

-- Step 3: Create 10 staff members with auth users
DO $$
DECLARE
    staff_data RECORD;
    new_user_id UUID;
    staff_list TEXT[][] := ARRAY[
        ['Super', 'Admin', 'admin@educare.com', '+1-555-0001', 'super_admin', 'System Administrator', '10', '8000', 'admin123'],
        ['John', 'Smith', 'john.teacher@educare.com', '+1-555-0002', 'teacher', 'M.Sc Mathematics', '8', '3500', 'teacher123'],
        ['Sarah', 'Johnson', 'sarah.accountant@educare.com', '+1-555-0003', 'accountant', 'CPA, MBA Finance', '6', '4000', 'accountant123'],
        ['Mike', 'Brown', 'mike.office@educare.com', '+1-555-0004', 'office_staff', 'BA Administration', '3', '2500', 'office123'],
        ['Emily', 'Davis', 'emily.teacher@educare.com', '+1-555-0005', 'teacher', 'B.Ed English Literature', '5', '3200', 'teacher123'],
        ['David', 'Wilson', 'david.teacher@educare.com', '+1-555-0006', 'teacher', 'M.Sc Physics', '7', '3600', 'teacher123'],
        ['Lisa', 'Anderson', 'lisa.office@educare.com', '+1-555-0007', 'office_staff', 'BA Business Administration', '4', '2800', 'office123'],
        ['Robert', 'Taylor', 'robert.teacher@educare.com', '+1-555-0008', 'teacher', 'M.A History', '9', '3800', 'teacher123'],
        ['Jennifer', 'Martinez', 'jennifer.accountant@educare.com', '+1-555-0009', 'accountant', 'MBA Finance', '5', '3900', 'accountant123'],
        ['Michael', 'Garcia', 'michael.admin@educare.com', '+1-555-0010', 'super_admin', 'MBA Management', '12', '7500', 'admin123']
    ];
BEGIN
    RAISE NOTICE '🚀 Creating 10 staff members with auth users...';
    RAISE NOTICE '';
    
    FOR i IN 1..array_length(staff_list, 1) LOOP
        -- Generate new user ID
        new_user_id := gen_random_uuid();
        
        -- Create auth user
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            staff_list[i][3], -- email
            crypt(staff_list[i][9], gen_salt('bf')), -- password
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            format('{"first_name": "%s", "last_name": "%s", "role": "%s"}', 
                   staff_list[i][1], staff_list[i][2], staff_list[i][5])::jsonb,
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );
        
        -- Update the role column we added
        UPDATE auth.users 
        SET role = staff_list[i][5] 
        WHERE id = new_user_id;
        
        -- Create staff record
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
        ) VALUES (
            staff_list[i][1], -- first_name
            staff_list[i][2], -- last_name
            staff_list[i][3], -- email
            staff_list[i][4], -- phone
            staff_list[i][5]::staff_role, -- role (cast to enum)
            staff_list[i][6], -- qualification
            staff_list[i][7]::INTEGER, -- experience_years
            staff_list[i][8]::DECIMAL, -- salary
            CURRENT_DATE,
            'active',
            CASE 
                WHEN staff_list[i][5] = 'teacher' THEN 
                    CASE staff_list[i][3]
                        WHEN 'john.teacher@educare.com' THEN ARRAY['Mathematics', 'Physics']
                        WHEN 'emily.teacher@educare.com' THEN ARRAY['English', 'Literature']
                        WHEN 'david.teacher@educare.com' THEN ARRAY['Physics', 'Science']
                        WHEN 'robert.teacher@educare.com' THEN ARRAY['History', 'Social Studies']
                        ELSE ARRAY['General']
                    END
                ELSE NULL
            END
        );
        
        RAISE NOTICE '✅ Created: % % (%) - %', 
                     staff_list[i][1], staff_list[i][2], staff_list[i][5], staff_list[i][3];
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 All 10 staff members created successfully!';
END $$;

-- Step 4: Create comprehensive role permissions
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

-- Step 5: Create sample salary records for all staff
INSERT INTO salary_records (staff_id, amount, payment_date, payment_method, month_year, status, notes)
SELECT 
    s.id,
    s.salary,
    CURRENT_DATE - INTERVAL '1 month',
    'bank_transfer',
    TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'),
    'paid',
    'Monthly salary payment - ' || TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'Month YYYY')
FROM staff s 
WHERE s.salary IS NOT NULL;

-- Step 6: Verification and Results
DO $$
DECLARE
    auth_count INTEGER;
    staff_count INTEGER;
    permission_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO auth_count FROM auth.users WHERE email LIKE '%@educare.com';
    SELECT COUNT(*) INTO staff_count FROM staff WHERE email LIKE '%@educare.com';
    SELECT COUNT(*) INTO permission_count FROM role_permissions;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 SETUP VERIFICATION:';
    RAISE NOTICE '=====================';
    RAISE NOTICE '👤 Auth Users Created: %', auth_count;
    RAISE NOTICE '👥 Staff Records Created: %', staff_count;
    RAISE NOTICE '🔑 Role Permissions: %', permission_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔐 LOGIN CREDENTIALS:';
    RAISE NOTICE '====================';
    RAISE NOTICE '📧 admin@educare.com → Password: admin123 (Super Admin)';
    RAISE NOTICE '📧 john.teacher@educare.com → Password: teacher123 (Teacher)';
    RAISE NOTICE '📧 sarah.accountant@educare.com → Password: accountant123 (Accountant)';
    RAISE NOTICE '📧 mike.office@educare.com → Password: office123 (Office Staff)';
    RAISE NOTICE '📧 emily.teacher@educare.com → Password: teacher123 (Teacher)';
    RAISE NOTICE '📧 david.teacher@educare.com → Password: teacher123 (Teacher)';
    RAISE NOTICE '📧 lisa.office@educare.com → Password: office123 (Office Staff)';
    RAISE NOTICE '📧 robert.teacher@educare.com → Password: teacher123 (Teacher)';
    RAISE NOTICE '📧 jennifer.accountant@educare.com → Password: accountant123 (Accountant)';
    RAISE NOTICE '📧 michael.admin@educare.com → Password: admin123 (Super Admin)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ SETUP COMPLETE - Ready for real authentication!';
END $$;

-- Step 7: Display created records
SELECT 
    '👤 AUTH USERS' as category,
    email,
    role,
    email_confirmed_at IS NOT NULL as confirmed
FROM auth.users 
WHERE email LIKE '%@educare.com'
ORDER BY role, email;

SELECT 
    '👥 STAFF RECORDS' as category,
    email,
    role,
    first_name || ' ' || last_name as name,
    salary
FROM staff 
WHERE email LIKE '%@educare.com'
ORDER BY 
    CASE role 
        WHEN 'super_admin' THEN 1
        WHEN 'teacher' THEN 2
        WHEN 'accountant' THEN 3
        WHEN 'office_staff' THEN 4
    END, first_name;

SELECT 
    '🔑 PERMISSIONS BY ROLE' as category,
    role,
    COUNT(*) as permission_count
FROM role_permissions 
GROUP BY role
ORDER BY role;
