-- Add suspended status to students table

-- Update the status check constraint to include 'suspended'
ALTER TABLE students 
DROP CONSTRAINT IF EXISTS students_status_check;

ALTER TABLE students 
ADD CONSTRAINT students_status_check 
CHECK (status IN ('active', 'inactive', 'graduated', 'suspended'));

-- Add comment for documentation
COMMENT ON COLUMN students.status IS 'Student status: active (enrolled), inactive (not enrolled), graduated (completed), suspended (temporarily disabled)';

-- Create index for suspended students for better performance
CREATE INDEX IF NOT EXISTS idx_students_status_suspended ON students(status) WHERE status = 'suspended';
