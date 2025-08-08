# 🔐 Supabase Role Management Guide

## 🎯 **What I've Created for You:**

### ✅ **Enhanced Auth System:**
- Added `role` field to `auth.users` table
- Created 10 complete staff members with real auth accounts
- Proper role-based authentication
- Easy role management through Supabase dashboard

---

## 📋 **10 Staff Members Created:**

### **🔴 Super Admins (2):**
1. **admin@educare.com** → Password: `admin123`
2. **michael.admin@educare.com** → Password: `admin123`

### **🟢 Teachers (4):**
3. **john.teacher@educare.com** → Password: `teacher123` (Math, Physics)
4. **emily.teacher@educare.com** → Password: `teacher123` (English, Literature)
5. **david.teacher@educare.com** → Password: `teacher123` (Physics, Science)
6. **robert.teacher@educare.com** → Password: `teacher123` (History, Social Studies)

### **🟡 Accountants (2):**
7. **sarah.accountant@educare.com** → Password: `accountant123`
8. **jennifer.accountant@educare.com** → Password: `accountant123`

### **🔵 Office Staff (2):**
9. **mike.office@educare.com** → Password: `office123`
10. **lisa.office@educare.com** → Password: `office123`

---

## 🛠️ **Setup Instructions:**

### **Step 1: Run the Complete Setup**
1. Go to **Supabase Dashboard → SQL Editor**
2. Copy and paste **`setup/complete-auth-setup.sql`**
3. **Execute the script**

### **Step 2: Verify Setup**
The script will show you:
- ✅ 10 auth users created
- ✅ 10 staff records created
- ✅ All role permissions set up
- ✅ Sample salary records

### **Step 3: Test Login**
Try logging in with any of the 10 accounts above!

---

## 🔧 **Managing Roles in Supabase:**

### **Method 1: Through Supabase Dashboard**
1. Go to **Authentication → Users**
2. Click on any user
3. **Edit the `role` field** directly
4. Save changes

### **Method 2: Through SQL**
```sql
-- Change a user's role
UPDATE auth.users 
SET role = 'super_admin' 
WHERE email = 'user@educare.com';

-- Also update the staff record
UPDATE staff 
SET role = 'super_admin' 
WHERE email = 'user@educare.com';
```

### **Method 3: Through Your App**
The system will automatically detect the role from:
1. `auth.users.role` field (highest priority)
2. `staff.role` field
3. `user_metadata.role` field
4. Email pattern (fallback)

---

## 🎯 **Adding New Staff Members:**

### **Option 1: Use Supabase Dashboard**
1. **Authentication → Users → Add User**
2. **Set email and password**
3. **Set the `role` field** to desired role
4. **Add staff record** in your app's Staff Management

### **Option 2: SQL Script**
```sql
-- Create new auth user
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id, 'authenticated', 'authenticated',
        'newuser@educare.com', crypt('password123', gen_salt('bf')),
        NOW(), '{"provider": "email", "providers": ["email"]}',
        '{"first_name": "New", "last_name": "User", "role": "teacher"}',
        NOW(), NOW()
    );
    
    -- Set the role
    UPDATE auth.users SET role = 'teacher' WHERE id = new_user_id;
    
    -- Create staff record
    INSERT INTO staff (first_name, last_name, email, phone, role, status, hire_date)
    VALUES ('New', 'User', 'newuser@educare.com', '+1-555-0000', 'teacher', 'active', CURRENT_DATE);
END $$;
```

---

## 🔍 **Role Verification:**

### **Check User Roles:**
```sql
-- See all users and their roles
SELECT email, role, raw_user_meta_data->>'role' as metadata_role
FROM auth.users 
WHERE email LIKE '%@educare.com'
ORDER BY role, email;
```

### **Check Staff Records:**
```sql
-- See all staff and their roles
SELECT email, role, first_name, last_name, status
FROM staff 
WHERE email LIKE '%@educare.com'
ORDER BY role, first_name;
```

---

## 🎯 **Available Roles:**

### **Role Options:**
- `super_admin` - Complete system access
- `teacher` - Student management and reporting
- `accountant` - Financial management
- `office_staff` - Student and lead management

### **Role Permissions:**
Each role has specific permissions defined in the `role_permissions` table. The system automatically grants the correct permissions based on the user's role.

---

## 🚀 **Testing the System:**

### **Test Each Role:**
1. **Login** with different accounts
2. **Verify** role-specific dashboards load
3. **Check** navigation menus show correct items
4. **Test** permissions work correctly

### **Expected Behavior:**
- **Super Admin:** Sees all features including Staff Management
- **Teacher:** Sees student-focused dashboard and reports
- **Accountant:** Sees financial dashboard and money management
- **Office Staff:** Sees student and lead management features

---

## 🔧 **Troubleshooting:**

### **If Role Not Detected:**
1. **Check** the `auth.users.role` field is set
2. **Verify** the `staff.role` field matches
3. **Clear** browser cache and login again
4. **Check** browser console for any errors

### **If Login Fails:**
1. **Verify** the email and password are correct
2. **Check** the user exists in `auth.users`
3. **Ensure** `email_confirmed_at` is set
4. **Try** resetting the password

---

## 🎉 **Summary:**

You now have:
- ✅ **10 complete staff accounts** with real authentication
- ✅ **Role field in auth.users** for easy management
- ✅ **Proper role-based permissions** system
- ✅ **Easy role management** through Supabase dashboard
- ✅ **Comprehensive testing accounts** for all roles

**Ready to use with real Supabase authentication! 🚀**
