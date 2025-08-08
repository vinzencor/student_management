-- Simple fix for payment calculation issues without ON CONFLICT

-- 1. Drop the existing trigger to prevent it from firing during cleanup
DROP TRIGGER IF EXISTS trigger_receipt_fee_sync ON receipts;
DROP TRIGGER IF EXISTS trigger_sync_receipt_to_fees ON receipts;

-- 2. Clean up all existing fee records to start fresh
DELETE FROM fees;

-- 3. Create a simple sync function that calculates correctly
CREATE OR REPLACE FUNCTION simple_sync_receipt_payments()
RETURNS void AS $$
DECLARE
    student_record RECORD;
    total_paid NUMERIC;
    course_fee NUMERIC;
    fee_status TEXT;
BEGIN
    -- Loop through all students who have courses
    FOR student_record IN 
        SELECT DISTINCT 
            s.id, 
            s.first_name, 
            s.last_name, 
            c.name as course_name, 
            c.price as course_price
        FROM students s
        JOIN courses c ON s.course_id = c.id
        WHERE s.status = 'active' 
        AND c.price > 0
    LOOP
        -- Calculate total paid from receipts for this student (only ready receipts)
        SELECT COALESCE(SUM(r.amount), 0) INTO total_paid
        FROM receipts r
        WHERE r.student_id = student_record.id 
        AND r.status = 'ready';
        
        course_fee := student_record.course_price;
        
        -- Determine status based on actual payments
        IF total_paid >= course_fee THEN
            fee_status := 'paid';
        ELSIF total_paid > 0 THEN
            fee_status := 'partial';
        ELSE
            fee_status := 'pending';
        END IF;
        
        -- Insert fee record (table is clean, so no conflicts)
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
            'Calculated from receipts: ₹' || total_paid::text || ' of ₹' || course_fee::text
        );
            
        RAISE NOTICE 'Student: % % - Course Fee: ₹%, Paid: ₹%, Status: %', 
            student_record.first_name, student_record.last_name, course_fee, total_paid, fee_status;
    END LOOP;
    
    RAISE NOTICE 'Simple sync completed successfully';
END;
$$ LANGUAGE plpgsql;

-- 4. Create a simple trigger that recalculates when receipts change
CREATE OR REPLACE FUNCTION update_fee_on_receipt_change()
RETURNS TRIGGER AS $$
DECLARE
    total_paid NUMERIC;
    course_fee NUMERIC;
    fee_status TEXT;
    course_name TEXT;
BEGIN
    -- Only process if student_id is set
    IF NEW.student_id IS NOT NULL THEN
        -- Get course info for this student
        SELECT c.price, c.name INTO course_fee, course_name
        FROM students s
        JOIN courses c ON s.course_id = c.id
        WHERE s.id = NEW.student_id;
        
        IF course_fee IS NOT NULL THEN
            -- Calculate total paid from all ready receipts for this student
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
            
            -- Update existing fee record or insert if not exists
            IF EXISTS (SELECT 1 FROM fees WHERE student_id = NEW.student_id AND fee_type = 'tuition') THEN
                UPDATE fees SET
                    amount = course_fee,
                    paid_amount = total_paid,
                    status = fee_status,
                    paid_date = CASE WHEN fee_status = 'paid' THEN CURRENT_DATE ELSE NULL END,
                    notes = 'Updated from receipt #' || NEW.id || ': ₹' || total_paid::text || ' of ₹' || course_fee::text,
                    updated_at = NOW()
                WHERE student_id = NEW.student_id AND fee_type = 'tuition';
            ELSE
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
                    NEW.student_id,
                    course_fee,
                    total_paid,
                    CURRENT_DATE,
                    CASE WHEN fee_status = 'paid' THEN CURRENT_DATE ELSE NULL END,
                    fee_status,
                    'tuition',
                    'Course fee for ' || course_name,
                    'Created from receipt #' || NEW.id || ': ₹' || total_paid::text || ' of ₹' || course_fee::text
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create the new trigger
CREATE TRIGGER trigger_update_fee_on_receipt_change
    AFTER INSERT OR UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_fee_on_receipt_change();

-- 6. Run the simple sync to create clean fee records
SELECT simple_sync_receipt_payments();

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION simple_sync_receipt_payments() TO authenticated;
