# Supabase Authentication Setup Guide

## Current Issue
You're getting a `400 Bad Request` error when trying to authenticate. This is likely because:
1. Authentication is not enabled in your Supabase project
2. The authentication settings need to be configured
3. Email authentication might not be set up properly

## Quick Fix (Demo Mode)
I've implemented a temporary demo mode that allows you to test the system. You can:
1. Use the "Fill Demo Credentials" button on the login page
2. Or manually enter: `admin@educare.com` / `admin123`
3. The system will work in demo mode while we fix the auth issue

## Steps to Fix Supabase Authentication

### 1. Enable Authentication in Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** → **Settings**
3. Make sure **Enable email confirmations** is configured according to your needs
4. Check **Site URL** - it should be `http://localhost:5173` for development

### 2. Configure Authentication Providers

1. In **Authentication** → **Providers**
2. Make sure **Email** provider is enabled
3. Configure the settings:
   - **Enable email provider**: ON
   - **Confirm email**: You can disable this for testing
   - **Enable email OTP**: Optional

### 3. Set Up Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Configure the email templates if you want email confirmation

### 4. Check RLS (Row Level Security) Policies

1. Go to **Authentication** → **Policies**
2. Make sure you have appropriate policies set up for your tables
3. For testing, you can temporarily disable RLS on tables

### 5. Verify Database Schema

Make sure your database has the required tables. Run this SQL in the Supabase SQL Editor:

```sql
-- Check if auth is working
SELECT * FROM auth.users LIMIT 1;

-- Create a test user (optional)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@educare.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Admin", "last_name": "User", "role": "admin"}'
);
```

### 6. Environment Variables (Optional)

For production, create a `.env.local` file:

```env
VITE_SUPABASE_URL=https://jwqxbevszjlbistvrejv.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Then update `src/lib/supabase.ts`:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jwqxbevszjlbistvrejv.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_current_key'
```

### 7. Test Authentication

After making these changes:

1. Try creating a new account using the Sign Up form
2. Or try logging in with existing credentials
3. Check the browser's Network tab for any error details
4. Check the Supabase dashboard logs for authentication attempts

## Alternative: Manual User Creation

If authentication still doesn't work, you can manually create a user in Supabase:

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter email: `admin@educare.com`
4. Enter password: `admin123`
5. Set user metadata:
   ```json
   {
     "first_name": "Admin",
     "last_name": "User",
     "role": "admin"
   }
   ```

## Current Demo Mode Features

While in demo mode, all features work except:
- Real authentication (uses mock user)
- Email sending (logs to console instead)
- Some Supabase-dependent features may use fallback data

## Next Steps

1. Try the demo mode first to test all features
2. Follow the Supabase setup steps above
3. Once auth is working, remove the demo mode fallbacks
4. Test with real authentication

## Need Help?

If you continue having issues:
1. Check the browser console for detailed error messages
2. Check the Supabase dashboard logs
3. Verify your Supabase project is active and not paused
4. Make sure you're using the correct project URL and keys

The system is fully functional in demo mode, so you can test all features while fixing the authentication setup!
