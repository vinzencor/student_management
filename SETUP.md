# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Database Setup
1. Go to your Supabase project: https://supabase.com/dashboard/project/jwqxbevszjlbistvrejv
2. Click on "SQL Editor" in the left sidebar
3. Copy and paste the contents of `database/clean-schema.sql`
4. Click "Run" to execute the SQL
5. You should see "Database schema created successfully!" message

### Step 2: Start the Application
```bash
cd project
npm install
npm run dev
```

### Step 3: Access the Application
Open your browser and go to: http://localhost:5174

## ✨ What You'll See

### Dashboard
- Clean KPI cards showing 0 values (ready for your data)
- Modern, professional design
- Responsive layout

### Lead Management
- Empty lead list (ready for new leads)
- Complete CRM functionality
- Search and filter capabilities

### Navigation
- Clean sidebar with all modules
- No dummy badges or notifications
- Professional branding

## 📊 Adding Your First Data

### Add a Lead
1. Go to "Lead Management" in the sidebar
2. Click "Add New Lead" button
3. Fill in the lead information
4. Save and see it appear in the list

### Add a Parent
1. Go to Supabase dashboard
2. Navigate to Table Editor
3. Select "parents" table
4. Click "Insert" and add parent details

### Add a Student
1. In Supabase Table Editor
2. Select "students" table
3. Click "Insert" and add student details
4. Link to parent using parent_id

### Add a Teacher
1. In Supabase Table Editor
2. Select "teachers" table
3. Add teacher information

### Add a Class
1. In Supabase Table Editor
2. Select "classes" table
3. Add class details and link to teacher

## 🎯 Key Features Ready to Use

### ✅ Fully Functional
- Lead Management System
- Database Integration
- Real-time KPI Updates
- Professional UI/UX
- Responsive Design
- Search & Filtering

### 🚧 Coming Soon
- Student Profile Management
- Class Scheduling
- Attendance Tracking
- Fee Management
- Parent Communication
- Reports & Analytics

## 🔧 Customization

### Colors & Branding
- Edit `tailwind.config.js` for color scheme
- Update logo in `Sidebar.tsx`
- Modify company name in sidebar

### Database Schema
- All tables are ready to use
- Add custom fields as needed
- Extend with additional tables

### Features
- Add new menu items in `Sidebar.tsx`
- Create new components in `src/components/`
- Extend data service in `src/services/dataService.ts`

## 📱 Mobile Ready
The application is fully responsive and works great on:
- Desktop computers
- Tablets
- Mobile phones

## 🔒 Security
- Row Level Security enabled
- All operations require authentication
- Secure API endpoints
- Data validation

## 🆘 Need Help?
1. Check the main README.md for detailed documentation
2. Review the database schema in `database/clean-schema.sql`
3. Look at the data service methods in `src/services/dataService.ts`
4. All components are well-documented with TypeScript

## 🎉 You're Ready!
Your student management system is now ready to use. Start by adding your first lead or student and watch the dashboard come to life!
