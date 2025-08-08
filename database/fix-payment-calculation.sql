-- Fix payment calculation issues - clean up duplicates and fix sync

-- 1. First, let's clean up any duplicate fee records
DELETE FROM fees f1
WHERE f1.ctid NOT IN (
    SELECT DISTINCT ON (f2.student_id, f2.fee_type, COALESCE(f2.description, '')) f2.ctid
    FROM fees f2
    ORDER BY f2.student_id, f2.fee_type, COALESCE(f2.description, ''), f2.created_at
);

-- 2. Drop the existing trigger to prevent it from firing during cleanup
DROP TRIGGER IF EXISTS trigger_receipt_fee_sync ON receipts;

-- 2.5. Create unique constraint for ON CONFLICT to work
DO $$
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE fees DROP CONSTRAINT IF EXISTS unique_student_fee_type_desc;

    -- Add new constraint
    ALTER TABLE fees ADD CONSTRAINT unique_student_fee_type_desc
    UNIQUE (student_id, fee_type, description);
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN
        -- If constraint creation fails due to existing duplicates, clean them first
        DELETE FROM fees f1
        WHERE f1.ctid NOT IN (
            SELECT DISTINCT ON (f2.student_id, f2.fee_type, COALESCE(f2.description, '')) f2.ctid
            FROM fees f2
            ORDER BY f2.student_id, f2.fee_type, COALESCE(f2.description, ''), f2.created_at
        );
        -- Try again
        ALTER TABLE fees ADD CONSTRAINT unique_student_fee_type_desc
        UNIQUE (student_id, fee_type, description);
END $$;

-- 3. Create a clean sync function that calculates correctly
CREATE OR REPLACE FUNCTION clean_sync_receipt_payments()
RETURNS void AS $$
DECLARE
    student_record RECORD;
    total_paid NUMERIC;
    course_fee NUMERIC;
    fee_status TEXT;
BEGIN
    -- Delete all auto-generated fee records first
    DELETE FROM fees WHERE notes LIKE '%Auto-synced%' OR notes LIKE '%Synced from receipts%';
    
    -- Loop through all students who have receipts
    FOR student_record IN 
        SELECT DISTINCT 
            s.id, 
            s.first_name, 
            s.last_name, 
            c.name as course_name, 
            c.price as course_price
        FROM students s
        JOIN courses c ON s.course_id = c.id
        JOIN receipts r ON r.student_id = s.id
        WHERE s.status = 'active' 
        AND c.price > 0
        AND r.status = 'ready'
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
        
        -- Insert or update fee record (only one per student per course)
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
        )
        ON CONFLICT (student_id, fee_type, description) 
        DO UPDATE SET
            amount = EXCLUDED.amount,
            paid_amount = EXCLUDED.paid_amount,
            status = EXCLUDED.status,
            paid_date = EXCLUDED.paid_date,
            notes = EXCLUDED.notes,
            updated_at = NOW();
            
        RAISE NOTICE 'Student: % % - Course Fee: ₹%, Paid: ₹%, Status: %', 
            student_record.first_name, student_record.last_name, course_fee, total_paid, fee_status;
    END LOOP;
    
    RAISE NOTICE 'Clean sync completed successfully';
END;
$$ LANGUAGE plpgsql;

-- 4. Create a simple trigger that only updates when receipts change
CREATE OR REPLACE FUNCTION simple_receipt_sync()
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
            
            -- Update or insert fee record
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
                'Updated from receipt #' || NEW.id || ': ₹' || total_paid::text || ' of ₹' || course_fee::text
            )
            ON CONFLICT (student_id, fee_type, description) 
            DO UPDATE SET
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

-- 5. Create the new trigger
CREATE TRIGGER trigger_simple_receipt_sync
    AFTER INSERT OR UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION simple_receipt_sync();

-- 6. Run the clean sync to fix existing data
SELECT clean_sync_receipt_payments();

-- 7. Create a function to manually recalculate for a specific student (for debugging)
CREATE OR REPLACE FUNCTION recalculate_student_fees(student_uuid UUID)
RETURNS TABLE(
    student_name TEXT,
    course_name TEXT,
    course_fee NUMERIC,
    total_receipts NUMERIC,
    calculated_status TEXT
) AS $$
DECLARE
    student_info RECORD;
    total_paid NUMERIC;
BEGIN
    -- Get student and course info
    SELECT s.first_name || ' ' || s.last_name as name, c.name as course, c.price
    INTO student_info
    FROM students s
    JOIN courses c ON s.course_id = c.id
    WHERE s.id = student_uuid;
    
    -- Calculate total from receipts
    SELECT COALESCE(SUM(r.amount), 0) INTO total_paid
    FROM receipts r
    WHERE r.student_id = student_uuid AND r.status = 'ready';
    
    -- Return the calculation
    RETURN QUERY SELECT 
        student_info.name,
        student_info.course,
        student_info.price,
        total_paid,
        CASE 
            WHEN total_paid >= student_info.price THEN 'paid'
            WHEN total_paid > 0 THEN 'partial'
            ELSE 'pending'
        END;
END;
$$ LANGUAGE plpgsql;

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION clean_sync_receipt_payments() TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_student_fees(UUID) TO authenticated;
