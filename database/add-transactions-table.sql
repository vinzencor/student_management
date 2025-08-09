-- Add transactions table for accounts management
-- Run this in your Supabase SQL Editor

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category VARCHAR(100) NOT NULL,
  payment_mode VARCHAR(50) NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to view all transactions
CREATE POLICY "Allow authenticated users to view transactions" ON transactions
  FOR SELECT TO authenticated USING (true);

-- Policy to allow authenticated users to insert transactions
CREATE POLICY "Allow authenticated users to insert transactions" ON transactions
  FOR INSERT TO authenticated WITH CHECK (true);

-- Policy to allow authenticated users to update transactions
CREATE POLICY "Allow authenticated users to update transactions" ON transactions
  FOR UPDATE TO authenticated USING (true);

-- Policy to allow authenticated users to delete transactions
CREATE POLICY "Allow authenticated users to delete transactions" ON transactions
  FOR DELETE TO authenticated USING (true);

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO authenticated;

-- Insert some sample data for testing
INSERT INTO transactions (type, date, amount, category, payment_mode, description) VALUES
('income', CURRENT_DATE, 25000.00, 'Student Fees', 'Bank Transfer', 'Monthly fee collection from students'),
('income', CURRENT_DATE - INTERVAL '1 day', 15000.00, 'Course Sales', 'UPI', 'New course enrollment fees'),
('expense', CURRENT_DATE - INTERVAL '2 days', 8000.00, 'Salaries', 'Bank Transfer', 'Teacher salary payment'),
('expense', CURRENT_DATE - INTERVAL '3 days', 2500.00, 'Office Supplies', 'Cash', 'Stationery and office materials'),
('income', CURRENT_DATE - INTERVAL '4 days', 12000.00, 'Student Fees', 'Credit Card', 'Fee payment from new students'),
('expense', CURRENT_DATE - INTERVAL '5 days', 1800.00, 'Utilities', 'Bank Transfer', 'Electricity and internet bills'),
('expense', CURRENT_DATE - INTERVAL '6 days', 3500.00, 'Marketing', 'UPI', 'Social media advertising'),
('income', CURRENT_DATE - INTERVAL '7 days', 18000.00, 'Student Fees', 'Cash', 'Weekly fee collection');

-- Create a view for transaction summaries
CREATE OR REPLACE VIEW transaction_summary AS
SELECT 
  type,
  category,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as average_amount,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM transactions
GROUP BY type, category
ORDER BY type, total_amount DESC;

-- Create a view for monthly summaries
CREATE OR REPLACE VIEW monthly_transaction_summary AS
SELECT 
  DATE_TRUNC('month', date) as month,
  type,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount
FROM transactions
GROUP BY DATE_TRUNC('month', date), type
ORDER BY month DESC, type;

-- Create a function to get account balance
CREATE OR REPLACE FUNCTION get_account_balance()
RETURNS TABLE(
  total_income DECIMAL(12,2),
  total_expenses DECIMAL(12,2),
  net_balance DECIMAL(12,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as net_balance
  FROM transactions;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get transactions by date range
CREATE OR REPLACE FUNCTION get_transactions_by_date_range(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE(
  id UUID,
  type VARCHAR(20),
  date DATE,
  amount DECIMAL(12,2),
  category VARCHAR(100),
  payment_mode VARCHAR(50),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.type,
    t.date,
    t.amount,
    t.category,
    t.payment_mode,
    t.description,
    t.image_url,
    t.created_at
  FROM transactions t
  WHERE t.date >= start_date AND t.date <= end_date
  ORDER BY t.date DESC, t.created_at DESC;
END;
$$ LANGUAGE plpgsql;
