-- Update all user passwords to "123456" for easier testing
-- Run this in your Supabase SQL Editor

-- WARNING: This will change ALL user passwords in the system
-- Only use this for development/testing environments

DO $$
DECLARE
    user_record RECORD;
    updated_count INTEGER := 0;
BEGIN
    -- Update all existing users' passwords to "123456"
    FOR user_record IN 
        SELECT id, email, raw_user_meta_data
        FROM auth.users 
        WHERE email IS NOT NULL
    LOOP
        -- Update the password for each user
        UPDATE auth.users 
        SET 
            encrypted_password = crypt('123456', gen_salt('bf')),
            updated_at = NOW()
        WHERE id = user_record.id;
        
        updated_count := updated_count + 1;
        
        RAISE NOTICE 'Updated password for: %', user_record.email;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔐 PASSWORD UPDATE COMPLETE';
    RAISE NOTICE '============================';
    RAISE NOTICE '✅ Total users updated: %', updated_count;
    RAISE NOTICE '🔑 New password for ALL users: 123456';
    RAISE NOTICE '';
    RAISE NOTICE '📧 LOGIN CREDENTIALS (Updated):';
    RAISE NOTICE '================================';
    RAISE NOTICE '📧 admin@educare.com → Password: 123456 (Super Admin)';
    RAISE NOTICE '📧 accountant@educare.com → Password: 123456 (Accountant)';
    RAISE NOTICE '📧 teacher@educare.com → Password: 123456 (Teacher)';
    RAISE NOTICE '📧 office@educare.com → Password: 123456 (Office Staff)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  SECURITY WARNING:';
    RAISE NOTICE 'This should only be used in development environments!';
    RAISE NOTICE 'Change passwords to secure ones in production.';
    
END $$;

-- Also update the demo login component to use the new password
-- You can also create specific users if they don't exist

-- Ensure demo users exist with the standard password
DO $$
DECLARE
    demo_users TEXT[][] := ARRAY[
        ['admin@educare.com', 'Super', 'Admin', 'super_admin'],
        ['accountant@educare.com', 'Sarah', 'Johnson', 'accountant'],
        ['teacher@educare.com', 'John', 'Smith', 'teacher'],
        ['office@educare.com', 'Mike', 'Wilson', 'office_staff']
    ];
    user_data TEXT[];
    user_exists BOOLEAN;
    new_user_id UUID;
BEGIN
    FOR i IN 1..array_length(demo_users, 1) LOOP
        user_data := demo_users[i];
        
        -- Check if user exists
        SELECT EXISTS(
            SELECT 1 FROM auth.users WHERE email = user_data[1]
        ) INTO user_exists;
        
        IF NOT user_exists THEN
            -- Create the user if they don't exist
            new_user_id := gen_random_uuid();
            
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
                user_data[1], -- email
                crypt('123456', gen_salt('bf')), -- password
                NOW(),
                '{"provider": "email", "providers": ["email"]}',
                format('{"first_name": "%s", "last_name": "%s", "role": "%s"}', 
                       user_data[2], user_data[3], user_data[4])::jsonb,
                NOW(),
                NOW(),
                '',
                '',
                '',
                ''
            );
            
            RAISE NOTICE '✅ Created new user: % with password: 123456', user_data[1];
            
            -- Also create corresponding staff record if it's not super_admin
            IF user_data[4] != 'super_admin' THEN
                INSERT INTO staff (
                    id,
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
                ) VALUES (
                    new_user_id,
                    user_data[2],
                    user_data[3],
                    user_data[1],
                    '+1234567890',
                    user_data[4],
                    'Demo Qualification',
                    5,
                    50000.00,
                    CURRENT_DATE,
                    'active'
                ) ON CONFLICT (email) DO NOTHING;
            END IF;
        ELSE
            RAISE NOTICE '✅ User already exists: %', user_data[1];
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 DEMO SETUP COMPLETE';
    RAISE NOTICE '======================';
    RAISE NOTICE 'All demo users now have password: 123456';
    
END $$;

-- Verify the setup
SELECT 
    email,
    raw_user_meta_data->>'first_name' as first_name,
    raw_user_meta_data->>'last_name' as last_name,
    raw_user_meta_data->>'role' as role,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at
FROM auth.users 
WHERE email LIKE '%@educare.com'
ORDER BY email;
