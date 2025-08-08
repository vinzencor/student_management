-- Student Management System Database Schema
-- Run this in your Supabase SQL Editor

-- Note: JWT secret is automatically managed by Supabase

-- Create Parents table
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  occupation VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  grade_level VARCHAR(20) NOT NULL,
  date_of_birth DATE,
  address TEXT,
  parent_id UUID REFERENCES parents(id),
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  subjects TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Staff table (replaces Teachers table with role-based system)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'office_staff', 'accountant', 'super_admin')),
  subjects TEXT[] DEFAULT '{}', -- Only for teachers
  qualification VARCHAR(200),
  experience_years INTEGER DEFAULT 0,
  salary DECIMAL(10,2),
  hire_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Role Permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(20) NOT NULL,
  permission VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, permission)
);

-- Create Salary Records table for tracking salary payments
CREATE TABLE IF NOT EXISTS salary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque')),
  month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  status VARCHAR(20) DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Staff Sessions table for tracking login sessions
CREATE TABLE IF NOT EXISTS staff_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logout_time TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  grade_level VARCHAR(20) NOT NULL,
  teacher_id UUID REFERENCES teachers(id),
  schedule JSONB NOT NULL DEFAULT '[]',
  max_students INTEGER DEFAULT 30,
  current_students INTEGER DEFAULT 0,
  fee_per_month DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  source VARCHAR(50) DEFAULT 'other' CHECK (source IN ('website', 'referral', 'social_media', 'walk_in', 'other')),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'converted', 'lost')),
  grade_level VARCHAR(20),
  subjects_interested TEXT[] DEFAULT '{}',
  assigned_counselor VARCHAR(100),
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id, date)
);

-- Create Fees table
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  class_id UUID REFERENCES classes(id),
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'upi')),
  receipt_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Performance table
CREATE TABLE IF NOT EXISTS performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  test_name VARCHAR(200) NOT NULL,
  test_date DATE NOT NULL,
  marks_obtained INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  grade VARCHAR(5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Communications table
CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('student', 'parent', 'teacher')),
  recipient_id UUID NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('sms', 'email', 'whatsapp')),
  subject VARCHAR(200),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Worksheets table
CREATE TABLE IF NOT EXISTS worksheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  shared_with UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Student-Class junction table
CREATE TABLE IF NOT EXISTS student_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);
CREATE INDEX IF NOT EXISTS idx_fees_due_date ON fees(due_date);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_performance_student_id ON performance(student_id);
CREATE INDEX IF NOT EXISTS idx_communications_recipient ON communications(recipient_type, recipient_id);

-- Staff table indexes
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_salary_records_staff_id ON salary_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_month_year ON salary_records(month_year);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_staff_id ON staff_sessions(staff_id);

-- Insert default role permissions
INSERT INTO role_permissions (role, permission) VALUES
-- Super Admin permissions (full access)
('super_admin', 'view_dashboard'),
('super_admin', 'manage_staff'),
('super_admin', 'manage_students'),
('super_admin', 'manage_leads'),
('super_admin', 'manage_classes'),
('super_admin', 'manage_fees'),
('super_admin', 'view_reports'),
('super_admin', 'export_data'),
('super_admin', 'manage_settings'),
('super_admin', 'view_all_reports'),
('super_admin', 'manage_salaries'),

-- Teacher permissions
('teacher', 'view_dashboard'),
('teacher', 'view_students'),
('teacher', 'view_student_details'),
('teacher', 'view_student_fees'),
('teacher', 'view_student_reports'),
('teacher', 'mark_attendance'),
('teacher', 'add_performance'),
('teacher', 'view_classes'),

-- Office Staff permissions
('office_staff', 'view_dashboard'),
('office_staff', 'manage_students'),
('office_staff', 'manage_leads'),
('office_staff', 'view_reports'),
('office_staff', 'manage_communications'),

-- Accountant permissions
('accountant', 'view_dashboard'),
('accountant', 'manage_fees'),
('accountant', 'view_financial_reports'),
('accountant', 'manage_salaries'),
('accountant', 'view_money_flow'),
('accountant', 'export_financial_data');

