-- Create courses table and link to students

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  duration_months INTEGER DEFAULT 12,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add course_id to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;

-- Add course_id to receipts table for direct reference
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_receipts_course_id ON receipts(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);

-- Insert some sample courses
INSERT INTO courses (name, description, price) VALUES
('Mathematics Foundation', 'Basic mathematics course for grades 6-8', 15000.00),
('Science Fundamentals', 'Physics, Chemistry, Biology basics', 18000.00),
('English Communication', 'Spoken and written English improvement', 12000.00),
('Computer Programming', 'Introduction to coding and programming', 25000.00),
('Art & Creativity', 'Drawing, painting, and creative arts', 10000.00)
ON CONFLICT DO NOTHING;

-- Disable RLS for development
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON courses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON students TO authenticated;
GRANT SELECT, INSERT, UPDATE ON receipts TO authenticated;

-- Create receipts table if it doesn't exist (in case previous migration wasn't run)
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,4) DEFAULT 0,
  tax_amount NUMERIC(12,2) GENERATED ALWAYS AS (ROUND(amount * tax_rate, 2)) STORED,
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (ROUND(amount + (amount * tax_rate), 2)) STORED,
  currency TEXT DEFAULT 'INR',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','printed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure receipts table has proper indexes and permissions
CREATE INDEX IF NOT EXISTS idx_receipts_lead_id ON receipts(lead_id);
CREATE INDEX IF NOT EXISTS idx_receipts_student_id ON receipts(student_id);
ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipts TO authenticated;
