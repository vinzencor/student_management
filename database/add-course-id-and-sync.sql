-- Add missing course_id column to fees table and set up course fee synchronization
-- This script handles the missing column error and sets up the sync system

-- Step 1: Add missing columns to fees table if they don't exist
ALTER TABLE fees 
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id),
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20),
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS fee_type VARCHAR(50) DEFAULT 'tuition',
ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 2: Update existing fees to have paid_amount = 0 where null
UPDATE fees SET paid_amount = 0 WHERE paid_amount IS NULL;

-- Step 3: Update existing fees to have fee_type = 'tuition' where null
UPDATE fees SET fee_type = 'tuition' WHERE fee_type IS NULL;

-- Step 4: Try to link existing fees to courses based on student's primary course
UPDATE fees 
SET course_id = s.course_id
FROM students s 
WHERE fees.student_id = s.id 
  AND fees.course_id IS NULL 
  AND s.course_id IS NOT NULL;

-- Step 5: Create the trigger function for course price updates
CREATE OR REPLACE FUNCTION sync_student_fees_on_course_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the price has actually changed
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    
    RAISE NOTICE 'Course % price changed from % to %', NEW.name, OLD.price, NEW.price;
    
    -- Update fee records for students enrolled in this course
    UPDATE fees 
    SET 
      amount = NEW.price,
      status = CASE 
        WHEN COALESCE(paid_amount, 0) >= NEW.price THEN 'paid'
        WHEN COALESCE(paid_amount, 0) > 0 THEN 'partial'
        ELSE 'pending'
      END,
      updated_at = NOW()
    WHERE course_id = NEW.id;
    
    -- Update fee records for students who have this as their primary course but no course_id set
    UPDATE fees 
    SET 
      amount = NEW.price,
      course_id = NEW.id, -- Also set the course_id
      status = CASE 
        WHEN COALESCE(paid_amount, 0) >= NEW.price THEN 'paid'
        WHEN COALESCE(paid_amount, 0) > 0 THEN 'partial'
        ELSE 'pending'
      END,
      updated_at = NOW()
    WHERE student_id IN (
      SELECT id FROM students WHERE course_id = NEW.id AND status = 'active'
    ) AND course_id IS NULL;
    
    -- Create fee records for students who don't have any fee records yet
    -- For primary course students
    INSERT INTO fees (
      student_id, 
      course_id, 
      amount, 
      paid_amount, 
      status, 
      due_date, 
      fee_type, 
      description,
      created_at
    )
    SELECT 
      s.id,
      NEW.id,
      NEW.price,
      0,
      'pending',
      CURRENT_DATE + INTERVAL '30 days',
      'tuition',
      'Course fee for ' || NEW.name,
      NOW()
    FROM students s
    WHERE s.course_id = NEW.id 
      AND s.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM fees f 
        WHERE f.student_id = s.id 
          AND (f.course_id = NEW.id OR (f.course_id IS NULL AND s.course_id = NEW.id))
      );
    
    -- For enrolled students via student_courses table (if it exists)
    INSERT INTO fees (
      student_id, 
      course_id, 
      amount, 
      paid_amount, 
      status, 
      due_date, 
      fee_type, 
      description,
      created_at
    )
    SELECT 
      sc.student_id,
      NEW.id,
      NEW.price,
      0,
      'pending',
      CURRENT_DATE + INTERVAL '30 days',
      'tuition',
      'Course fee for ' || NEW.name,
      NOW()
    FROM student_courses sc
    JOIN students s ON sc.student_id = s.id
    WHERE sc.course_id = NEW.id 
      AND s.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM fees f 
        WHERE f.student_id = sc.student_id 
          AND f.course_id = NEW.id
      );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create the trigger
DROP TRIGGER IF EXISTS course_price_update_trigger ON courses;
CREATE TRIGGER course_price_update_trigger
  AFTER UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_fees_on_course_update();

-- Step 7: Simple function to manually sync fees for a course
CREATE OR REPLACE FUNCTION manual_sync_course_fees(course_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  course_record RECORD;
  student_count INTEGER := 0;
BEGIN
  -- Get course details
  SELECT * INTO course_record FROM courses WHERE id = course_id_param;
  
  IF NOT FOUND THEN
    RETURN 'Course not found';
  END IF;
  
  -- Update existing fee records
  UPDATE fees 
  SET 
    amount = course_record.price,
    status = CASE 
      WHEN COALESCE(paid_amount, 0) >= course_record.price THEN 'paid'
      WHEN COALESCE(paid_amount, 0) > 0 THEN 'partial'
      ELSE 'pending'
    END,
    updated_at = NOW()
  WHERE course_id = course_id_param;
  
  -- Create missing fee records for primary course students
  INSERT INTO fees (
    student_id, course_id, amount, paid_amount, status, due_date, fee_type, description, created_at
  )
  SELECT 
    s.id, course_id_param, course_record.price, 0, 'pending',
    CURRENT_DATE + INTERVAL '30 days', 'tuition',
    'Course fee for ' || course_record.name, NOW()
  FROM students s
  WHERE s.course_id = course_id_param 
    AND s.status = 'active'
    AND NOT EXISTS (SELECT 1 FROM fees f WHERE f.student_id = s.id AND f.course_id = course_id_param);
  
  -- Create missing fee records for enrolled students (if student_courses table exists)
  INSERT INTO fees (
    student_id, course_id, amount, paid_amount, status, due_date, fee_type, description, created_at
  )
  SELECT 
    sc.student_id, course_id_param, course_record.price, 0, 'pending',
    CURRENT_DATE + INTERVAL '30 days', 'tuition',
    'Course fee for ' || course_record.name, NOW()
  FROM student_courses sc
  JOIN students s ON sc.student_id = s.id
  WHERE sc.course_id = course_id_param 
    AND s.status = 'active'
    AND NOT EXISTS (SELECT 1 FROM fees f WHERE f.student_id = sc.student_id AND f.course_id = course_id_param);
  
  -- Count affected students
  SELECT COUNT(DISTINCT s.id) INTO student_count
  FROM students s
  WHERE (s.course_id = course_id_param OR EXISTS (
    SELECT 1 FROM student_courses sc WHERE sc.student_id = s.id AND sc.course_id = course_id_param
  )) AND s.status = 'active';
  
  RETURN 'Successfully synced fees for ' || student_count || ' students in course: ' || course_record.name;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fees_course_id ON fees(course_id);
CREATE INDEX IF NOT EXISTS idx_fees_student_course ON fees(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_fees_paid_amount ON fees(paid_amount);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);

-- Step 9: Grant permissions
GRANT EXECUTE ON FUNCTION sync_student_fees_on_course_update() TO authenticated;
GRANT EXECUTE ON FUNCTION manual_sync_course_fees(UUID) TO authenticated;

-- Step 10: Verify the setup
SELECT 
  'Course fee sync system installed successfully. Fees table now has course_id column.' as status,
  COUNT(*) as total_fees,
  COUNT(course_id) as fees_with_course_id
FROM fees;

COMMIT;
