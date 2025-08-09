-- Create fee_receipts table for storing printable receipt records
CREATE TABLE IF NOT EXISTS fee_receipts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID NOT NULL,
    fee_id UUID,
    student_name VARCHAR(255) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE fee_receipts 
ADD CONSTRAINT fk_fee_receipts_student 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE fee_receipts 
ADD CONSTRAINT fk_fee_receipts_fee 
FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fee_receipts_student_id ON fee_receipts(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_payment_date ON fee_receipts(payment_date);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_receipt_number ON fee_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_fee_receipts_created_at ON fee_receipts(created_at);

-- Enable Row Level Security
ALTER TABLE fee_receipts ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read all receipts
CREATE POLICY "Users can view all fee receipts" ON fee_receipts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to insert receipts
CREATE POLICY "Users can insert fee receipts" ON fee_receipts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy for authenticated users to update receipts
CREATE POLICY "Users can update fee receipts" ON fee_receipts
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to delete receipts
CREATE POLICY "Users can delete fee receipts" ON fee_receipts
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE fee_receipts IS 'Stores printable receipt records for fee payments';
COMMENT ON COLUMN fee_receipts.receipt_number IS 'Unique receipt number for identification';
COMMENT ON COLUMN fee_receipts.student_id IS 'Reference to the student who made the payment';
COMMENT ON COLUMN fee_receipts.fee_id IS 'Reference to the fee record (optional)';
COMMENT ON COLUMN fee_receipts.student_name IS 'Student name at the time of payment (for historical records)';
COMMENT ON COLUMN fee_receipts.course_name IS 'Course name at the time of payment (for historical records)';
COMMENT ON COLUMN fee_receipts.amount_paid IS 'Amount paid in this transaction';
COMMENT ON COLUMN fee_receipts.payment_date IS 'Date when the payment was made';
COMMENT ON COLUMN fee_receipts.payment_method IS 'Method of payment (Cash, Bank Transfer, etc.)';
COMMENT ON COLUMN fee_receipts.description IS 'Additional description or notes about the payment';