-- Enable Row Level Security
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - you may want to customize these)
CREATE POLICY "Enable read access for all users" ON parents FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON parents FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON parents FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON students FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON students FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON staff FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON staff FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON role_permissions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON salary_records FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON salary_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON salary_records FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON staff_sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON staff_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON classes FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON classes FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON leads FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON leads FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON attendance FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON attendance FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON fees FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON fees FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON fees FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON performance FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON performance FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON performance FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON communications FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON communications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON communications FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON worksheets FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON worksheets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON worksheets FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON student_classes FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON student_classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON student_classes FOR UPDATE USING (true);

-- Insert sample data
-- Sample Parents
INSERT INTO parents (first_name, last_name, email, phone, address, occupation) VALUES
('Rajesh', 'Kumar', 'rajesh.kumar@email.com', '+91-9876543210', '123 MG Road, Mumbai', 'Software Engineer'),
('Priya', 'Sharma', 'priya.sharma@email.com', '+91-9876543211', '456 Park Street, Delhi', 'Doctor'),
('Amit', 'Patel', 'amit.patel@email.com', '+91-9876543212', '789 Brigade Road, Bangalore', 'Business Owner'),
('Sunita', 'Singh', 'sunita.singh@email.com', '+91-9876543213', '321 Anna Salai, Chennai', 'Teacher'),
('Vikram', 'Gupta', 'vikram.gupta@email.com', '+91-9876543214', '654 FC Road, Pune', 'Accountant');

-- Sample Teachers
INSERT INTO teachers (first_name, last_name, email, phone, subjects, qualification, experience_years, salary) VALUES
('Dr. Meera', 'Joshi', 'meera.joshi@school.com', '+91-9876543220', ARRAY['Mathematics', 'Physics'], 'M.Sc Physics, B.Ed', 8, 45000),
('Prof. Arjun', 'Nair', 'arjun.nair@school.com', '+91-9876543221', ARRAY['English', 'Literature'], 'M.A English, B.Ed', 12, 50000),
('Ms. Kavya', 'Reddy', 'kavya.reddy@school.com', '+91-9876543222', ARRAY['Chemistry', 'Biology'], 'M.Sc Chemistry, B.Ed', 6, 42000),
('Mr. Rohit', 'Agarwal', 'rohit.agarwal@school.com', '+91-9876543223', ARRAY['History', 'Geography'], 'M.A History, B.Ed', 10, 48000),
('Dr. Anita', 'Desai', 'anita.desai@school.com', '+91-9876543224', ARRAY['Computer Science'], 'M.Tech CSE, Ph.D', 15, 60000);

-- Sample Classes
INSERT INTO classes (name, subject, grade_level, teacher_id, schedule, max_students, fee_per_month) VALUES
('Advanced Mathematics 10th', 'Mathematics', '10th', (SELECT id FROM teachers WHERE email = 'meera.joshi@school.com'), '[{"day": "Monday", "start_time": "09:00", "end_time": "10:30"}, {"day": "Wednesday", "start_time": "09:00", "end_time": "10:30"}, {"day": "Friday", "start_time": "09:00", "end_time": "10:30"}]', 25, 3500),
('English Literature 12th', 'English', '12th', (SELECT id FROM teachers WHERE email = 'arjun.nair@school.com'), '[{"day": "Tuesday", "start_time": "10:00", "end_time": "11:30"}, {"day": "Thursday", "start_time": "10:00", "end_time": "11:30"}]', 30, 3000),
('Chemistry Fundamentals 11th', 'Chemistry', '11th', (SELECT id FROM teachers WHERE email = 'kavya.reddy@school.com'), '[{"day": "Monday", "start_time": "11:00", "end_time": "12:30"}, {"day": "Wednesday", "start_time": "11:00", "end_time": "12:30"}]', 20, 4000),
('World History 9th', 'History', '9th', (SELECT id FROM teachers WHERE email = 'rohit.agarwal@school.com'), '[{"day": "Tuesday", "start_time": "14:00", "end_time": "15:30"}, {"day": "Friday", "start_time": "14:00", "end_time": "15:30"}]', 35, 2800),
('Programming Basics 12th', 'Computer Science', '12th', (SELECT id FROM teachers WHERE email = 'anita.desai@school.com'), '[{"day": "Monday", "start_time": "15:00", "end_time": "16:30"}, {"day": "Thursday", "start_time": "15:00", "end_time": "16:30"}]', 15, 5000);

