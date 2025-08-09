-- Quick fix for staff role type issue
-- Run this to resolve the role column type mismatch

-- Check current staff table structure and fix role column type
DO $$
DECLARE
    role_column_type TEXT;
    enum_exists BOOLEAN;
BEGIN
    -- Check if staff_role enum exists
    SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'staff_role') INTO enum_exists;
    
    -- Create enum if it doesn't exist
    IF NOT enum_exists THEN
        CREATE TYPE staff_role AS ENUM ('teacher', 'office_staff', 'accountant', 'super_admin');
        RAISE NOTICE '✅ Created staff_role enum';
    ELSE
        RAISE NOTICE '✅ staff_role enum already exists';
    END IF;
    
    -- Check current role column type
    SELECT data_type INTO role_column_type
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'staff' 
    AND column_name = 'role';
    
    RAISE NOTICE 'Current role column type: %', role_column_type;
    
    -- If role column is VARCHAR, convert it to enum
    IF role_column_type = 'character varying' THEN
        RAISE NOTICE 'Converting role column from VARCHAR to ENUM...';
        
        -- First, ensure all existing role values are valid
        UPDATE staff 
        SET role = 'teacher' 
        WHERE role NOT IN ('teacher', 'office_staff', 'accountant', 'super_admin');
        
        -- Convert column to enum type
        ALTER TABLE staff 
        ALTER COLUMN role TYPE staff_role USING role::staff_role;
        
        RAISE NOTICE '✅ Successfully converted role column to staff_role enum';
    ELSE
        RAISE NOTICE '✅ Role column is already using correct type';
    END IF;
    
END $$;

-- Create a simple function that works with the current schema
CREATE OR REPLACE FUNCTION create_staff_with_auth_simple(
  p_email TEXT,
  p_password TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role TEXT,
  p_phone TEXT DEFAULT '+1234567890',
  p_qualification TEXT DEFAULT 'Not specified',
  p_experience_years INTEGER DEFAULT 0,
  p_salary DECIMAL(10,2) DEFAULT NULL,
  p_subjects TEXT[] DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  new_user_id UUID;
  user_exists BOOLEAN;
  result JSON;
BEGIN
  -- Generate new user ID
  new_user_id := gen_random_uuid();
  
  -- Check if user already exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = p_email
  ) INTO user_exists;
  
  IF user_exists THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User with this email already exists',
      'user_id', null
    );
  END IF;
  
  -- Validate role
  IF p_role NOT IN ('teacher', 'office_staff', 'accountant', 'super_admin') THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid role specified',
      'user_id', null
    );
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
      json_build_object(
        'first_name', p_first_name,
        'last_name', p_last_name,
        'role', p_role
      ),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Failed to create auth user: ' || SQLERRM,
      'user_id', null
    );
  END;
  
  -- Create staff record (using dynamic SQL to handle different column types)
  BEGIN
    -- Use the enum type casting
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
      new_user_id,
      p_first_name,
      p_last_name,
      p_email,
      p_phone,
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
  EXCEPTION WHEN OTHERS THEN
    -- If enum casting fails, try without casting
    BEGIN
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
        new_user_id,
        p_first_name,
        p_last_name,
        p_email,
        p_phone,
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
    EXCEPTION WHEN OTHERS THEN
      -- Clean up auth user if staff creation fails
      DELETE FROM auth.users WHERE id = new_user_id;
      RETURN json_build_object(
        'success', false,
        'message', 'Failed to create staff record: ' || SQLERRM,
        'user_id', null
      );
    END;
  END;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Staff member created successfully',
    'user_id', new_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_staff_with_auth_simple TO authenticated;

-- Test the function (uncomment to test)
-- SELECT create_staff_with_auth_simple(
--   'test.user@educare.com',
--   'password123',
--   'Test',
--   'User',
--   'teacher',
--   '+1234567890',
--   'Test Qualification',
--   2,
--   45000.00,
--   ARRAY['Mathematics']
-- );

RAISE NOTICE '';
RAISE NOTICE '🔧 STAFF ROLE FIX COMPLETE';
RAISE NOTICE '========================';
RAISE NOTICE '✅ Enum type created/verified';
RAISE NOTICE '✅ Role column type fixed';
RAISE NOTICE '✅ New function created: create_staff_with_auth_simple';
RAISE NOTICE '✅ Ready to create staff with passwords';
