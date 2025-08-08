import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jwqxbevszjlbistvrejv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3cXhiZXZzempsYmlzdHZyZWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQ1MzQsImV4cCI6MjA3MDA1MDUzNH0.OMQPuZOj1NkwkzC-tmP6k0iLc5-sntmQtk1zfs_2Cnk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Student {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  grade_level: string
  date_of_birth?: string
  address?: string
  parent_id?: string
  enrollment_date: string
  status: 'active' | 'inactive' | 'graduated'
  subjects: string[]
  created_at: string
  updated_at: string
}

export interface Parent {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address?: string
  occupation?: string
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone: string
  source: 'website' | 'referral' | 'social_media' | 'walk_in' | 'other'
  status: 'new' | 'contacted' | 'interested' | 'converted' | 'lost'
  grade_level?: string
  subjects_interested: string[]
  assigned_counselor?: string
  notes?: string
  follow_up_date?: string
  created_at: string
  updated_at: string
}

export interface Class {
  id: string
  name: string
  subject: string
  grade_level: string
  teacher_id?: string
  schedule: {
    day: string
    start_time: string
    end_time: string
  }[]
  day_of_week?: string
  start_time?: string
  end_time?: string
  room?: string
  max_students: number
  current_students: number
  fee_per_month: number
  description?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Staff {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  role: 'teacher' | 'office_staff' | 'accountant' | 'super_admin'
  subjects?: string[]
  qualification?: string
  experience_years: number
  salary?: number
  hire_date: string
  status: 'active' | 'inactive' | 'terminated'
  created_at: string
  updated_at: string
}

export interface RolePermission {
  id: string
  role: string
  permission: string
  created_at: string
}

export interface SalaryRecord {
  id: string
  staff_id: string
  amount: number
  payment_date: string
  payment_method?: 'cash' | 'bank_transfer' | 'cheque'
  month_year: string
  status: 'paid' | 'pending' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

export interface StaffSession {
  id: string
  staff_id: string
  login_time: string
  logout_time?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

// Keep Teacher interface for backward compatibility
export interface Teacher extends Staff {
  role: 'teacher'
}

export interface Attendance {
  id: string
  student_id: string
  class_id: string
  date: string
  status: 'present' | 'absent' | 'late'
  notes?: string
  created_at: string
}

export interface Fee {
  id: string
  student_id: string
  class_id?: string
  amount: number
  paid_amount?: number
  remaining_amount?: number
  due_date: string
  paid_date?: string
  status: 'pending' | 'paid' | 'overdue' | 'partial'
  payment_method?: 'cash' | 'card' | 'bank_transfer' | 'upi'
  receipt_number?: string
  fee_type: 'tuition' | 'registration' | 'exam' | 'library' | 'lab' | 'transport' | 'other'
  description?: string
  notes?: string
  created_at: string
  updated_at: string
  student?: any
}

export interface Performance {
  id: string
  student_id: string
  class_id: string
  test_name: string
  test_date: string
  marks_obtained: number
  total_marks: number
  grade: string
  feedback?: string
  created_at: string
}

export interface Communication {
  id: string
  recipient_type: 'student' | 'parent' | 'teacher'
  recipient_id: string
  type: 'sms' | 'email' | 'whatsapp'
  subject?: string
  message: string
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  scheduled_at?: string
  sent_at?: string
  created_at: string
}

export interface Worksheet {
  id: string
  class_id: string
  title: string
  description?: string
  file_url: string
  file_name: string
  file_size: number
  uploaded_by: string
  shared_with: string[]
  created_at: string
}

// Receipts for converted leads/enrollments
export interface Receipt {
  id: string
  lead_id: string
  student_id?: string
  parent_id?: string
  amount: number
  tax_rate?: number // e.g., 0.18 for 18%
  tax_amount?: number
  total_amount: number
  currency?: string
  notes?: string
  status: 'draft' | 'ready' | 'printed'
  created_at: string
  updated_at: string
}

// Accounting auxiliary
export interface Liability {
  id: string
  title: string
  amount: number
  due_date?: string
  status: 'open' | 'closed'
  notes?: string
  created_at: string
  updated_at: string
}

export interface FeeStructure {
  id: string
  name: string
  base_amount: number
  default_tax_rate?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface FundTransaction {
  id: string
  type: 'income' | 'outgoing'
  amount: number
  date: string
  category?: string
  description?: string
  created_at: string
}

export interface Plan {
  id: string
  name: string
  description?: string
  status: 'planned' | 'active' | 'completed' | 'cancelled'
  start_date?: string
  end_date?: string
  budget?: number
  created_at: string
  updated_at: string
}
