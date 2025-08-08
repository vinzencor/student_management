-- =====================================================
-- RESET ROLES AND FORCE-LOGOUT ALL SESSIONS (Fix 403: permission denied to set role "super_admin")
-- Run in Supabase SQL Editor
-- =====================================================

-- 1) Ensure no role-setting functions remain
DROP FUNCTION IF EXISTS public.set_user_role(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role_simple() CASCADE;

-- 2) Reset JWT role source to valid values only
UPDATE auth.users
SET role = 'authenticated'
WHERE role NOT IN ('anon', 'authenticated');

-- 3) Force-logout: delete all auth sessions so new JWTs are minted
-- WARNING: This will sign out all users. They will need to login again.
DELETE FROM auth.sessions;

-- 4) (Optional) Make sure anon/authenticated can read during dev
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 5) (Optional) Temporarily disable RLS for key tables while debugging
-- ALTER TABLE IF EXISTS students DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS staff DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS fees DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS attendance DISABLE ROW LEVEL SECURITY;

-- 6) Verify
SELECT 'AUTH USERS' AS section, email, role FROM auth.users ORDER BY email;
SELECT 'POLICIES' AS section, schemaname, tablename, policyname FROM pg_policies WHERE schemaname='public' ORDER BY tablename;

