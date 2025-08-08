-- Create comprehensive fee tracking system that includes receipt data

-- Function to sync receipt payments to fees table
CREATE OR REPLACE FUNCTION sync_receipt_to_fees()
RETURNS TRIGGER AS $$
BEGIN
  -- When a receipt is created/updated with student_id, ensure there's a corresponding fee record
  IF NEW.student_id IS NOT NULL AND NEW.course_id IS NOT NULL THEN
    -- Check if fee record exists for this student and course
    IF NOT EXISTS (
      SELECT 1 FROM fees 
      WHERE student_id = NEW.student_id 
      AND fee_type = 'tuition'
      AND description LIKE '%' || (SELECT name FROM courses WHERE id = NEW.course_id) || '%'
    ) THEN
      -- Create fee record from receipt
      INSERT INTO fees (
        student_id,
        amount,
        paid_amount,
        due_date,
        paid_date,
        status,
        fee_type,
        description,
        notes
      )
      SELECT 
        NEW.student_id,
        COALESCE(c.price, NEW.amount),
        CASE WHEN NEW.status = 'ready' THEN NEW.amount ELSE 0 END,
        CURRENT_DATE,
        CASE WHEN NEW.status = 'ready' THEN CURRENT_DATE ELSE NULL END,
        CASE 
          WHEN NEW.status = 'ready' AND NEW.amount >= COALESCE(c.price, NEW.amount) THEN 'paid'
          WHEN NEW.status = 'ready' AND NEW.amount < COALESCE(c.price, NEW.amount) THEN 'partial'
          ELSE 'pending'
        END,
        'tuition',
        'Course fee for ' || COALESCE(c.name, 'Unknown Course') || ' (from receipt)',
        'Auto-created from receipt #' || NEW.id
      FROM courses c
      WHERE c.id = NEW.course_id;
    ELSE
      -- Update existing fee record with receipt payment
      UPDATE fees 
      SET 
        paid_amount = COALESCE(paid_amount, 0) + CASE WHEN NEW.status = 'ready' THEN NEW.amount ELSE 0 END,
        status = CASE 
          WHEN COALESCE(paid_amount, 0) + CASE WHEN NEW.status = 'ready' THEN NEW.amount ELSE 0 END >= amount THEN 'paid'
          WHEN COALESCE(paid_amount, 0) + CASE WHEN NEW.status = 'ready' THEN NEW.amount ELSE 0 END > 0 THEN 'partial'
          ELSE 'pending'
        END,
        paid_date = CASE WHEN NEW.status = 'ready' THEN CURRENT_DATE ELSE paid_date END,
        updated_at = NOW()
      WHERE student_id = NEW.student_id 
      AND fee_type = 'tuition'
      AND description LIKE '%' || (SELECT name FROM courses WHERE id = NEW.course_id) || '%';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for receipt to fee sync
DROP TRIGGER IF EXISTS trigger_sync_receipt_to_fees ON receipts;
CREATE TRIGGER trigger_sync_receipt_to_fees
  AFTER INSERT OR UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION sync_receipt_to_fees();

-- Create view for comprehensive fee data
CREATE OR REPLACE VIEW comprehensive_fees AS
SELECT 
  f.id,
  f.student_id,
  f.amount,
  f.paid_amount,
  f.remaining_amount,
  f.due_date,
  f.paid_date,
  f.status,
  f.fee_type,
  f.description,
  f.notes,
  f.created_at,
  f.updated_at,
  'direct' as source,
  s.first_name as student_first_name,
  s.last_name as student_last_name,
  s.grade_level,
  s.phone as student_phone,
  s.course_id,
  c.name as course_name,
  c.price as course_price,
  p.first_name as parent_first_name,
  p.last_name as parent_last_name,
  p.phone as parent_phone
FROM fees f
LEFT JOIN students s ON f.student_id = s.id
LEFT JOIN courses c ON s.course_id = c.id
LEFT JOIN parents p ON s.parent_id = p.id

UNION ALL

-- Include receipt-based fees that don't have direct fee records
SELECT 
  'receipt_' || r.id as id,
  r.student_id,
  COALESCE(c.price, r.amount) as amount,
  CASE WHEN r.status = 'ready' THEN r.amount ELSE 0 END as paid_amount,
  COALESCE(c.price, r.amount) - CASE WHEN r.status = 'ready' THEN r.amount ELSE 0 END as remaining_amount,
  r.created_at::date as due_date,
  CASE WHEN r.status = 'ready' THEN r.created_at::date ELSE NULL END as paid_date,
  CASE 
    WHEN r.status = 'ready' AND r.amount >= COALESCE(c.price, r.amount) THEN 'paid'
    WHEN r.status = 'ready' AND r.amount < COALESCE(c.price, r.amount) THEN 'partial'
    ELSE 'pending'
  END as status,
  'tuition' as fee_type,
  'Course fee for ' || COALESCE(c.name, 'Unknown Course') || ' (from receipt)' as description,
  'Receipt #' || r.id as notes,
  r.created_at,
  r.updated_at,
  'receipt' as source,
  s.first_name as student_first_name,
  s.last_name as student_last_name,
  s.grade_level,
  s.phone as student_phone,
  s.course_id,
  c.name as course_name,
  c.price as course_price,
  p.first_name as parent_first_name,
  p.last_name as parent_last_name,
  p.phone as parent_phone
FROM receipts r
LEFT JOIN students s ON r.student_id = s.id
LEFT JOIN courses c ON r.course_id = c.id
LEFT JOIN parents p ON s.parent_id = p.id
WHERE r.student_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM fees f 
  WHERE f.student_id = r.student_id 
  AND f.fee_type = 'tuition'
  AND f.description LIKE '%' || COALESCE(c.name, 'Unknown Course') || '%'
);

-- Grant permissions
GRANT SELECT ON comprehensive_fees TO authenticated;

-- Sync existing receipts to create fee records
INSERT INTO fees (
  student_id,
  amount,
  paid_amount,
  due_date,
  paid_date,
  status,
  fee_type,
  description,
  notes
)
SELECT DISTINCT
  r.student_id,
  COALESCE(c.price, r.amount),
  CASE WHEN r.status = 'ready' THEN r.amount ELSE 0 END,
  r.created_at::date,
  CASE WHEN r.status = 'ready' THEN r.created_at::date ELSE NULL END,
  CASE 
    WHEN r.status = 'ready' AND r.amount >= COALESCE(c.price, r.amount) THEN 'paid'
    WHEN r.status = 'ready' AND r.amount < COALESCE(c.price, r.amount) THEN 'partial'
    ELSE 'pending'
  END,
  'tuition',
  'Course fee for ' || COALESCE(c.name, 'Unknown Course') || ' (from receipt)',
  'Auto-created from receipt #' || r.id
FROM receipts r
LEFT JOIN students s ON r.student_id = s.id
LEFT JOIN courses c ON r.course_id = c.id
WHERE r.student_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM fees f 
  WHERE f.student_id = r.student_id 
  AND f.fee_type = 'tuition'
  AND (f.description LIKE '%' || COALESCE(c.name, 'Unknown Course') || '%' OR f.description LIKE '%receipt%')
)
ON CONFLICT DO NOTHING;
