-- =====================================================
-- COMPLETE DATABASE + AUTH SETUP
-- Creates all tables, 10 staff members with auth users
-- Includes role field in auth.users for easy management
-- =====================================================

-- Step 1: Create custom types/enums
DO $$
BEGIN
    -- Create staff_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role') THEN
        CREATE TYPE staff_role AS ENUM ('teacher', 'office_staff', 'accountant', 'super_admin');
        RAISE NOTICE '✅ Created staff_role enum';
    END IF;
    
    -- Create student_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_status') THEN
        CREATE TYPE student_status AS ENUM ('active', 'inactive', 'graduated', 'dropped');
        RAISE NOTICE '✅ Created student_status enum';
    END IF;
    
    -- Create lead_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
        CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'interested', 'converted', 'lost');
        RAISE NOTICE '✅ Created lead_status enum';
    END IF;
    
    -- Create attendance_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
        RAISE NOTICE '✅ Created attendance_status enum';
    END IF;
    
    -- Create fee_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fee_status') THEN
        CREATE TYPE fee_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
        RAISE NOTICE '✅ Created fee_status enum';
    END IF;
    
    -- Create payment_method enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'cheque', 'online');
        RAISE NOTICE '✅ Created payment_method enum';
    END IF;
END $$;

-- Step 2: Create all necessary tables
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
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
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
    payment_method payment_method,
    month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    login_time TIMESTAMP WITH TIME ZONE NOT NULL,
    logout_time TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table (basic structure)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    grade_level VARCHAR(20),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status student_status DEFAULT 'active',
    subjects TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create other essential tables
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    status lead_status DEFAULT 'new',
    source VARCHAR(50) CHECK (source IN ('website', 'referral', 'social_media', 'walk_in', 'phone', 'email', 'advertisement', 'other')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    teacher_id UUID REFERENCES staff(id),
    schedule JSONB,
    capacity INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status fee_status DEFAULT 'pending',
    payment_method payment_method,
    receipt_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    test_name VARCHAR(100) NOT NULL,
    test_date DATE NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,
    total_marks DECIMAL(5,2) NOT NULL,
    grade VARCHAR(5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('student', 'parent', 'staff', 'all')),
    recipient_id UUID,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    sent_by UUID REFERENCES staff(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'failed'))
);

-- Step 3: Add role column to auth.users table (if it doesn't exist)
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

-- Step 4: Clean up existing data
DO $$
BEGIN
    DELETE FROM salary_records WHERE staff_id IN (SELECT id FROM staff WHERE email LIKE '%@educare.com');
    DELETE FROM staff_sessions WHERE staff_id IN (SELECT id FROM staff WHERE email LIKE '%@educare.com');
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

-- Step 6: Create comprehensive role permissions
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

-- Step 7: Create sample salary records for all staff
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

-- Step 8: Create some sample students for testing
INSERT INTO students (first_name, last_name, email, phone, grade_level, subjects) VALUES
('Alice', 'Johnson', 'alice.student@example.com', '+1-555-1001', 'Grade 10', ARRAY['Mathematics', 'Physics', 'English']),
('Bob', 'Smith', 'bob.student@example.com', '+1-555-1002', 'Grade 11', ARRAY['Chemistry', 'Biology', 'English']),
('Carol', 'Davis', 'carol.student@example.com', '+1-555-1003', 'Grade 9', ARRAY['History', 'Geography', 'English']),
('David', 'Wilson', 'david.student@example.com', '+1-555-1004', 'Grade 12', ARRAY['Mathematics', 'Physics', 'Chemistry']),
('Emma', 'Brown', 'emma.student@example.com', '+1-555-1005', 'Grade 10', ARRAY['English', 'Literature', 'History']);

-- Step 9: Create some sample leads
INSERT INTO leads (first_name, last_name, email, phone, source, notes) VALUES
('John', 'Doe', 'john.doe@example.com', '+1-555-2001', 'website', 'Interested in Grade 11 admission'),
('Jane', 'Smith', 'jane.smith@example.com', '+1-555-2002', 'referral', 'Looking for science courses'),
('Mark', 'Johnson', 'mark.johnson@example.com', '+1-555-2003', 'social_media', 'Wants information about fees'),
('Lisa', 'Davis', 'lisa.davis@example.com', '+1-555-2004', 'walk_in', 'Interested in mathematics tutoring');

-- Step 10: Verification and Results
DO $$
DECLARE
    auth_count INTEGER;
    staff_count INTEGER;
    permission_count INTEGER;
    student_count INTEGER;
    lead_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO auth_count FROM auth.users WHERE email LIKE '%@educare.com';
    SELECT COUNT(*) INTO staff_count FROM staff WHERE email LIKE '%@educare.com';
    SELECT COUNT(*) INTO permission_count FROM role_permissions;
    SELECT COUNT(*) INTO student_count FROM students;
    SELECT COUNT(*) INTO lead_count FROM leads;

    RAISE NOTICE '';
    RAISE NOTICE '📊 COMPLETE SETUP VERIFICATION:';
    RAISE NOTICE '==============================';
    RAISE NOTICE '👤 Auth Users Created: %', auth_count;
    RAISE NOTICE '👥 Staff Records Created: %', staff_count;
    RAISE NOTICE '🔑 Role Permissions: %', permission_count;
    RAISE NOTICE '🎓 Sample Students: %', student_count;
    RAISE NOTICE '📞 Sample Leads: %', lead_count;
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
    RAISE NOTICE '✅ COMPLETE SETUP FINISHED - Ready for production use!';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next Steps:';
    RAISE NOTICE '   1. Login with admin@educare.com / admin123';
    RAISE NOTICE '   2. Test all role-based features';
    RAISE NOTICE '   3. Add more students/staff as needed';
    RAISE NOTICE '   4. Configure any additional settings';
END $$;

-- Step 11: Display created records for verification
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
    salary,
    status
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

SELECT
    '🎓 SAMPLE DATA' as category,
    'Students: ' || (SELECT COUNT(*) FROM students)::text ||
    ', Leads: ' || (SELECT COUNT(*) FROM leads)::text ||
    ', Salary Records: ' || (SELECT COUNT(*) FROM salary_records)::text as summary;
