# Monthly Fee Cycle System

## Overview

The Fee Management system now implements a **monthly recurring fee cycle** where students pay fees monthly, and the system automatically tracks when the next payment is due.

## How It Works

### 1. **Payment Cycle Logic**
- **After Payment**: Student has 1 month of "paid" status
- **Warning Period**: 5 days before next due date, status changes to "Due Soon"
- **Overdue**: After the due date passes, status becomes "Overdue"

### 2. **Example Timeline**
```
Student pays on: April 4th
├── April 4 - April 29: Status = "Paid" ✅
├── April 30 - May 3: Status = "Due Soon" ⚠️ (5 days warning)
└── May 4 onwards: Status = "Overdue" ❌
```

### 3. **Status Types**

| Status | Description | Color | When It Shows |
|--------|-------------|-------|---------------|
| **Pending** | No payment made yet | Yellow | Initial state |
| **Partial** | Some payment made, balance remaining | Blue | Partial payment within month |
| **Paid** | Fully paid for current month | Green | Within paid month period |
| **Due Soon** | Payment due in 5 days or less | Orange | 5 days before due date |
| **Overdue** | Payment past due date | Red | After due date |

## User Interface Changes

### 1. **Enhanced Status Display**
- **Status Icons**: Different icons for each status type
- **Color Coding**: Visual indicators for urgency
- **Next Due Date**: Shows when next payment is due
- **Days Remaining**: Countdown to next payment

### 2. **Action Buttons**
- **"Pay Fees"**: Normal payment button (green)
- **"Pay Due Soon"**: Warning state button (orange)
- **"Pay Overdue"**: Urgent payment button (red)
- **"Next payment in X days"**: Info for paid students

### 3. **Due Date Information**
```
Current Due: 4/4/2025
Paid: 4/4/2025
Next Due: 5/4/2025 (25 days left)
```

## Business Logic

### 1. **Monthly Cycle Calculation**
```javascript
// After payment on April 4th:
lastPaymentDate = new Date('2025-04-04')
nextDueDate = new Date('2025-05-04') // +1 month
warningDate = new Date('2025-04-29') // -5 days from due

// Status logic:
if (today < warningDate) → "Paid"
if (today >= warningDate && today < nextDueDate) → "Due Soon"  
if (today >= nextDueDate) → "Overdue"
```

### 2. **Remaining Balance Logic**
- **Total Course Fee**: QAR 2,500 (fixed)
- **Paid Amount**: QAR 500 (cumulative)
- **Remaining**: QAR 2,000 (total - paid)
- **Monthly Status**: Independent of remaining balance

### 3. **Combined Status Logic**
```javascript
if (remainingBalance <= 0 && paidAmount > 0) {
  status = monthlyStatus === 'overdue' ? 'overdue' : 'paid'
} else if (paidAmount > 0) {
  status = monthlyStatus === 'overdue' ? 'overdue' : 
           monthlyStatus === 'warning' ? 'warning' : 'partial'
} else {
  status = 'pending'
}
```

## Database Changes

### 1. **New Status Added**
```sql
ALTER TABLE fees ADD CONSTRAINT fees_status_check 
CHECK (status IN ('pending', 'paid', 'overdue', 'partial', 'warning'));
```

### 2. **Fee Interface Updated**
```typescript
interface Fee {
  // ... other fields
  status: 'pending' | 'paid' | 'overdue' | 'partial' | 'warning'
}
```

## Implementation Files

### 1. **Updated Components**
- `FeeManagement.tsx` - Main fee management logic
- `supabase.ts` - Updated Fee interface

### 2. **Database Migrations**
- `add-warning-status-to-fees.sql` - Adds warning status to database

### 3. **New Functions**
- `getNextDueDate(fee)` - Calculates next payment due date
- `getDaysUntilDue(fee)` - Days remaining until next payment
- `getStatusText(status)` - User-friendly status labels

## User Experience

### 1. **For Students/Parents**
- **Clear Timeline**: Know exactly when next payment is due
- **Early Warning**: 5-day advance notice before due date
- **Visual Cues**: Color-coded status for quick understanding

### 2. **For Staff**
- **Automated Tracking**: System handles monthly cycles automatically
- **Priority Actions**: Overdue payments highlighted in red
- **Bulk Operations**: Can still select multiple students for reminders

### 3. **For Administrators**
- **Predictable Revenue**: Monthly recurring payment model
- **Reduced Manual Work**: Automatic status updates
- **Better Cash Flow**: Early warning system for collections

## Testing Scenarios

### 1. **New Student Payment**
1. Student pays QAR 500 on April 4th
2. Status shows "Partial" (QAR 2000 remaining)
3. Next due date: May 4th
4. Status remains "Partial" until April 29th
5. April 30th: Status changes to "Due Soon"
6. May 4th: Status changes to "Overdue"

### 2. **Full Payment**
1. Student pays full QAR 2500 on April 4th
2. Status shows "Paid" (QAR 0 remaining)
3. Next due date: May 4th (for next course/term)
4. Status remains "Paid" until April 29th
5. April 30th: Status changes to "Due Soon"

### 3. **Partial Payment Cycle**
1. Student pays QAR 500 monthly
2. Each payment extends the "paid" period by 1 month
3. Remaining balance decreases with each payment
4. Monthly cycle continues until fully paid

## Benefits

### 1. **Automated Management**
- ✅ No manual status updates needed
- ✅ Automatic due date calculations
- ✅ Consistent monthly cycles

### 2. **Improved Collections**
- ✅ Early warning system (5 days advance)
- ✅ Visual priority indicators
- ✅ Clear payment timelines

### 3. **Better User Experience**
- ✅ Predictable payment schedule
- ✅ Clear status communication
- ✅ Reduced confusion about due dates

### 4. **Business Intelligence**
- ✅ Predictable monthly revenue
- ✅ Better cash flow planning
- ✅ Automated reminder triggers

## Migration Steps

1. **Run Database Migration**:
   ```sql
   -- project/database/add-warning-status-to-fees.sql
   ```

2. **Test the System**:
   - Make a test payment
   - Verify status changes over time
   - Check next due date calculations

3. **Train Staff**:
   - Explain new status meanings
   - Show how monthly cycles work
   - Demonstrate early warning system

The system now provides a complete monthly fee cycle management solution that automates status tracking and provides clear visibility into payment timelines.
