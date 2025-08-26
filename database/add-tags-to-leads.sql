-- Add tags column to leads table and create communications table
-- Run this in your Supabase SQL Editor

-- Add tags column to leads table (safe operation)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'tags'
    ) THEN
        ALTER TABLE leads ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Create index for better performance on tags (safe operation)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_leads_tags'
    ) THEN
        CREATE INDEX idx_leads_tags ON leads USING GIN(tags);
    END IF;
END $$;

-- Create communications table for tracking emails and reminders (safe operation)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'communications'
    ) THEN
        CREATE TABLE communications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID,
          lead_id UUID,
          type VARCHAR(50) NOT NULL CHECK (type IN ('fee_reminder', 'admission_email', 'general_email', 'sms', 'call')),
          subject TEXT,
          message TEXT NOT NULL,
          recipient_email VARCHAR(255),
          recipient_phone VARCHAR(20),
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
          sent_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Create indexes for communications table (safe operations)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_communications_student_id') THEN
        CREATE INDEX idx_communications_student_id ON communications(student_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_communications_lead_id') THEN
        CREATE INDEX idx_communications_lead_id ON communications(lead_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_communications_type') THEN
        CREATE INDEX idx_communications_type ON communications(type);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_communications_status') THEN
        CREATE INDEX idx_communications_status ON communications(status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_communications_sent_at') THEN
        CREATE INDEX idx_communications_sent_at ON communications(sent_at);
    END IF;
END $$;

-- Enable RLS for communications table (safe operation)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communications') THEN
        ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for communications table (safe operations)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communications') THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view all communications" ON communications;
        DROP POLICY IF EXISTS "Users can insert communications" ON communications;
        DROP POLICY IF EXISTS "Users can update communications" ON communications;

        -- Create new policies
        CREATE POLICY "Users can view all communications" ON communications FOR SELECT USING (true);
        CREATE POLICY "Users can insert communications" ON communications FOR INSERT WITH CHECK (true);
        CREATE POLICY "Users can update communications" ON communications FOR UPDATE USING (true);
    END IF;
END $$;

-- Grant permissions (safe operations)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
        GRANT SELECT, INSERT, UPDATE ON leads TO authenticated;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communications') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON communications TO authenticated;
    END IF;
END $$;

-- Success message
SELECT 'Tags column and communications table setup completed successfully!' as message;
