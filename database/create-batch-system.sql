-- Create dynamic batch management system

-- Create batches table
CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- e.g., "6th Batch A", "7th Batch B"
  academic_year VARCHAR(20) NOT NULL, -- e.g., "2025-2026"
  course_id UUID REFERENCES courses(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  max_students INTEGER DEFAULT 30,
  current_students INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_batches junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS student_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'dropped')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, batch_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_batches_academic_year ON batches(academic_year);
CREATE INDEX IF NOT EXISTS idx_batches_course_id ON batches(course_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_student_batches_student_id ON student_batches(student_id);
CREATE INDEX IF NOT EXISTS idx_student_batches_batch_id ON student_batches(batch_id);

-- Create trigger to update current_students count
CREATE OR REPLACE FUNCTION update_batch_student_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE batches 
        SET current_students = (
            SELECT COUNT(*) 
            FROM student_batches 
            WHERE batch_id = NEW.batch_id AND status = 'active'
        )
        WHERE id = NEW.batch_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update count for both old and new batch if batch_id changed
        IF OLD.batch_id != NEW.batch_id THEN
            UPDATE batches 
            SET current_students = (
                SELECT COUNT(*) 
                FROM student_batches 
                WHERE batch_id = OLD.batch_id AND status = 'active'
            )
            WHERE id = OLD.batch_id;
        END IF;
        
        UPDATE batches 
        SET current_students = (
            SELECT COUNT(*) 
            FROM student_batches 
            WHERE batch_id = NEW.batch_id AND status = 'active'
        )
        WHERE id = NEW.batch_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE batches 
        SET current_students = (
            SELECT COUNT(*) 
            FROM student_batches 
            WHERE batch_id = OLD.batch_id AND status = 'active'
        )
        WHERE id = OLD.batch_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_batch_student_count ON student_batches;
CREATE TRIGGER trigger_update_batch_student_count
    AFTER INSERT OR UPDATE OR DELETE ON student_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_batch_student_count();

-- Create view for batch details with student count and course info
CREATE OR REPLACE VIEW batch_details AS
SELECT 
    b.*,
    c.name as course_name,
    c.price as course_price,
    COUNT(sb.student_id) FILTER (WHERE sb.status = 'active') as active_students
FROM batches b
LEFT JOIN courses c ON b.course_id = c.id
LEFT JOIN student_batches sb ON b.id = sb.batch_id
GROUP BY b.id, c.name, c.price
ORDER BY b.academic_year DESC, b.start_date DESC;

-- Insert some sample academic years and batches
INSERT INTO batches (name, academic_year, start_date, end_date, description) VALUES
('Academic Year 2025', '2025-2026', '2025-04-01', '2026-03-31', 'Main academic year 2025-2026'),
('Academic Year 2026', '2026-2027', '2026-04-01', '2027-03-31', 'Main academic year 2026-2027'),
('August 2025 to February 2026', '2025-2026', '2025-08-01', '2026-02-28', 'Short term batch'),
('6th Batch A', '2025-2026', '2025-06-01', '2025-12-01', 'Mathematics and Science batch'),
('6th Batch B', '2025-2026', '2025-07-01', '2026-01-01', 'English and Social Studies batch'),
('7th Batch A', '2025-2026', '2025-08-01', '2026-02-01', 'Advanced Mathematics batch')
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE batches IS 'Dynamic batch management system for organizing students';
COMMENT ON TABLE student_batches IS 'Junction table linking students to batches';
COMMENT ON COLUMN batches.academic_year IS 'Academic year in format YYYY-YYYY';
COMMENT ON COLUMN batches.max_students IS 'Maximum number of students allowed in this batch';
COMMENT ON COLUMN batches.current_students IS 'Current number of active students in this batch';
