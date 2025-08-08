-- =====================================================
-- SAFE DATABASE SETUP - Avoids All Constraint Issues
-- Creates essential tables and 10 staff members
-- Minimal constraints to prevent errors
-- =====================================================

-- Step 1: Create staff_role enum (essential for staff table)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role') THEN
        CREATE TYPE staff_role AS ENUM ('teacher', 'office_staff', 'accountant', 'super_admin');
        RAISE NOTICE '✅ Created staff_role enum';
    END IF;
END $$;

-- Step 2: Create essential tables with minimal constraints
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role staff_role NOT NULL DEFAULT 'teacher',
    subjects TEXT[],
    qualification TEXT,
    experience_years INTEGER DEFAULT 0,
    salary DECIMAL(10,2),
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL,
    permission VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, permission)
);

CREATE TABLE IF NOT EXISTS salary_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'bank_transfer',
    month_year VARCHAR(7) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    grade_level VARCHAR(20),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active',
    subjects TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'new',
    source VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add role column to auth.users (if it doesn't exist)
DO $$
BEGIN
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

-- Step 4: Clean up existing data safely
DO $$
BEGIN
    DELETE FROM salary_records WHERE staff_id IN (SELECT id FROM staff WHERE email LIKE '%@educare.com');
    DELETE FROM staff WHERE email LIKE '%@educare.com';
    DELETE FROM auth.users WHERE email LIKE '%@educare.com';
    DELETE FROM role_permissions;
    
    RAISE NOTICE '🧹 Cleaned up existing data';
END $$;

-- Step 5: Create 10 staff members with auth users
DO $$
DECLARE
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
        
        -- Update the role column
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
            staff_list[i][5]::staff_role, -- role
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

-- Step 6: Create role permissions
INSERT INTO role_permissions (role, permission) VALUES
-- Super Admin Permissions
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

-- Teacher Permissions
('teacher', 'view_dashboard'),
('teacher', 'view_students'),
('teacher', 'view_student_details'),
('teacher', 'view_student_reports'),

-- Accountant Permissions
('accountant', 'view_dashboard'),
('accountant', 'manage_fees'),
('accountant', 'view_financial_reports'),
('accountant', 'manage_salaries'),

-- Office Staff Permissions
('office_staff', 'view_dashboard'),
('office_staff', 'manage_students'),
('office_staff', 'manage_leads');

-- Step 7: Create sample data (safe values only)
INSERT INTO students (first_name, last_name, email, phone, grade_level, subjects) VALUES
('Alice', 'Johnson', 'alice.student@example.com', '+1-555-1001', 'Grade 10', ARRAY['Mathematics', 'Physics', 'English']),
('Bob', 'Smith', 'bob.student@example.com', '+1-555-1002', 'Grade 11', ARRAY['Chemistry', 'Biology', 'English']),
('Carol', 'Davis', 'carol.student@example.com', '+1-555-1003', 'Grade 9', ARRAY['History', 'Geography', 'English']);

INSERT INTO leads (first_name, last_name, email, phone, source, notes) VALUES
('John', 'Doe', 'john.doe@example.com', '+1-555-2001', 'website', 'Interested in Grade 11 admission'),
('Jane', 'Smith', 'jane.smith@example.com', '+1-555-2002', 'referral', 'Looking for science courses');

-- Step 8: Create salary records
INSERT INTO salary_records (staff_id, amount, payment_date, payment_method, month_year, status, notes)
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

-- Step 9: Final verification
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
    RAISE NOTICE '✅ SAFE SETUP COMPLETED!';
    RAISE NOTICE '====================';
    RAISE NOTICE '👤 Auth Users: %', auth_count;
    RAISE NOTICE '👥 Staff Records: %', staff_count;
    RAISE NOTICE '🔑 Permissions: %', permission_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔐 LOGIN: admin@educare.com / admin123';
    RAISE NOTICE '🚀 Ready to use!';
END $$;

-- Show created records
SELECT 'STAFF CREATED' as result, email, role, first_name || ' ' || last_name as name 
FROM staff WHERE email LIKE '%@educare.com' 
ORDER BY role, first_name;
