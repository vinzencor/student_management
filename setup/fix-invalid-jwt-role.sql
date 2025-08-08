-- =====================================================
-- FIX INVALID JWT ROLE CLAIMS (403: permission denied to set role "super_admin")
-- Why: Supabase JWT's "role" claim must be either "anon" or "authenticated".
-- If auth.users.role is set to custom values like "super_admin", PostgREST
-- tries to SET ROLE to that value and fails with 403 (code 42501).
-- =====================================================

-- 1) Reset all user roles to valid values (keep only anon/authenticated)
-- NOTE: This does NOT change your application roles. Store app roles in a separate
-- table (e.g., public.staff.role) or user_metadata, not in auth.users.role.
UPDATE auth.users
SET role = 'authenticated'
WHERE role NOT IN ('anon', 'authenticated');

-- 2) (Optional) Quick visibility: see current roles after reset
SELECT email, role, email_confirmed_at IS NOT NULL AS confirmed
FROM auth.users
ORDER BY email;

-- 3) (Optional) Ensure RLS isn't blocking while you test (comment out if you already manage RLS)
-- ALTER TABLE IF EXISTS students DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS staff DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS fees DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS attendance DISABLE ROW LEVEL SECURITY;

-- 4) (Info) Recommended pattern for app roles:
-- - Keep auth.users.role = 'authenticated'
-- - Put your app role in:
--     a) public.staff.role column (linked by auth.uid())
--     b) or user_metadata->>'app_role' (custom claim), and reference it in RLS with auth.jwt()
-- - Write RLS policies that allow the "authenticated" DB role, then filter per-user using auth.uid()

-- After running this:
-- - Ask users to sign out and sign back in to get a fresh JWT without the invalid role claim.
-- - Your selects (students, leads, fees, attendance) should stop returning 403.

