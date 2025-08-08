-- Add receipts and simple accounts aux tables

-- Receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,4) DEFAULT 0,
  tax_amount NUMERIC(12,2) GENERATED ALWAYS AS (ROUND(amount * tax_rate, 2)) STORED,
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (ROUND(amount + (amount * tax_rate), 2)) STORED,
  currency TEXT DEFAULT 'INR',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','printed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_lead_id ON receipts(lead_id);
CREATE INDEX IF NOT EXISTS idx_receipts_student_id ON receipts(student_id);

-- Liabilities (simple)
CREATE TABLE IF NOT EXISTS liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fee structures (simple)
CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_amount NUMERIC(12,2) NOT NULL,
  default_tax_rate NUMERIC(5,4) DEFAULT 0.18,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fund transactions (income/outgoing)
CREATE TABLE IF NOT EXISTS fund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('income','outgoing')),
  amount NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','completed','cancelled')),
  start_date DATE,
  end_date DATE,
  budget NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- For development ease: disable RLS and grant read/write to authenticated
ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures DISABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON receipts, liabilities, fee_structures, fund_transactions, plans TO authenticated;
