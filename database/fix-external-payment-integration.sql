-- Fix External Payment Integration Issues
-- This script ensures all tables have the correct structure and relationships

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure fees table has all required columns
ALTER TABLE fees 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20),
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS fee_type VARCHAR(50) DEFAULT 'tuition',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);

-- 3. Ensure income table exists (legacy support)
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL,
  sub_type VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  payment_mode VARCHAR(50) NOT NULL,
  remarks TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Update external_fee_payments table to ensure all columns exist
ALTER TABLE external_fee_payments 
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES staff(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_type_date ON transactions(type, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);
CREATE INDEX IF NOT EXISTS idx_external_payments_status ON external_fee_payments(status);
CREATE INDEX IF NOT EXISTS idx_external_payments_student_id ON external_fee_payments(student_id);

-- 6. Create a view for comprehensive fee information
CREATE OR REPLACE VIEW student_fee_summary AS
SELECT 
  s.id as student_id,
  s.first_name,
  s.last_name,
  s.email,
  s.grade_level,
  COALESCE(SUM(f.amount), 0) as total_fees,
  COALESCE(SUM(f.paid_amount), 0) as total_paid,
  COALESCE(SUM(f.amount - COALESCE(f.paid_amount, 0)), 0) as remaining_amount,
  COUNT(f.id) as fee_records_count,
  MAX(f.payment_date) as last_payment_date,
  CASE 
    WHEN COALESCE(SUM(f.amount - COALESCE(f.paid_amount, 0)), 0) = 0 AND COUNT(f.id) > 0 THEN 'paid'
    WHEN COALESCE(SUM(f.paid_amount), 0) > 0 AND COALESCE(SUM(f.amount - COALESCE(f.paid_amount, 0)), 0) > 0 THEN 'partial'
    WHEN COUNT(f.id) > 0 THEN 'pending'
    ELSE 'no_fees'
  END as fee_status
FROM students s
LEFT JOIN fees f ON s.id = f.student_id
WHERE s.status = 'active'
GROUP BY s.id, s.first_name, s.last_name, s.email, s.grade_level;

-- 7. Create function to sync external payment data
CREATE OR REPLACE FUNCTION sync_external_payment_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'verified'
  IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
    
    -- Insert into transactions table for accounts section
    INSERT INTO transactions (
      type, date, amount, category, sub_category, related_id, 
      payment_mode, description, image_url
    ) VALUES (
      'income',
      NEW.payment_date,
      NEW.payment_amount,
      'Student Fees',
      NEW.student_name,
      NEW.student_id,
      NEW.payment_method,
      'External payment verified - ' || COALESCE(NEW.course_name, 'Course fee'),
      NEW.payment_proof_url
    );
    
    -- Insert into income table (legacy support)
    INSERT INTO income (
      date, type, sub_type, amount, payment_mode, remarks, image_url
    ) VALUES (
      NEW.payment_date,
      'student_fees',
      NEW.student_name,
      NEW.payment_amount,
      NEW.payment_method,
      'External payment verified - ' || COALESCE(NEW.course_name, 'Course fee'),
      NEW.payment_proof_url
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for automatic sync
DROP TRIGGER IF EXISTS sync_external_payment_trigger ON external_fee_payments;
CREATE TRIGGER sync_external_payment_trigger
  AFTER UPDATE ON external_fee_payments
  FOR EACH ROW
  EXECUTE FUNCTION sync_external_payment_verification();

-- 9. Grant necessary permissions
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON income TO authenticated;
GRANT ALL ON fees TO authenticated;
GRANT ALL ON external_fee_payments TO authenticated;
GRANT SELECT ON student_fee_summary TO authenticated;

-- 10. Update any existing external payments that were verified but missing transaction records
INSERT INTO transactions (type, date, amount, category, sub_category, related_id, payment_mode, description, image_url)
SELECT 
  'income',
  efp.payment_date,
  efp.payment_amount,
  'Student Fees',
  efp.student_name,
  efp.student_id,
  efp.payment_method,
  'External payment verified - ' || COALESCE(efp.course_name, 'Course fee'),
  efp.payment_proof_url
FROM external_fee_payments efp
WHERE efp.status = 'verified'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.related_id = efp.student_id 
      AND t.amount = efp.payment_amount 
      AND t.date = efp.payment_date
      AND t.description LIKE '%External payment verified%'
  );

-- 11. Update any existing external payments that were verified but missing income records
INSERT INTO income (date, type, sub_type, amount, payment_mode, remarks, image_url)
SELECT 
  efp.payment_date,
  'student_fees',
  efp.student_name,
  efp.payment_amount,
  efp.payment_method,
  'External payment verified - ' || COALESCE(efp.course_name, 'Course fee'),
  efp.payment_proof_url
FROM external_fee_payments efp
WHERE efp.status = 'verified'
  AND NOT EXISTS (
    SELECT 1 FROM income i 
    WHERE i.sub_type = efp.student_name 
      AND i.amount = efp.payment_amount 
      AND i.date = efp.payment_date
      AND i.remarks LIKE '%External payment verified%'
  );

COMMIT;
