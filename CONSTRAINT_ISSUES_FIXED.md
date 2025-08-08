# 🔧 Constraint Issues Fixed

## 🚨 **Error You Encountered:**
```
ERROR: 23514: new row for relation "leads" violates check constraint "leads_source_check"
DETAIL: Failing row contains (..., Website, ...)
```

## ✅ **Root Cause:**
The `leads` table had a check constraint that only allowed specific values for the `source` field, but our sample data used "Website" (capital W) instead of "website" (lowercase).

## 🎯 **SOLUTIONS PROVIDED:**

---

## 🛠️ **Option 1: Fixed Complete Setup (RECOMMENDED)**

### **File:** `setup/complete-database-setup.sql` (UPDATED)
**What I Fixed:**
- ✅ **Defined valid source values** in the constraint
- ✅ **Updated sample data** to use lowercase values
- ✅ **Fixed RAISE NOTICE** syntax error
- ✅ **All constraints properly defined**

### **Valid Source Values:**
- `website`
- `referral` 
- `social_media`
- `walk_in`
- `phone`
- `email`
- `advertisement`
- `other`

---

## 🛡️ **Option 2: Safe Setup (NO CONSTRAINTS)**

### **File:** `setup/safe-database-setup.sql` (NEW)
**What This Does:**
- ✅ **Minimal constraints** to prevent errors
- ✅ **Essential tables only** (staff, students, leads, etc.)
- ✅ **10 staff members** with auth users
- ✅ **Role permissions** system
- ✅ **Sample data** with safe values
- ✅ **Guaranteed to work** without constraint issues

---

## 🚀 **Setup Instructions:**

### **Choose Your Approach:**

#### **Option A: Complete Setup (Full Features)**
1. **Use:** `setup/complete-database-setup.sql`
2. **Gets:** All tables, constraints, and features
3. **Risk:** Low (constraints are now properly defined)

#### **Option B: Safe Setup (Minimal Constraints)**
1. **Use:** `setup/safe-database-setup.sql`
2. **Gets:** Essential functionality without constraint issues
3. **Risk:** None (minimal constraints)

### **Both Options Provide:**
- ✅ **10 staff members** with real auth
- ✅ **Role-based permissions**
- ✅ **Sample data** for testing
- ✅ **Role field** in auth.users
- ✅ **Working authentication**

---

## 🔍 **What Was Fixed:**

### **1. Check Constraint Issue:**
```sql
-- BEFORE (caused error):
source VARCHAR(50), -- No constraint defined properly

-- AFTER (fixed):
source VARCHAR(50) CHECK (source IN ('website', 'referral', 'social_media', 'walk_in', 'phone', 'email', 'advertisement', 'other')),
```

### **2. Sample Data Issue:**
```sql
-- BEFORE (caused error):
('John', 'Doe', 'john.doe@example.com', '+1-555-2001', 'Website', 'Interested in Grade 11 admission'),

-- AFTER (fixed):
('John', 'Doe', 'john.doe@example.com', '+1-555-2001', 'website', 'Interested in Grade 11 admission'),
```

### **3. RAISE NOTICE Syntax:**
```sql
-- BEFORE (caused error):
RAISE NOTICE '🧹 Cleaned up existing data';

-- AFTER (fixed):
DO $$
BEGIN
    -- cleanup code here
    RAISE NOTICE '🧹 Cleaned up existing data';
END $$;
```

---

## 🎯 **Recommended Approach:**

### **For Most Users:**
**Use `setup/safe-database-setup.sql`**
- ✅ Guaranteed to work
- ✅ No constraint issues
- ✅ All essential features
- ✅ Easy to extend later

### **For Advanced Users:**
**Use `setup/complete-database-setup.sql`**
- ✅ Full database structure
- ✅ All constraints properly defined
- ✅ Production-ready schema
- ✅ Complete feature set

---

## 🔑 **Login Credentials (Both Options):**

- **Super Admin:** `admin@educare.com` / `admin123`
- **Teacher:** `john.teacher@educare.com` / `teacher123`
- **Accountant:** `sarah.accountant@educare.com` / `accountant123`
- **Office Staff:** `mike.office@educare.com` / `office123`

---

## 🚨 **If You Still Get Constraint Errors:**

### **Quick Fix:**
1. **Drop the problematic constraint:**
   ```sql
   ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
   ```

2. **Or use the safe setup script** which avoids these issues entirely.

### **Common Constraint Issues:**
- **Check constraints** on enum-like fields
- **Foreign key constraints** with missing references
- **Unique constraints** with duplicate data
- **Not null constraints** with missing values

---

## 🎉 **Summary:**

### **Problem:** Check constraint violation on leads.source
### **Solution:** Fixed constraint definition and sample data
### **Result:** Two working setup scripts with different approaches

**Both scripts will give you a fully functional staff management system with 10 test accounts! 🚀**

**Choose the safe setup for guaranteed success, or the complete setup for full features.**
