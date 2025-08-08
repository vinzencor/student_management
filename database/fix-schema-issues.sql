-- Fix missing columns in classes and fees tables

-- Add missing columns to classes table
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS day_of_week TEXT,
ADD COLUMN IF NOT EXISTS room TEXT,
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add missing columns to fees table
ALTER TABLE fees 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS fee_type TEXT DEFAULT 'tuition';

-- Add constraints for day_of_week
ALTER TABLE classes 
ADD CONSTRAINT IF NOT EXISTS check_day_of_week 
CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') OR day_of_week IS NULL);

-- Add constraint for fee_type
DO $$ 
BEGIN
    ALTER TABLE fees DROP CONSTRAINT IF EXISTS fees_fee_type_check;
    ALTER TABLE fees ADD CONSTRAINT fees_fee_type_check 
    CHECK (fee_type IN ('tuition', 'registration', 'exam', 'library', 'lab', 'transport', 'other') OR fee_type IS NULL);
END $$;

-- Update existing records to have default values
UPDATE fees SET fee_type = 'tuition' WHERE fee_type IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_day_of_week ON classes(day_of_week);
CREATE INDEX IF NOT EXISTS idx_classes_start_time ON classes(start_time);
CREATE INDEX IF NOT EXISTS idx_fees_fee_type ON fees(fee_type);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON classes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON fees TO authenticated;
