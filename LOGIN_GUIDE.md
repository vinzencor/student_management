# 🔐 Login Guide - Staff Management System

## Current Demo Mode Login

Since the system is currently in demo mode, you can use **any email and password** to login:

### 🔴 Super Admin Access:
- **Email:** `admin@educare.com` ⭐ (GUARANTEED SUPER ADMIN)
- **Password:** Any password (e.g., `admin123`)
- **Access:** Full system access including staff management

### 🟢 Teacher Access:
- **Email:** `teacher@educare.com` (or any email with "teacher")
- **Password:** Any password (e.g., `teacher123`)
- **Access:** Student reports, performance tracking, attendance

### 🟡 Accountant Access:
- **Email:** `accountant@educare.com` (or any email with "accountant")
- **Password:** Any password (e.g., `accountant123`)
- **Access:** Financial dashboard, fee management, salary tracking

### 🔵 Office Staff Access:
- **Email:** `office@educare.com` (or any email with "office")
- **Password:** Any password (e.g., `office123`)
- **Access:** Student management, lead management

## 🛠️ Setting Up Proper Authentication

To set up proper authentication with Supabase:

### Step 1: Configure Supabase
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Settings
3. Configure your authentication providers
4. Set up email templates if needed

### Step 2: Create Staff Records
1. Run the SQL script: `setup/create-admin.sql` in your Supabase SQL Editor
2. This will create sample staff records for each role

### Step 3: Create Supabase Auth Users
In your Supabase SQL Editor, run:

```sql
-- Create auth users (replace with your preferred passwords)
-- Note: In production, users should sign up through the app

-- Super Admin
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
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@school.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"first_name": "Super", "last_name": "Admin", "role": "super_admin"}'::jsonb
);
```

### Step 4: Update Authentication Context
If you want to disable demo mode, update `AuthContext.tsx`:

```typescript
// Remove or comment out the demo mode fallback
if (error) {
  return { error }; // Don't create mock user
}
```

## 🎯 Role-Based Features

### Super Admin Features:
- ✅ Staff Management (Add/Edit/Delete staff)
- ✅ All system modules access
- ✅ Advanced reports with date filtering
- ✅ Staff analytics and insights
- ✅ System settings

### Teacher Features:
- ✅ Student selection dropdown
- ✅ Individual student reports
- ✅ Performance graphs and analytics
- ✅ Attendance tracking
- ✅ Fee status viewing

### Accountant Features:
- ✅ Financial dashboard
- ✅ Money flow reports
- ✅ Fee management
- ✅ Salary tracking
- ✅ Overdue monitoring

### Office Staff Features:
- ✅ Student management
- ✅ Lead management
- ✅ Basic reporting
- ✅ Communication tools

## 🚀 Quick Start

1. **Start the application**
2. **Login with any email/password** (demo mode)
3. **The system will automatically assign super_admin role**
4. **Navigate to "Staff Management" to add other staff members**
5. **Test different roles by creating staff with different roles**

## 🔒 Security Notes

- In demo mode, all logins get super_admin access
- For production, implement proper Supabase authentication
- Each staff member should have their own Supabase auth account
- Role permissions are enforced at the UI and API level
- Staff profiles are linked to auth users via email

## 📞 Support

If you need help setting up proper authentication or have questions about the role-based system, the code includes comprehensive error handling and logging to help debug any issues.

The system is designed to be flexible and can work in both demo mode (for testing) and production mode (with proper authentication).
