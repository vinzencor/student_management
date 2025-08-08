-- Create comprehensive attendance system

-- Create attendance table if it doesn't exist
CREATE TABLE IF NOT EXISTS attendance (
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
  ),
  
  -- Unique constraint to prevent duplicate attendance records for same person on same date
  CONSTRAINT unique_student_date UNIQUE (date, student_id),
  CONSTRAINT unique_staff_date UNIQUE (date, staff_id)
);

-- Create indexes for better performance
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

-- Create view for attendance summary
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

-- Create view for detailed attendance with person info
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
  st.role as staff_role
FROM attendance a
LEFT JOIN students s ON a.student_id = s.id
LEFT JOIN staff st ON a.staff_id = st.id
LEFT JOIN courses c ON s.course_id = c.id;

-- Insert some sample attendance data for testing
DO $$
DECLARE
  sample_date DATE := CURRENT_DATE;
  student_record RECORD;
  staff_record RECORD;
BEGIN
  -- Add attendance for all active students for today (default Present)
  FOR student_record IN 
    SELECT id FROM students WHERE status = 'active' LIMIT 5
  LOOP
    INSERT INTO attendance (date, student_id, status, notes)
    VALUES (sample_date, student_record.id, 'P', 'Auto-generated sample')
    ON CONFLICT (date, student_id) DO NOTHING;
  END LOOP;
  
  -- Add attendance for all active staff for today (default Present)
  FOR staff_record IN 
    SELECT id FROM staff WHERE status = 'active' LIMIT 3
  LOOP
    INSERT INTO attendance (date, staff_id, status, notes)
    VALUES (sample_date, staff_record.id, 'P', 'Auto-generated sample')
    ON CONFLICT (date, staff_id) DO NOTHING;
  END LOOP;
END $$;

-- Disable RLS for development
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance TO authenticated;
GRANT SELECT ON attendance_summary TO authenticated;
GRANT SELECT ON attendance_details TO authenticated;
