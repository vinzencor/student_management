-- Fix External Payment Logic and Data Synchronization Issues
-- This script fixes the core problems with external payments and fee management

-- 1. Ensure transactions table exists with correct structure
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category VARCHAR(100) NOT NULL,
  sub_category VARCHAR(100),
  related_id UUID, -- student_id or staff_id
  payment_mode VARCHAR(50) NOT NULL,
  description TEXT,
  image_url TEXT,
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'external_payment', 'fee_management'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure fees table has course_id column
ALTER TABLE fees ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_course_id ON fees(course_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type_date ON transactions(type, date);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(source);
CREATE INDEX IF NOT EXISTS idx_external_payments_status ON external_fee_payments(status);

-- 4. FIXED: Function to properly handle external payment verification
CREATE OR REPLACE FUNCTION handle_external_payment_verification(payment_id UUID)
RETURNS VOID AS $$
DECLARE
  payment_record external_fee_payments%ROWTYPE;
  student_record students%ROWTYPE;
  course_record courses%ROWTYPE;
  existing_fee_id UUID;
  total_course_fee DECIMAL(12,2);
BEGIN
  -- Get payment details
  SELECT * INTO payment_record FROM external_fee_payments WHERE id = payment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment record not found';
  END IF;
  
  -- Get or create student record
  IF payment_record.student_id IS NULL THEN
    -- Create student from payment data
    INSERT INTO students (
      first_name, last_name, email, grade_level, status, created_at
    ) VALUES (
      split_part(payment_record.student_name, ' ', 1),
      COALESCE(split_part(payment_record.student_name, ' ', 2), ''),
      payment_record.parent_email,
      payment_record.student_class,
      'active',
      NOW()
    ) RETURNING * INTO student_record;
    
    -- Update payment record with student_id
    UPDATE external_fee_payments 
    SET student_id = student_record.id 
    WHERE id = payment_id;
  ELSE
    SELECT * INTO student_record FROM students WHERE id = payment_record.student_id;
  END IF;
  
  -- Find course and get actual course fee
  total_course_fee := COALESCE(payment_record.course_fee, payment_record.payment_amount);
  
  IF payment_record.course_name IS NOT NULL THEN
    SELECT * INTO course_record FROM courses WHERE name = payment_record.course_name LIMIT 1;
    IF FOUND THEN
      total_course_fee := course_record.price; -- Use actual course price from database
    END IF;
  END IF;
  
  -- Check if fee record already exists for this student and course
  SELECT id INTO existing_fee_id 
  FROM fees 
  WHERE student_id = student_record.id 
    AND (course_id = course_record.id OR (course_id IS NULL AND course_record.id IS NULL))
  LIMIT 1;
  
  IF existing_fee_id IS NOT NULL THEN
    -- FIXED: Update existing fee record - ADD payment to existing paid amount, DON'T change total amount
    UPDATE fees 
    SET 
      paid_amount = COALESCE(paid_amount, 0) + payment_record.payment_amount,
      status = CASE 
        WHEN COALESCE(paid_amount, 0) + payment_record.payment_amount >= amount THEN 'paid'
        WHEN COALESCE(paid_amount, 0) + payment_record.payment_amount > 0 THEN 'partial'
        ELSE 'pending'
      END,
      paid_date = CASE 
        WHEN COALESCE(paid_amount, 0) + payment_record.payment_amount >= amount THEN payment_record.payment_date
        ELSE paid_date
      END,
      payment_date = payment_record.payment_date,
      payment_method = payment_record.payment_method,
      updated_at = NOW()
    WHERE id = existing_fee_id;
  ELSE
    -- FIXED: Create new fee record with CORRECT total amount (course fee) and payment amount separately
    INSERT INTO fees (
      student_id, course_id, amount, paid_amount, due_date, paid_date,
      status, payment_date, payment_method, fee_type, description, created_at
    ) VALUES (
      student_record.id,
      course_record.id,
      total_course_fee, -- CORRECT: Use full course fee as total amount
      payment_record.payment_amount, -- CORRECT: Payment amount as paid (partial payment)
      CURRENT_DATE + INTERVAL '30 days',
      CASE WHEN payment_record.payment_amount >= total_course_fee THEN payment_record.payment_date ELSE NULL END,
      CASE 
        WHEN payment_record.payment_amount >= total_course_fee THEN 'paid'
        WHEN payment_record.payment_amount > 0 THEN 'partial'
        ELSE 'pending'
      END,
      payment_record.payment_date,
      payment_record.payment_method,
      'tuition',
      'External payment verified - ' || COALESCE(payment_record.course_name, 'Course fee'),
      NOW()
    );
  END IF;
  
  -- Add to transactions table (for accounts section) with source tracking
  INSERT INTO transactions (
    type, date, amount, category, sub_category, related_id,
    payment_mode, description, image_url, source, created_at
  ) VALUES (
    'income',
    payment_record.payment_date,
    payment_record.payment_amount,
    'Student Fees',
    payment_record.student_name,
    student_record.id,
    payment_record.payment_method,
    'External payment verified - ' || payment_record.student_name || ' - ' || COALESCE(payment_record.course_name, 'Course fee'),
    payment_record.payment_proof_url,
    'external_payment',
    NOW()
  );
  
  -- Add to legacy income table (for backward compatibility)
  INSERT INTO income (
    date, type, sub_type, amount, payment_mode, remarks, image_url
  ) VALUES (
    payment_record.payment_date,
    'student_fees',
    payment_record.student_name,
    payment_record.payment_amount,
    payment_record.payment_method,
    'External payment verified - ' || COALESCE(payment_record.course_name, 'Course fee'),
    payment_record.payment_proof_url
  );
  
END;
$$ LANGUAGE plpgsql;

-- 5. Create view for fee management totals (excludes manual income entries)
CREATE OR REPLACE VIEW fee_management_totals AS
SELECT 
  COALESCE(SUM(CASE WHEN f.status = 'paid' THEN f.paid_amount ELSE 0 END), 0) as total_collected,
  COALESCE(SUM(CASE WHEN f.status IN ('pending', 'partial') THEN f.amount - COALESCE(f.paid_amount, 0) ELSE 0 END), 0) as total_pending,
  COALESCE(SUM(f.amount), 0) as total_expected
FROM fees f
JOIN students s ON f.student_id = s.id
WHERE s.status = 'active';

-- 6. Create view for accounts totals (includes all income sources)
CREATE OR REPLACE VIEW accounts_totals AS
SELECT 
  COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
  COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
  COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as net_balance
FROM transactions;

-- 7. Function to sync course fee changes
CREATE OR REPLACE FUNCTION sync_course_fee_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- When course price changes, update all related fee records
  IF OLD.price != NEW.price THEN
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for course fee sync
DROP TRIGGER IF EXISTS sync_course_fees_trigger ON courses;
CREATE TRIGGER sync_course_fees_trigger
  AFTER UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION sync_course_fee_changes();

-- 9. Function to manually sync course fees (for testing)
CREATE OR REPLACE FUNCTION manual_sync_course_fees(course_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  course_record courses%ROWTYPE;
  updated_count INTEGER := 0;
BEGIN
  -- Get course details
  SELECT * INTO course_record FROM courses WHERE id = course_uuid;
  
  IF NOT FOUND THEN
    RETURN 'Course not found';
  END IF;
  
  -- Update all fee records for this course
  UPDATE fees 
  SET 
    amount = course_record.price,
    status = CASE 
      WHEN COALESCE(paid_amount, 0) >= course_record.price THEN 'paid'
      WHEN COALESCE(paid_amount, 0) > 0 THEN 'partial'
      ELSE 'pending'
    END,
    updated_at = NOW()
  WHERE course_id = course_record.id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN 'Updated ' || updated_count || ' fee records for course: ' || course_record.name;
END;
$$ LANGUAGE plpgsql;
