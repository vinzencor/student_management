# 🔧 Supabase Authentication Troubleshooting

## 🚨 **Errors You're Experiencing:**

### **1. 401 Unauthorized:**
```
GET https://...supabase.co/rest/v1/students?... 401 (Unauthorized)
```

### **2. Role Does Not Exist:**
```
{code: '22023', message: 'role "super_admin" does not exist'}
```

## 🎯 **Root Causes:**

### **401 Unauthorized:**
- **Row Level Security (RLS)** is enabled on tables
- **No RLS policies** allow access to authenticated users
- **Missing permissions** for the authenticated role

### **Role "super_admin" Does Not Exist:**
- **PostgreSQL roles** not created in database
- **Application roles** don't match database roles
- **Role context** not properly set

---

## ✅ **SOLUTIONS (Choose One):**

## 🚀 **Option 1: Quick Fix (RECOMMENDED)**

### **File:** `setup/disable-rls-quick-fix.sql`

**What it does:**
- ✅ **Disables RLS** on all tables (immediate access)
- ✅ **Creates PostgreSQL roles** (fixes role errors)
- ✅ **Grants full permissions** to authenticated users
- ✅ **Updates user roles** in auth.users
- ✅ **Removes restrictive policies**

**Run this for immediate access!**

---

## 🛠️ **Option 2: Complete Fix**

### **File:** `setup/fix-supabase-rls.sql`

**What it does:**
- ✅ **Creates proper PostgreSQL roles**
- ✅ **Sets up role-based permissions**
- ✅ **Disables RLS temporarily** for access
- ✅ **Provides framework** for future RLS policies
- ✅ **Updates auth.users** with correct roles

**Use this for a more structured approach**

---

## 🚀 **Immediate Fix Instructions:**

### **Step 1: Run Quick Fix**
1. **Go to:** Supabase Dashboard → SQL Editor
2. **Copy and paste:** `setup/disable-rls-quick-fix.sql`
3. **Execute the script**
4. **Wait for completion**

### **Step 2: Test Login**
1. **Refresh your application**
2. **Login with:** `admin@educare.com` / `admin123`
3. **Check:** Dashboard loads without 401 errors
4. **Verify:** All features work properly

---

## 🔍 **What Each Fix Does:**

### **Quick Fix Results:**
- 🔓 **RLS Disabled** on all tables
- 👤 **Full Access** for authenticated users
- 🎭 **PostgreSQL Roles** created
- ✅ **401 Errors** eliminated
- 🚀 **Immediate Access** restored

### **Complete Fix Results:**
- 🎭 **Proper Role System** established
- 🔐 **Role-Based Permissions** configured
- 🛡️ **Security Framework** for future
- 📋 **Structured Approach** to access control

---

## 🔧 **Manual Verification:**

### **Check RLS Status:**
```sql
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
AND tablename IN ('students', 'leads', 'staff', 'fees');
```

### **Check PostgreSQL Roles:**
```sql
SELECT rolname 
FROM pg_roles 
WHERE rolname IN ('super_admin', 'teacher', 'accountant', 'office_staff');
```

### **Check Auth User Roles:**
```sql
SELECT email, role 
FROM auth.users 
WHERE email LIKE '%@educare.com';
```

---

## 🚨 **If Issues Persist:**

### **1. Check Supabase Project Settings:**
- **API URL** and **Anon Key** are correct
- **Service Role Key** has proper permissions
- **Database** is accessible

### **2. Check Browser Network Tab:**
- **Request headers** include authorization
- **Response status** codes and messages
- **CORS** issues or blocked requests

### **3. Check Application Code:**
- **Supabase client** is properly initialized
- **Authentication state** is correctly managed
- **API calls** use proper authentication

---

## 🎯 **Expected Results After Fix:**

### **✅ What Should Work:**
- **Login** with admin@educare.com succeeds
- **Dashboard** loads without errors
- **All API calls** return data (not 401)
- **Staff Management** accessible
- **Reports** load properly
- **No role errors** in console

### **✅ Console Should Show:**
- **No 401 Unauthorized** errors
- **No "role does not exist"** errors
- **Successful API responses** with data
- **Clean authentication flow**

---

## 🔐 **Security Considerations:**

### **Current State (After Quick Fix):**
- **RLS Disabled** - All authenticated users have full access
- **Open Permissions** - Good for development/testing
- **No Data Isolation** - Users can see all data

### **For Production:**
- **Re-enable RLS** with proper policies
- **Implement role-based** data filtering
- **Add data isolation** between users/organizations
- **Audit access patterns** and permissions

---

## 📋 **Next Steps:**

### **Immediate (After Fix):**
1. **Test all features** to ensure they work
2. **Verify role-based** navigation works
3. **Check data access** across different roles
4. **Confirm no console errors**

### **Future (For Production):**
1. **Design RLS policies** for data isolation
2. **Implement proper** role-based access
3. **Add audit logging** for security
4. **Test security** boundaries

---

## 🎉 **Summary:**

### **Problem:** 401 Unauthorized + Role errors blocking access
### **Solution:** Disable RLS and create proper roles
### **Result:** Full access restored for all authenticated users

**Run the quick fix script and your authentication issues will be resolved! 🚀**
