-- Create Super Admin Setup Script
-- Run this in your Supabase SQL Editor after setting up the database

-- First, create a super admin staff record for admin@educare.com
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
) VALUES (
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
) ON CONFLICT (email) DO NOTHING;

-- Create additional sample staff members for testing
INSERT INTO staff (
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
  status
) VALUES 
-- Sample Teacher
(
  'John',
  'Smith',
  'teacher@educare.com',
  '+1-555-0002',
  'teacher',
  ARRAY['Mathematics', 'Physics'],
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
  NULL,
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
  NULL,
  'BA Administration',
  3,
  2500.00,
  CURRENT_DATE,
  'active'
)
ON CONFLICT (email) DO NOTHING;

-- Verify the staff records were created
SELECT 
  first_name,
  last_name,
  email,
  role,
  status
FROM staff
ORDER BY role, first_name;
