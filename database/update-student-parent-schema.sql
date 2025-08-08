-- Update students and parents tables for comprehensive admission data

-- Add new columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS religion TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Indian',
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS medical_conditions TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS previous_school TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add new columns to parents table
ALTER TABLE parents 
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS annual_income TEXT,
ADD COLUMN IF NOT EXISTS education_qualification TEXT,
ADD COLUMN IF NOT EXISTS relationship_to_student TEXT DEFAULT 'Father';

-- Add constraints for gender and blood group
ALTER TABLE students 
ADD CONSTRAINT IF NOT EXISTS check_gender 
CHECK (gender IN ('Male', 'Female', 'Other') OR gender IS NULL);

ALTER TABLE students 
ADD CONSTRAINT IF NOT EXISTS check_blood_group 
CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') OR blood_group IS NULL);

-- Add constraint for relationship
ALTER TABLE parents 
ADD CONSTRAINT IF NOT EXISTS check_relationship 
CHECK (relationship_to_student IN ('Father', 'Mother', 'Guardian', 'Other') OR relationship_to_student IS NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_date_of_birth ON students(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_students_gender ON students(gender);
CREATE INDEX IF NOT EXISTS idx_students_grade_level ON students(grade_level);
CREATE INDEX IF NOT EXISTS idx_parents_occupation ON parents(occupation);

-- Update existing records to have default values where needed
UPDATE students SET nationality = 'Indian' WHERE nationality IS NULL;
UPDATE parents SET relationship_to_student = 'Father' WHERE relationship_to_student IS NULL;

-- Grant permissions for new columns
GRANT SELECT, INSERT, UPDATE ON students TO authenticated;
GRANT SELECT, INSERT, UPDATE ON parents TO authenticated;
