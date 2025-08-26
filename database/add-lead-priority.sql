-- Add lead priority system to leads table

-- Add priority column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'cold' CHECK (priority IN ('hot', 'cold', 'lost'));

-- Add staff assignment column for lead management
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES staff(id);

-- Create index for priority filtering
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_staff ON leads(assigned_staff_id);

-- Update existing leads to have default priority
UPDATE leads SET priority = 'cold' WHERE priority IS NULL;

-- Create trigger to automatically move leads to lost status when priority is set to lost
CREATE OR REPLACE FUNCTION auto_update_lead_status_on_priority()
RETURNS TRIGGER AS $$
BEGIN
    -- If priority is set to 'lost', automatically update status to 'lost'
    IF NEW.priority = 'lost' AND OLD.priority != 'lost' THEN
        NEW.status = 'lost';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_update_lead_status_on_priority ON leads;
CREATE TRIGGER trigger_auto_update_lead_status_on_priority
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_lead_status_on_priority();

-- Add comments for documentation
COMMENT ON COLUMN leads.priority IS 'Lead priority: hot (high priority), cold (low priority), lost (no longer viable)';
COMMENT ON COLUMN leads.assigned_staff_id IS 'Staff member assigned to handle this lead';
