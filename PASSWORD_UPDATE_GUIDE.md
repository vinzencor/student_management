# Password Update Guide

## 🔐 Universal Password Update

All user passwords have been standardized to `123456` for easier testing and development.

## 📋 How to Apply the Password Update

### Step 1: Run the SQL Script
1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste** the content from `database/update-all-passwords.sql`
4. **Click "Run"** to execute the script

### Step 2: Verify the Update
The script will:
- ✅ Update ALL existing user passwords to `123456`
- ✅ Create missing demo users if they don't exist
- ✅ Show a summary of updated users
- ✅ Display login credentials

## 🎯 Updated Login Credentials

After running the script, ALL users will have the password `123456`:

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| `admin@educare.com` | `123456` | Super Admin | Full access to all features |
| `accountant@educare.com` | `123456` | Accountant | Staff, leads, accounts, fees, receipts, reports |
| `teacher@educare.com` | `123456` | Teacher | Students, batches, courses, schedule, attendance, reports |
| `office@educare.com` | `123456` | Office Staff | Students, batches, leads, courses, attendance, reports |

## 🚀 Quick Testing

### Demo Login Buttons
The login page has been updated to use the new password. You can:
1. **Click any demo role button** on the login page
2. **Automatically login** with the correct credentials
3. **Test role-based access** immediately

### Manual Login
You can also manually enter:
- **Email**: Any of the emails above
- **Password**: `123456`

## ⚠️ Security Warning

**This password update is for development/testing only!**

### For Production:
- ❌ **Never use** `123456` as a password in production
- ✅ **Use strong passwords** (8+ characters, mixed case, numbers, symbols)
- ✅ **Enable 2FA** where possible
- ✅ **Regular password updates** for security

### For Development:
- ✅ **Easy testing** with consistent passwords
- ✅ **Quick role switching** for feature testing
- ✅ **Demo purposes** and presentations

## 🔧 What the Script Does

### Password Updates:
```sql
-- Updates all existing users
UPDATE auth.users 
SET encrypted_password = crypt('123456', gen_salt('bf'))
WHERE email IS NOT NULL;
```

### User Creation:
- Creates missing demo users if they don't exist
- Sets up proper role metadata
- Creates corresponding staff records
- Ensures all demo accounts are available

### Verification:
- Lists all users with their roles
- Confirms email verification status
- Shows creation dates

## 🧪 Testing Different Roles

After running the script, you can test:

1. **Super Admin Access**:
   - Login: `admin@educare.com` / `123456`
   - Should see: All menu items and features

2. **Accountant Access**:
   - Login: `accountant@educare.com` / `123456`
   - Should see: Dashboard, Staff, Leads, Fees, Accounts, Receipts, Reports

3. **Teacher Access**:
   - Login: `teacher@educare.com` / `123456`
   - Should see: Dashboard, Students, Batches, Courses, Schedule, Attendance, Reports

4. **Office Staff Access**:
   - Login: `office@educare.com` / `123456`
   - Should see: Dashboard, Students, Batches, Leads, Courses, Attendance, Reports

## 🔄 Reverting Changes

If you need to revert to individual passwords:

```sql
-- Example: Set specific passwords for each user
UPDATE auth.users 
SET encrypted_password = crypt('admin123', gen_salt('bf'))
WHERE email = 'admin@educare.com';

UPDATE auth.users 
SET encrypted_password = crypt('accountant123', gen_salt('bf'))
WHERE email = 'accountant@educare.com';
```

## 📞 Support

If you encounter any issues:
1. Check the Supabase logs for error messages
2. Verify the script ran successfully
3. Ensure you're using the correct email addresses
4. Try refreshing the login page

The password standardization makes testing and development much easier while maintaining proper role-based access control!
