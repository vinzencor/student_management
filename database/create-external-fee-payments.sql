-- Create external fee payments system for parent portal

-- Create external_fee_payments table
CREATE TABLE IF NOT EXISTS external_fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  student_name VARCHAR(200) NOT NULL,
  student_class VARCHAR(50) NOT NULL,
  course_name VARCHAR(200),
  course_fee DECIMAL(10,2),
  parent_name VARCHAR(200),
  parent_email VARCHAR(255),
  parent_phone VARCHAR(20),
  payment_amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'upi', 'cash', 'cheque', 'card')),
  transaction_id VARCHAR(100),
  payment_proof_url TEXT,
  remarks TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES staff(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_external_fee_payments_student_id ON external_fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_external_fee_payments_status ON external_fee_payments(status);
CREATE INDEX IF NOT EXISTS idx_external_fee_payments_payment_date ON external_fee_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_external_fee_payments_created_at ON external_fee_payments(created_at);

-- Create storage bucket for payment proofs (run this in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true);

-- Create RLS policies for storage (run this in Supabase dashboard)
-- CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');
-- CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_external_fee_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_external_fee_payments_updated_at
    BEFORE UPDATE ON external_fee_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_external_fee_payments_updated_at();

-- Create view for fee payment management
CREATE OR REPLACE VIEW external_fee_payments_view AS
SELECT 
    efp.*,
    s.first_name as student_first_name,
    s.last_name as student_last_name,
    s.grade_level,
    c.name as current_course_name,
    c.price as current_course_price,
    p.first_name as parent_first_name,
    p.last_name as parent_last_name,
    staff.first_name as verified_by_first_name,
    staff.last_name as verified_by_last_name
FROM external_fee_payments efp
LEFT JOIN students s ON efp.student_id = s.id
LEFT JOIN courses c ON s.course_id = c.id
LEFT JOIN parents p ON s.parent_id = p.id
LEFT JOIN staff ON efp.verified_by = staff.id
ORDER BY efp.created_at DESC;

-- Add comments for documentation
COMMENT ON TABLE external_fee_payments IS 'External fee payments submitted by parents through the public portal';
COMMENT ON COLUMN external_fee_payments.status IS 'Payment verification status: pending, verified, rejected';
COMMENT ON COLUMN external_fee_payments.payment_method IS 'Method used for payment: bank_transfer, upi, cash, cheque, card';
COMMENT ON COLUMN external_fee_payments.payment_proof_url IS 'URL to uploaded payment proof image';
COMMENT ON COLUMN external_fee_payments.verified_by IS 'Staff member who verified the payment';
COMMENT ON COLUMN external_fee_payments.verified_at IS 'Timestamp when payment was verified';