-- Sample Students
INSERT INTO students (first_name, last_name, email, phone, grade_level, date_of_birth, parent_id, subjects) VALUES
('Aarav', 'Kumar', 'aarav.kumar@student.com', '+91-9876543230', '10th', '2008-05-15', (SELECT id FROM parents WHERE email = 'rajesh.kumar@email.com'), ARRAY['Mathematics', 'Physics', 'Chemistry']),
('Diya', 'Sharma', 'diya.sharma@student.com', '+91-9876543231', '12th', '2006-08-22', (SELECT id FROM parents WHERE email = 'priya.sharma@email.com'), ARRAY['English', 'History', 'Psychology']),
('Aryan', 'Patel', 'aryan.patel@student.com', '+91-9876543232', '11th', '2007-12-10', (SELECT id FROM parents WHERE email = 'amit.patel@email.com'), ARRAY['Chemistry', 'Biology', 'Mathematics']),
('Ananya', 'Singh', 'ananya.singh@student.com', '+91-9876543233', '9th', '2009-03-18', (SELECT id FROM parents WHERE email = 'sunita.singh@email.com'), ARRAY['History', 'Geography', 'English']),
('Karan', 'Gupta', 'karan.gupta@student.com', '+91-9876543234', '12th', '2006-11-05', (SELECT id FROM parents WHERE email = 'vikram.gupta@email.com'), ARRAY['Computer Science', 'Mathematics', 'Physics']);

-- Sample Leads
INSERT INTO leads (first_name, last_name, email, phone, source, status, grade_level, subjects_interested, assigned_counselor, notes) VALUES
('Ravi', 'Mehta', 'ravi.mehta@email.com', '+91-9876543240', 'website', 'new', '10th', ARRAY['Mathematics', 'Science'], 'Sarah Johnson', 'Interested in weekend batches'),
('Pooja', 'Jain', 'pooja.jain@email.com', '+91-9876543241', 'referral', 'contacted', '12th', ARRAY['English', 'Commerce'], 'Mike Wilson', 'Parent wants demo class'),
('Siddharth', 'Rao', 'siddharth.rao@email.com', '+91-9876543242', 'social_media', 'interested', '11th', ARRAY['Physics', 'Chemistry'], 'Sarah Johnson', 'Looking for JEE preparation'),
('Neha', 'Agarwal', 'neha.agarwal@email.com', '+91-9876543243', 'walk_in', 'converted', '9th', ARRAY['Mathematics', 'English'], 'Mike Wilson', 'Enrolled in Mathematics batch'),
('Rohit', 'Bansal', 'rohit.bansal@email.com', '+91-9876543244', 'referral', 'lost', '12th', ARRAY['Computer Science'], 'Sarah Johnson', 'Joined competitor institute');

-- Sample Fees (some pending, some paid)
INSERT INTO fees (student_id, class_id, amount, due_date, paid_date, status, payment_method, receipt_number) VALUES
((SELECT id FROM students WHERE email = 'aarav.kumar@student.com'), (SELECT id FROM classes WHERE name = 'Advanced Mathematics 10th'), 3500, '2024-01-01', '2023-12-28', 'paid', 'upi', 'RCP001'),
((SELECT id FROM students WHERE email = 'diya.sharma@student.com'), (SELECT id FROM classes WHERE name = 'English Literature 12th'), 3000, '2024-01-01', '2024-01-02', 'paid', 'card', 'RCP002'),
((SELECT id FROM students WHERE email = 'aryan.patel@student.com'), (SELECT id FROM classes WHERE name = 'Chemistry Fundamentals 11th'), 4000, '2024-01-01', NULL, 'pending', NULL, NULL),
((SELECT id FROM students WHERE email = 'ananya.singh@student.com'), (SELECT id FROM classes WHERE name = 'World History 9th'), 2800, '2024-01-01', NULL, 'overdue', NULL, NULL),
((SELECT id FROM students WHERE email = 'karan.gupta@student.com'), (SELECT id FROM classes WHERE name = 'Programming Basics 12th'), 5000, '2024-01-01', '2023-12-30', 'paid', 'bank_transfer', 'RCP003');
