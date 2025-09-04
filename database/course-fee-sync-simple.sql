-- Simple Course Fee Synchronization System
-- This is a simplified version that focuses on core functionality

-- 1. Create the main trigger function for course price updates
CREATE OR REPLACE FUNCTION sync_student_fees_on_course_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the price has actually changed
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    
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
    
    -- Update fee records for students who have this as their primary course
    UPDATE fees 
    SET 
      amount = NEW.price,
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
          AND (f.course_id = NEW.id OR f.course_id IS NULL)
      );
    
    -- For enrolled students via student_courses table
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

-- 2. Create the trigger
DROP TRIGGER IF EXISTS course_price_update_trigger ON courses;
CREATE TRIGGER course_price_update_trigger
  AFTER UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_fees_on_course_update();

-- 3. Simple function to manually sync fees for a course
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
  
  -- Create missing fee records for enrolled students
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

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fees_course_id ON fees(course_id);
CREATE INDEX IF NOT EXISTS idx_fees_student_course ON fees(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_course_id ON student_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION sync_student_fees_on_course_update() TO authenticated;
GRANT EXECUTE ON FUNCTION manual_sync_course_fees(UUID) TO authenticated;

-- 6. Test the setup (optional - you can run this to verify)
-- SELECT 'Course fee sync system installed successfully' as status;

COMMIT;
