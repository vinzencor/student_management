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
  max_students: number
  current_students: number
  fee_per_month: number
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Teacher {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  subjects: string[]
  qualification: string
  experience_years: number
  salary: number
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
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
  due_date: string
  paid_date?: string
  status: 'pending' | 'paid' | 'overdue' | 'partial'
  payment_method?: 'cash' | 'card' | 'bank_transfer' | 'upi'
  receipt_number?: string
  notes?: string
  created_at: string
  updated_at: string
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
