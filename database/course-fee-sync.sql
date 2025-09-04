-- Course Fee Synchronization System
-- This script creates database functions and triggers to keep student fees in sync with course prices

-- 1. Function to update student fees when course price changes
CREATE OR REPLACE FUNCTION sync_student_fees_on_course_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the price has actually changed
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    
    -- Log the change
    RAISE NOTICE 'Course % price changed from % to %', NEW.name, OLD.price, NEW.price;
    
    -- Update fee records for students enrolled in this course via student_courses table
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
    -- (for students table course_id reference)
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
    ) AND course_id IS NULL; -- Only update fees without specific course_id
    
    -- Create fee records for students who don't have any fee records yet
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
    
    -- Also create fee records for students enrolled via student_courses
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

-- 2. Create trigger to automatically sync fees when course price changes
DROP TRIGGER IF EXISTS course_price_update_trigger ON courses;
CREATE TRIGGER course_price_update_trigger
  AFTER UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_fees_on_course_update();

-- 3. Function to get course fee impact report (useful for debugging)
CREATE OR REPLACE FUNCTION get_course_fee_impact(course_id_param UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  current_fee_amount DECIMAL,
  current_paid_amount DECIMAL,
  current_status TEXT,
  course_price DECIMAL,
  enrollment_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as student_id,
    (s.first_name || ' ' || s.last_name) as student_name,
    COALESCE(f.amount, 0) as current_fee_amount,
    COALESCE(f.paid_amount, 0) as current_paid_amount,
    COALESCE(f.status, 'no_fee_record') as current_status,
    c.price as course_price,
    CASE 
      WHEN s.course_id = course_id_param THEN 'primary_course'
      ELSE 'enrolled_course'
    END as enrollment_type
  FROM students s
  LEFT JOIN fees f ON s.id = f.student_id AND (f.course_id = course_id_param OR (f.course_id IS NULL AND s.course_id = course_id_param))
  JOIN courses c ON c.id = course_id_param
  WHERE s.status = 'active'
    AND (
      s.course_id = course_id_param 
      OR EXISTS (
        SELECT 1 FROM student_courses sc 
        WHERE sc.student_id = s.id AND sc.course_id = course_id_param
      )
    )
  ORDER BY s.first_name, s.last_name;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to manually sync all fees for a course (useful for one-time fixes)
CREATE OR REPLACE FUNCTION manual_sync_course_fees(course_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  course_record RECORD;
  affected_rows INTEGER := 0;
  temp_count INTEGER;
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

  GET DIAGNOSTICS temp_count = ROW_COUNT;
  affected_rows := affected_rows + temp_count;

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

  GET DIAGNOSTICS temp_count = ROW_COUNT;
  affected_rows := affected_rows + temp_count;

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

  GET DIAGNOSTICS temp_count = ROW_COUNT;
  affected_rows := affected_rows + temp_count;

  RETURN 'Successfully synced ' || affected_rows || ' fee records for course: ' || course_record.name;
END;
$$ LANGUAGE plpgsql;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION sync_student_fees_on_course_update() TO authenticated;
GRANT EXECUTE ON FUNCTION get_course_fee_impact(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION manual_sync_course_fees(UUID) TO authenticated;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fees_course_id ON fees(course_id);
CREATE INDEX IF NOT EXISTS idx_fees_student_course ON fees(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_course_id ON student_courses(course_id);

COMMIT;
