-- Fix attendance system - handle existing staff table

-- Add missing columns to existing staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS salary NUMERIC(12,2);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- First, let's check what enum values exist for staff_role and add 'admin' if needed
DO $$
BEGIN
    -- Try to add 'admin' to the enum if it doesn't exist
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role') THEN
        BEGIN
            ALTER TYPE staff_role ADD VALUE IF NOT EXISTS 'admin';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Ensure staff table has proper status constraint
DO $$
BEGIN
    ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_status_check;
    ALTER TABLE staff ADD CONSTRAINT staff_status_check
    CHECK (status IN ('active', 'inactive', 'terminated'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Insert some sample staff data if table is empty (using safe role values)
INSERT INTO staff (first_name, last_name, email, role, department)
SELECT 'John', 'Smith', 'john.smith@school.com', 'teacher', 'Mathematics'
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'john.smith@school.com');

INSERT INTO staff (first_name, last_name, email, role, department)
SELECT 'Sarah', 'Johnson', 'sarah.johnson@school.com', 'teacher', 'Science'
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'sarah.johnson@school.com');

INSERT INTO staff (first_name, last_name, email, role, department)
SELECT 'Mike', 'Davis', 'mike.davis@school.com', 'teacher', 'Administration'
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'mike.davis@school.com');

INSERT INTO staff (first_name, last_name, email, role, department)
SELECT 'Lisa', 'Wilson', 'lisa.wilson@school.com', 'teacher', 'English'
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'lisa.wilson@school.com');

INSERT INTO staff (first_name, last_name, email, role, department)
SELECT 'David', 'Brown', 'david.brown@school.com', 'teacher', 'History'
WHERE NOT EXISTS (SELECT 1 FROM staff WHERE email = 'david.brown@school.com');

-- Now create the attendance table with proper references
DROP TABLE IF EXISTS attendance CASCADE;

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('P', 'A', 'H')) DEFAULT 'P',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure either student_id or staff_id is set, but not both
  CONSTRAINT check_attendance_type CHECK (
    (student_id IS NOT NULL AND staff_id IS NULL) OR 
    (student_id IS NULL AND staff_id IS NOT NULL)
  )
);

-- Create unique indexes instead of constraints to handle NULLs properly
CREATE UNIQUE INDEX IF NOT EXISTS unique_student_attendance_date 
ON attendance (date, student_id) 
WHERE student_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_staff_attendance_date 
ON attendance (date, staff_id) 
WHERE staff_id IS NOT NULL;

-- Create other indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_id ON attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_attendance_updated_at ON attendance;
CREATE TRIGGER trigger_update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_updated_at();

-- Insert sample attendance data for testing
DO $$
DECLARE
  sample_date DATE := CURRENT_DATE;
  student_record RECORD;
  staff_record RECORD;
BEGIN
  -- Add attendance for students (if any exist)
  FOR student_record IN 
    SELECT id FROM students WHERE status = 'active' LIMIT 5
  LOOP
    INSERT INTO attendance (date, student_id, status, notes)
    VALUES (sample_date, student_record.id, 'P', 'Sample student attendance')
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- Add attendance for staff
  FOR staff_record IN 
    SELECT id FROM staff WHERE status = 'active' LIMIT 5
  LOOP
    INSERT INTO attendance (date, staff_id, status, notes)
    VALUES (sample_date, staff_record.id, 'P', 'Sample staff attendance')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Create views for easy querying
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
  a.date,
  a.status,
  COUNT(*) as count,
  CASE 
    WHEN a.student_id IS NOT NULL THEN 'student'
    WHEN a.staff_id IS NOT NULL THEN 'staff'
  END as type
FROM attendance a
GROUP BY a.date, a.status, 
  CASE 
    WHEN a.student_id IS NOT NULL THEN 'student'
    WHEN a.staff_id IS NOT NULL THEN 'staff'
  END;

-- Create detailed view with person information
CREATE OR REPLACE VIEW attendance_details AS
SELECT 
  a.id,
  a.date,
  a.status,
  a.notes,
  a.created_at,
  a.updated_at,
  CASE 
    WHEN a.student_id IS NOT NULL THEN 'student'
    WHEN a.staff_id IS NOT NULL THEN 'staff'
  END as type,
  COALESCE(s.first_name, st.first_name) as first_name,
  COALESCE(s.last_name, st.last_name) as last_name,
  COALESCE(s.email, st.email) as email,
  s.grade_level,
  c.name as course_name,
  st.role as staff_role,
  st.department as staff_department
FROM attendance a
LEFT JOIN students s ON a.student_id = s.id
LEFT JOIN staff st ON a.staff_id = st.id
LEFT JOIN courses c ON s.course_id = c.id;

-- Disable RLS for development
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON staff TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance TO authenticated;
GRANT SELECT ON attendance_summary TO authenticated;
GRANT SELECT ON attendance_details TO authenticated;
