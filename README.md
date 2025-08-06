# EduCare - Student Management System

A comprehensive student management system built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### ✅ Completed Features
- **Modern UI Design**: Clean, professional interface with improved typography and color scheme
- **Dashboard**: Real-time KPIs with animated counters
- **Lead Management**: Complete CRM for tracking inquiries and conversions
- **Supabase Integration**: Database setup with comprehensive schema
- **Responsive Design**: Mobile-first approach with smooth animations

### 🚧 In Development
- Student Profile Management
- Class & Schedule Management
- Attendance & Performance Tracking
- Fee Management System
- Parent Communication System
- Worksheet Sharing
- Task Automation
- Reports & Analytics

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Styling**: Custom design system with Tailwind CSS

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd student-management/project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase Database**

   a. Go to your Supabase dashboard: https://app.supabase.com

   b. Navigate to your project: https://supabase.com/dashboard/project/jwqxbevszjlbistvrejv

   c. Go to SQL Editor and run the clean schema file:
   ```sql
   -- Copy and paste the contents of database/clean-schema.sql
   ```

   d. The schema includes:
   - All necessary tables (students, parents, teachers, classes, leads, etc.)
   - No sample data - fresh start
   - Row Level Security policies
   - Proper indexes for performance
   - Automatic timestamp triggers

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5174`

## Database Schema

The system uses a comprehensive PostgreSQL schema with the following main tables:

- **parents**: Parent/guardian information
- **students**: Student profiles and academic data
- **teachers**: Teacher profiles and qualifications
- **classes**: Class schedules and details
- **leads**: Lead management and CRM data
- **attendance**: Daily attendance tracking
- **fees**: Fee management and payment tracking
- **performance**: Test scores and academic performance
- **communications**: SMS/Email/WhatsApp communication logs
- **worksheets**: File sharing and worksheet management
- **student_classes**: Many-to-many relationship between students and classes

## Project Structure

```
src/
├── components/           # React components
│   ├── dashboard/       # Dashboard-specific components
│   ├── Dashboard.tsx    # Main dashboard
│   ├── LeadManagement.tsx # Lead CRM system
│   ├── Sidebar.tsx      # Navigation sidebar
│   └── TopBar.tsx       # Top navigation bar
├── lib/                 # Configuration and types
│   └── supabase.ts      # Supabase client and types
├── services/            # Data access layer
│   └── dataService.ts   # API service methods
└── index.css           # Global styles and animations
```

## Key Features Implemented

### 1. Dashboard
- Real-time KPI cards with animated counters
- Modern gradient design with soft shadows
- Responsive grid layout
- Loading states and error handling

### 2. Lead Management
- Complete CRM functionality
- Lead status tracking (New → Contacted → Interested → Converted/Lost)
- Source tracking (Website, Referral, Social Media, Walk-in)
- Search and filtering capabilities
- Counselor assignment
- Follow-up date management

### 3. Design System
- Custom color palette with semantic naming
- Consistent spacing and typography
- Smooth animations and transitions
- Professional shadows and borders
- Mobile-responsive design

### 4. Database Integration
- Type-safe Supabase integration
- Comprehensive data service layer
- Row Level Security for data protection
- Optimized queries with proper indexing

## Environment Configuration

The Supabase configuration is currently hardcoded in `src/lib/supabase.ts`. For production, consider using environment variables:

```typescript
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY
```

## Development Roadmap

### Phase 1: Core Features (Current)
- ✅ UI/UX improvements
- ✅ Lead Management
- ✅ Database schema
- 🚧 Student Management

### Phase 2: Academic Features
- Class scheduling
- Attendance tracking
- Performance management
- Teacher assignment

### Phase 3: Communication & Automation
- Parent communication system
- Automated reminders
- Worksheet sharing
- Birthday wishes

### Phase 4: Analytics & Reporting
- Comprehensive reports
- Data visualization
- Export functionality
- Performance insights

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support and questions:
- Check the documentation
- Review the database schema
- Test with sample data
- Contact the development team

## License

This project is proprietary software for educational institutions.
