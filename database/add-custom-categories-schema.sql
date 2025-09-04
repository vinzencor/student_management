-- Add custom income and expense types tables
-- Run this in your Supabase SQL Editor

-- Create income_types table for custom income categories
CREATE TABLE IF NOT EXISTS income_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expense_types table for custom expense categories  
CREATE TABLE IF NOT EXISTS expense_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default income types
INSERT INTO income_types (name, description, is_default, is_active) VALUES
('Student Fees', 'Fee payments from students', true, true),
('Course Sales', 'Revenue from course enrollments', true, true),
('Donations', 'Donations and grants received', true, true),
('Other Income', 'Miscellaneous income sources', true, true)
ON CONFLICT (name) DO NOTHING;

-- Insert default expense types
INSERT INTO expense_types (name, description, is_default, is_active) VALUES
('Salaries', 'Staff and teacher salaries', true, true),
('Office Supplies', 'Stationery and office materials', true, true),
('Utilities', 'Electricity, water, internet bills', true, true),
('Marketing', 'Advertising and promotional expenses', true, true),
('Maintenance', 'Building and equipment maintenance', true, true),
('Other Expenses', 'Miscellaneous expenses', true, true)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_income_types_active ON income_types(is_active);
CREATE INDEX IF NOT EXISTS idx_expense_types_active ON expense_types(is_active);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_income_types_updated_at ON income_types;
CREATE TRIGGER update_income_types_updated_at
    BEFORE UPDATE ON income_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expense_types_updated_at ON expense_types;
CREATE TRIGGER update_expense_types_updated_at
    BEFORE UPDATE ON expense_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing transactions table to reference these types (if needed)
-- This is optional and can be done later for better data integrity
-- ALTER TABLE transactions ADD COLUMN income_type_id UUID REFERENCES income_types(id);
-- ALTER TABLE transactions ADD COLUMN expense_type_id UUID REFERENCES expense_types(id);
