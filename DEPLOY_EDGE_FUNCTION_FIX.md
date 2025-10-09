# Deploy Edge Function Fix for Attendance Email Reminders

## 🚨 **CRITICAL: Edge Function Deployment Required**

The attendance email reminder constraint fix requires deploying the updated Edge Function to Supabase.

## 📋 **What Was Fixed:**

The `send-fee-reminder` Edge Function now includes proper type mapping:

```typescript
// Map the request type to the correct database reminder_type
const reminderTypeMapping: { [key: string]: string } = {
  'enrollment_reminder': 'enrollment_8_days',
  'monthly_reminder': 'monthly_fee',
  'attendance_reminder': 'attendance_8_days'  // ✅ This fixes the constraint error
};

const dbReminderType = reminderTypeMapping[type] || type;
```

## 🔧 **Deployment Options:**

### **Option 1: Supabase CLI (Recommended)**

If you have Supabase CLI installed:

```bash
# Navigate to your project root
cd d:\Ecraftz\student-management

# Deploy the specific function
supabase functions deploy send-fee-reminder

# Or deploy all functions
supabase functions deploy
```

### **Option 2: Supabase Dashboard**

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `rahulpradeepan77@gmail.com's Project`

2. **Navigate to Edge Functions:**
   - Click on "Edge Functions" in the left sidebar
   - Find the `send-fee-reminder` function

3. **Update the Function:**
   - Click on the `send-fee-reminder` function
   - Replace the existing code with the updated version from:
     `supabase/functions/send-fee-reminder/index.ts`

4. **Deploy:**
   - Click "Deploy" or "Save" to deploy the changes

### **Option 3: Manual Code Update**

If you can't deploy via CLI, you can manually update the function in the Supabase Dashboard:

**Find this section in the Edge Function (around line 245-260):**

```typescript
// REPLACE THIS OLD CODE:
await supabaseClient
  .from('email_reminders')
  .insert([{
    student_id: studentId,
    reminder_type: type,  // ❌ This causes the constraint error
    recipient_email: emailData.to,
    status: 'sent',
    email_id: emailResult.id,
    sent_at: new Date().toISOString()
  }])
```

**WITH THIS NEW CODE:**

```typescript
// Map the request type to the correct database reminder_type
const reminderTypeMapping: { [key: string]: string } = {
  'enrollment_reminder': 'enrollment_8_days',
  'monthly_reminder': 'monthly_fee',
  'attendance_reminder': 'attendance_8_days'
};

const dbReminderType = reminderTypeMapping[type] || type;

await supabaseClient
  .from('email_reminders')
  .insert([{
    student_id: studentId,
    reminder_type: dbReminderType,  // ✅ This fixes the constraint error
    recipient_email: emailData.to,
    status: 'sent',
    email_id: emailResult.id,
    sent_at: new Date().toISOString()
  }])
```

## ✅ **Verification Steps:**

After deployment, test the fix:

### **1. Test Attendance Saving:**
- Go to Attendance Management
- Select any date
- Mark a student as Present
- **Expected:** Attendance saves without errors

### **2. Test Email Reminder Trigger:**
- Mark a student present for the 8th time
- **Expected:** Email reminder sent successfully
- **Check console logs:** Should show successful email sending

### **3. Verify Database:**
- Check the `email_reminders` table
- **Expected:** New records should have `reminder_type: 'attendance_8_days'`

## 🚨 **Before Deployment:**
```
❌ Attendance save fails with constraint error
❌ Email reminders cause database violations
❌ User workflow interrupted
```

## ✅ **After Deployment:**
```
✅ Attendance saves successfully
✅ Email reminders work with correct type mapping
✅ No more constraint violations
✅ Smooth user experience
```

## 📞 **Need Help?**

If you encounter issues with deployment:

1. **Check Supabase CLI installation:**
   ```bash
   supabase --version
   ```

2. **Login to Supabase CLI:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref jwqxbevszjlbistvrejv
   ```

4. **Then deploy:**
   ```bash
   supabase functions deploy send-fee-reminder
   ```

## 🎯 **Summary:**

**Issue:** `attendance_reminder` type doesn't match database constraint expecting `attendance_8_days`

**Fix:** Added type mapping in Edge Function to convert request types to database types

**Action Required:** Deploy the updated `send-fee-reminder` Edge Function

**Result:** Attendance saves successfully without constraint errors

**Status:** ✅ Code fixed, ⏳ Deployment pending

**Once deployed, the attendance email reminder constraint issue will be completely resolved!** 🎉
