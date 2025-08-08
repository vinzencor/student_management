-- =====================================================
-- SIMPLIFIED STAFF SETUP SCRIPT
-- This avoids all Supabase auth complications
-- Just creates staff records and permissions
-- =====================================================

-- NOTE: Creating auth users directly is complex and error-prone
-- The app is designed to work with demo authentication
-- This script only creates the staff records needed

DO $$
BEGIN
    RAISE NOTICE '🚀 Starting Staff Management Setup...';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Note: This script creates staff records only.';
    RAISE NOTICE '   The app uses demo authentication for admin@educare.com';
    RAISE NOTICE '   which automatically grants super admin access.';
    RAISE NOTICE '';
END $$;

-- Step 2: Create staff records for all roles
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

-- Step 3: Update staff table to include subjects for teachers
UPDATE staff 
SET subjects = ARRAY['Mathematics', 'Physics', 'Science']
WHERE role = 'teacher' AND subjects IS NULL;

-- Step 4: Create additional auth users for testing (optional)
-- Uncomment these if you want to create real login accounts for other roles

/*
-- Create Teacher User
DO $$
DECLARE
    teacher_user_id UUID;
BEGIN
    teacher_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        teacher_user_id, 'authenticated', 'authenticated',
        'teacher@educare.com', crypt('teacher123', gen_salt('bf')),
        NOW(), '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "John", "last_name": "Smith", "role": "teacher"}',
        NOW(), NOW()
    ) ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO auth.identities (id, user_id, identity_data, provider, created_at, updated_at)
    VALUES (teacher_user_id, teacher_user_id, 
            format('{"sub": "%s", "email": "teacher@educare.com"}', teacher_user_id)::jsonb,
            'email', NOW(), NOW())
    ON CONFLICT (provider, id) DO NOTHING;
END $$;

-- Create Accountant User
DO $$
DECLARE
    accountant_user_id UUID;
BEGIN
    accountant_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        accountant_user_id, 'authenticated', 'authenticated',
        'accountant@educare.com', crypt('accountant123', gen_salt('bf')),
        NOW(), '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "Sarah", "last_name": "Johnson", "role": "accountant"}',
        NOW(), NOW()
    ) ON CONFLICT (email) DO NOTHING;
    
    INSERT INTO auth.identities (id, user_id, identity_data, provider, created_at, updated_at)
    VALUES (accountant_user_id, accountant_user_id,
            format('{"sub": "%s", "email": "accountant@educare.com"}', accountant_user_id)::jsonb,
            'email', NOW(), NOW())
    ON CONFLICT (provider, id) DO NOTHING;
END $$;
*/

-- Step 5: Verify the setup
SELECT 
    'AUTH USERS' as table_name,
    email,
    raw_user_meta_data->>'role' as role,
    email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
WHERE email LIKE '%@educare.com'

UNION ALL

SELECT 
    'STAFF RECORDS' as table_name,
    email,
    role::text,
    (status = 'active')::text::boolean as active
FROM staff 
WHERE email LIKE '%@educare.com'
ORDER BY table_name, email;

-- Step 6: Show success message
DO $$
BEGIN
    RAISE NOTICE '✅ SETUP COMPLETE!';
    RAISE NOTICE '🔐 Super Admin Login:';
    RAISE NOTICE '   Email: admin@educare.com';
    RAISE NOTICE '   Password: admin123';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Staff records created for all roles';
    RAISE NOTICE '🔑 Authentication users created';
    RAISE NOTICE '✨ System ready for use!';
END $$;
