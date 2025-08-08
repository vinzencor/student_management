-- Add batch system to students table

-- Add batch-related columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS batch_duration TEXT CHECK (batch_duration IN ('6_months', '1_year', '2_years', '3_years', '4_years')),
ADD COLUMN IF NOT EXISTS batch_start_date DATE,
ADD COLUMN IF NOT EXISTS batch_end_date DATE,
ADD COLUMN IF NOT EXISTS academic_year TEXT; -- e.g., '2025-2026'

-- Function to calculate batch end date based on duration and start date
CREATE OR REPLACE FUNCTION calculate_batch_end_date(start_date DATE, duration TEXT)
RETURNS DATE AS $$
BEGIN
  CASE duration
    WHEN '6_months' THEN RETURN start_date + INTERVAL '6 months';
    WHEN '1_year' THEN RETURN start_date + INTERVAL '1 year';
    WHEN '2_years' THEN RETURN start_date + INTERVAL '2 years';
    WHEN '3_years' THEN RETURN start_date + INTERVAL '3 years';
    WHEN '4_years' THEN RETURN start_date + INTERVAL '4 years';
    ELSE RETURN start_date + INTERVAL '1 year';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate academic year from start date
CREATE OR REPLACE FUNCTION calculate_academic_year(start_date DATE)
RETURNS TEXT AS $$
DECLARE
  year_start INTEGER;
  year_end INTEGER;
BEGIN
  -- Academic year starts in April (Indian system) or August (Western system)
  -- Using August as default based on your example
  IF EXTRACT(MONTH FROM start_date) >= 8 THEN
    year_start := EXTRACT(YEAR FROM start_date);
    year_end := year_start + 1;
  ELSE
    year_start := EXTRACT(YEAR FROM start_date) - 1;
    year_end := EXTRACT(YEAR FROM start_date);
  END IF;
  
  RETURN year_start || '-' || year_end;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate batch_end_date and academic_year when batch info is inserted/updated
CREATE OR REPLACE FUNCTION update_batch_calculations()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.batch_start_date IS NOT NULL AND NEW.batch_duration IS NOT NULL THEN
    NEW.batch_end_date := calculate_batch_end_date(NEW.batch_start_date, NEW.batch_duration);
    NEW.academic_year := calculate_academic_year(NEW.batch_start_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_batch_calculations ON students;
CREATE TRIGGER trigger_update_batch_calculations
  BEFORE INSERT OR UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_calculations();

-- Create indexes for batch filtering
CREATE INDEX IF NOT EXISTS idx_students_batch_duration ON students(batch_duration);
CREATE INDEX IF NOT EXISTS idx_students_batch_start_date ON students(batch_start_date);
CREATE INDEX IF NOT EXISTS idx_students_batch_end_date ON students(batch_end_date);
CREATE INDEX IF NOT EXISTS idx_students_academic_year ON students(academic_year);

-- Create view for active students (within their batch period)
CREATE OR REPLACE VIEW active_batch_students AS
SELECT s.*, c.name as course_name, c.price as course_price
FROM students s
LEFT JOIN courses c ON s.course_id = c.id
WHERE s.batch_start_date <= CURRENT_DATE 
  AND s.batch_end_date >= CURRENT_DATE
  AND s.status = 'active';

-- Grant permissions
GRANT SELECT ON active_batch_students TO authenticated;
GRANT SELECT, INSERT, UPDATE ON students TO authenticated;
