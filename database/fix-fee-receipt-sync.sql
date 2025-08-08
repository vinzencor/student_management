-- Fix fee and receipt synchronization

-- Create function to sync receipt payments with fee records
CREATE OR REPLACE FUNCTION sync_receipt_payments_to_fees()
RETURNS void AS $$
DECLARE
    student_record RECORD;
    total_paid NUMERIC;
    course_fee NUMERIC;
    fee_status TEXT;
BEGIN
    -- Loop through all students with receipts
    FOR student_record IN 
        SELECT DISTINCT s.id, s.first_name, s.last_name, c.name as course_name, c.price as course_price
        FROM students s
        JOIN courses c ON s.course_id = c.id
        WHERE s.status = 'active' AND c.price > 0
    LOOP
        -- Calculate total paid from receipts for this student
        SELECT COALESCE(SUM(r.amount), 0) INTO total_paid
        FROM receipts r
        WHERE r.student_id = student_record.id 
        AND r.status = 'ready';
        
        course_fee := student_record.course_price;
        
        -- Determine status
        IF total_paid >= course_fee THEN
            fee_status := 'paid';
        ELSIF total_paid > 0 THEN
            fee_status := 'partial';
        ELSE
            fee_status := 'pending';
        END IF;
        
        -- Insert or update fee record
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
        ) VALUES (
            student_record.id,
            course_fee,
            total_paid,
            CURRENT_DATE,
            CASE WHEN fee_status = 'paid' THEN CURRENT_DATE ELSE NULL END,
            fee_status,
            'tuition',
            'Course fee for ' || student_record.course_name,
            'Synced from receipts - Total paid: ₹' || total_paid::text
        )
        ON CONFLICT (student_id, fee_type, description) 
        DO UPDATE SET
            amount = EXCLUDED.amount,
            paid_amount = EXCLUDED.paid_amount,
            status = EXCLUDED.status,
            paid_date = EXCLUDED.paid_date,
            notes = EXCLUDED.notes,
            updated_at = NOW();
    END LOOP;
    
    RAISE NOTICE 'Fee synchronization completed';
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-sync when receipts are updated
CREATE OR REPLACE FUNCTION trigger_sync_receipt_to_fee()
RETURNS TRIGGER AS $$
DECLARE
    total_paid NUMERIC;
    course_fee NUMERIC;
    fee_status TEXT;
BEGIN
    -- Only process if student_id is set and status is 'ready'
    IF NEW.student_id IS NOT NULL THEN
        -- Get course fee for this student
        SELECT c.price INTO course_fee
        FROM students s
        JOIN courses c ON s.course_id = c.id
        WHERE s.id = NEW.student_id;
        
        IF course_fee IS NOT NULL THEN
            -- Calculate total paid from all receipts for this student
            SELECT COALESCE(SUM(r.amount), 0) INTO total_paid
            FROM receipts r
            WHERE r.student_id = NEW.student_id 
            AND r.status = 'ready';
            
            -- Determine status
            IF total_paid >= course_fee THEN
                fee_status := 'paid';
            ELSIF total_paid > 0 THEN
                fee_status := 'partial';
            ELSE
                fee_status := 'pending';
            END IF;
            
            -- Get course name for description
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
                c.price,
                total_paid,
                CURRENT_DATE,
                CASE WHEN fee_status = 'paid' THEN CURRENT_DATE ELSE NULL END,
                fee_status,
                'tuition',
                'Course fee for ' || c.name,
                'Auto-synced from receipts - Last payment: ₹' || NEW.amount::text
            FROM students s
            JOIN courses c ON s.course_id = c.id
            WHERE s.id = NEW.student_id
            ON CONFLICT (student_id, fee_type, description) 
            DO UPDATE SET
                amount = EXCLUDED.amount,
                paid_amount = EXCLUDED.paid_amount,
                status = EXCLUDED.status,
                paid_date = EXCLUDED.paid_date,
                notes = EXCLUDED.notes,
                updated_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_receipt_fee_sync ON receipts;

-- Create trigger on receipts table
CREATE TRIGGER trigger_receipt_fee_sync
    AFTER INSERT OR UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_receipt_to_fee();

-- Add unique constraint to prevent duplicate fee records
DO $$
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE fees DROP CONSTRAINT IF EXISTS unique_student_fee_type_desc;
    
    -- Add new constraint
    ALTER TABLE fees ADD CONSTRAINT unique_student_fee_type_desc 
    UNIQUE (student_id, fee_type, description);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Run the sync function to fix existing data
SELECT sync_receipt_payments_to_fees();

-- Create a view for easy fee management queries
CREATE OR REPLACE VIEW fee_management_view AS
SELECT 
    f.id,
    f.student_id,
    f.amount as total_amount,
    f.paid_amount,
    (f.amount - COALESCE(f.paid_amount, 0)) as remaining_amount,
    f.status,
    f.fee_type,
    f.description,
    f.due_date,
    f.paid_date,
    f.notes,
    s.first_name,
    s.last_name,
    s.email as student_email,
    s.phone as student_phone,
    s.grade_level,
    c.name as course_name,
    c.price as course_price,
    c.description as course_description,
    p.first_name as parent_first_name,
    p.last_name as parent_last_name,
    p.phone as parent_phone
FROM fees f
JOIN students s ON f.student_id = s.id
LEFT JOIN courses c ON s.course_id = c.id
LEFT JOIN parents p ON s.parent_id = p.id
WHERE s.status = 'active'
ORDER BY f.created_at DESC;

-- Grant permissions
GRANT SELECT ON fee_management_view TO authenticated;
GRANT EXECUTE ON FUNCTION sync_receipt_payments_to_fees() TO authenticated;
