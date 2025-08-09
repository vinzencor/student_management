-- Create function to create auth users from the application
-- This provides an alternative to the admin API for creating users

-- First, ensure the staff_role enum exists and handle different schema versions
DO $$
DECLARE
    role_column_type TEXT;
BEGIN
    -- Check if staff_role enum exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role') THEN
        CREATE TYPE staff_role AS ENUM ('teacher', 'office_staff', 'accountant', 'super_admin');
        RAISE NOTICE '✅ Created staff_role enum';
    END IF;

    -- Check if staff table exists and what type the role column is
    SELECT data_type INTO role_column_type
    FROM information_schema.columns
    WHERE table_name = 'staff' AND column_name = 'role';

    -- If staff table exists but role column is VARCHAR, alter it to use enum
    IF role_column_type = 'character varying' THEN
        -- First update any invalid role values
        UPDATE staff SET role = 'teacher' WHERE role NOT IN ('teacher', 'office_staff', 'accountant', 'super_admin');

        -- Alter column to use enum
        ALTER TABLE staff ALTER COLUMN role TYPE staff_role USING role::staff_role;
        RAISE NOTICE '✅ Updated staff.role column to use staff_role enum';
    END IF;
END $$;

-- Function to create a new auth user and staff record
CREATE OR REPLACE FUNCTION create_staff_with_auth(
  p_email TEXT,
  p_password TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role TEXT,
  p_phone TEXT DEFAULT NULL,
  p_qualification TEXT DEFAULT NULL,
  p_experience_years INTEGER DEFAULT 0,
  p_salary DECIMAL(10,2) DEFAULT NULL,
  p_subjects TEXT[] DEFAULT NULL
)
RETURNS TABLE(
  user_id UUID,
  staff_id UUID,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  new_user_id UUID;
  new_staff_id UUID;
  user_exists BOOLEAN;
  role_column_type TEXT;
BEGIN
  -- Generate new user ID
  new_user_id := gen_random_uuid();
  new_staff_id := gen_random_uuid();
  
  -- Check if user already exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = p_email
  ) INTO user_exists;
  
  IF user_exists THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'User with this email already exists';
    RETURN;
  END IF;
  
  -- Create auth user
  BEGIN
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
      p_email,
      crypt(p_password, gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      format('{"first_name": "%s", "last_name": "%s", "role": "%s"}', 
             p_first_name, p_last_name, p_role)::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'Failed to create auth user: ' || SQLERRM;
    RETURN;
  END;
  
  -- Create staff record
  BEGIN
    -- Check the role column type to determine how to insert
    SELECT data_type INTO role_column_type
    FROM information_schema.columns
    WHERE table_name = 'staff' AND column_name = 'role';

    -- Insert with appropriate role casting
    IF role_column_type = 'USER-DEFINED' THEN
      -- Role column is enum type
      INSERT INTO staff (
        id,
        first_name,
        last_name,
        email,
        phone,
        role,
        subjects,
        qualification,
        experience_years,
        salary,
        hire_date,
        status,
        created_at,
        updated_at
      ) VALUES (
        new_user_id, -- Use the same ID as auth user
        p_first_name,
        p_last_name,
        p_email,
        COALESCE(p_phone, '+1234567890'),
        p_role::staff_role,
        p_subjects,
        p_qualification,
        p_experience_years,
        p_salary,
        CURRENT_DATE,
        'active',
        NOW(),
        NOW()
      );
    ELSE
      -- Role column is varchar type
      INSERT INTO staff (
        id,
        first_name,
        last_name,
        email,
        phone,
        role,
        subjects,
        qualification,
        experience_years,
        salary,
        hire_date,
        status,
        created_at,
        updated_at
      ) VALUES (
        new_user_id, -- Use the same ID as auth user
        p_first_name,
        p_last_name,
        p_email,
        COALESCE(p_phone, '+1234567890'),
        p_role,
        p_subjects,
        p_qualification,
        p_experience_years,
        p_salary,
        CURRENT_DATE,
        'active',
        NOW(),
        NOW()
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If staff creation fails, clean up auth user
    DELETE FROM auth.users WHERE id = new_user_id;
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'Failed to create staff record: ' || SQLERRM;
    RETURN;
  END;
  
  RETURN QUERY SELECT new_user_id, new_user_id, TRUE, 'Staff member created successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_staff_with_auth TO authenticated;

-- Function to update user password
CREATE OR REPLACE FUNCTION update_user_password(
  p_user_id UUID,
  p_new_password TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- Update the password
  UPDATE auth.users 
  SET 
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT TRUE, 'Password updated successfully';
  ELSE
    RETURN QUERY SELECT FALSE, 'User not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_password TO authenticated;

-- Function to get staff with auth info
CREATE OR REPLACE FUNCTION get_staff_with_auth()
RETURNS TABLE(
  staff_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT,
  subjects TEXT[],
  qualification TEXT,
  experience_years INTEGER,
  salary DECIMAL(10,2),
  hire_date DATE,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  auth_user_exists BOOLEAN,
  email_confirmed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.first_name,
    s.last_name,
    s.email,
    s.phone,
    s.role,
    s.subjects,
    s.qualification,
    s.experience_years,
    s.salary,
    s.hire_date,
    s.status,
    s.created_at,
    s.updated_at,
    (au.id IS NOT NULL) as auth_user_exists,
    (au.email_confirmed_at IS NOT NULL) as email_confirmed
  FROM staff s
  LEFT JOIN auth.users au ON s.id = au.id
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_staff_with_auth TO authenticated;

-- Test the function (optional - remove in production)
-- SELECT * FROM create_staff_with_auth(
--   'test@example.com',
--   'password123',
--   'Test',
--   'User',
--   'teacher',
--   '+1234567890',
--   'Test Qualification',
--   2,
--   45000.00,
--   ARRAY['Mathematics', 'Science']
-- );
