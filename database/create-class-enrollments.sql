-- Create class enrollments table for student-class relationships

-- Create class_enrollments table
CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'dropped')),
  grade NUMERIC(5,2), -- Final grade for the class
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate enrollments
  UNIQUE(student_id, class_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_status ON class_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_enrollment_date ON class_enrollments(enrollment_date);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_class_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_class_enrollments_updated_at ON class_enrollments;
CREATE TRIGGER trigger_update_class_enrollments_updated_at
  BEFORE UPDATE ON class_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_class_enrollments_updated_at();

-- Insert some sample enrollments if we have students and classes
DO $$
DECLARE
    student_record RECORD;
    class_record RECORD;
BEGIN
    -- Enroll first 3 students in first available class
    FOR student_record IN 
        SELECT id FROM students WHERE status = 'active' LIMIT 3
    LOOP
        FOR class_record IN 
            SELECT id FROM classes WHERE status = 'active' LIMIT 1
        LOOP
            INSERT INTO class_enrollments (student_id, class_id, enrollment_date, status)
            VALUES (student_record.id, class_record.id, CURRENT_DATE, 'active')
            ON CONFLICT (student_id, class_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Disable RLS for development
ALTER TABLE class_enrollments DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON class_enrollments TO authenticated;
