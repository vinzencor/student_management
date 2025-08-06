import { supabase } from '../lib/supabase'
import type { Student, Parent, Lead, Class, Teacher, Attendance, Fee, Performance, Communication, Worksheet } from '../lib/supabase'

export class DataService {
  // Students
  static async getStudents() {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        parent:parents(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async getStudentById(id: string) {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        parent:parents(*),
        student_classes(
          *,
          class:classes(*)
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async createStudent(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateStudent(id: string, updates: Partial<Student>) {
    const { data, error } = await supabase
      .from('students')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Parents
  static async getParents() {
    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createParent(parent: Omit<Parent, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('parents')
      .insert(parent)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Leads
  static async getLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateLead(id: string, updates: Partial<Lead>) {
    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Classes
  static async getClasses() {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        teacher:teachers(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createClass(classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('classes')
      .insert(classData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Teachers
  static async getTeachers() {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createTeacher(teacher: Omit<Teacher, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('teachers')
      .insert(teacher)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Attendance
  static async getAttendance(filters?: { student_id?: string; class_id?: string; date?: string }) {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        student:students(*),
        class:classes(*)
      `)
    
    if (filters?.student_id) query = query.eq('student_id', filters.student_id)
    if (filters?.class_id) query = query.eq('class_id', filters.class_id)
    if (filters?.date) query = query.eq('date', filters.date)
    
    const { data, error } = await query.order('date', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async markAttendance(attendance: Omit<Attendance, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(attendance, { onConflict: 'student_id,class_id,date' })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Fees
  static async getFees(filters?: { student_id?: string; status?: string }) {
    let query = supabase
      .from('fees')
      .select(`
        *,
        student:students(*),
        class:classes(*)
      `)
    
    if (filters?.student_id) query = query.eq('student_id', filters.student_id)
    if (filters?.status) query = query.eq('status', filters.status)
    
    const { data, error } = await query.order('due_date', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createFee(fee: Omit<Fee, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('fees')
      .insert(fee)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateFee(id: string, updates: Partial<Fee>) {
    const { data, error } = await supabase
      .from('fees')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Performance
  static async getPerformance(filters?: { student_id?: string; class_id?: string }) {
    let query = supabase
      .from('performance')
      .select(`
        *,
        student:students(*),
        class:classes(*)
      `)
    
    if (filters?.student_id) query = query.eq('student_id', filters.student_id)
    if (filters?.class_id) query = query.eq('class_id', filters.class_id)
    
    const { data, error } = await query.order('test_date', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async addPerformance(performance: Omit<Performance, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('performance')
      .insert(performance)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Dashboard KPIs
  static async getDashboardKPIs() {
    try {
      // Get total students count
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Get active leads count
      const { count: activeLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('status', ['new', 'contacted', 'interested'])

      // Get pending fees count
      const { count: pendingFees } = await supabase
        .from('fees')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'overdue'])

      // Get today's attendance percentage
      const today = new Date().toISOString().split('T')[0]
      const { count: totalAttendanceToday } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)

      const { count: presentToday } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .eq('status', 'present')

      const attendancePercentage = totalAttendanceToday && totalAttendanceToday > 0
        ? Math.round((presentToday || 0) / totalAttendanceToday * 100)
        : 0

      return {
        totalStudents: totalStudents || 0,
        activeLeads: activeLeads || 0,
        pendingFees: pendingFees || 0,
        attendancePercentage
      }
    } catch (error) {
      console.error('Error fetching dashboard KPIs:', error)
      // Return empty data for fresh start
      return {
        totalStudents: 0,
        activeLeads: 0,
        pendingFees: 0,
        attendancePercentage: 0
      }
    }
  }

  // Communications
  static async getCommunications() {
    const { data, error } = await supabase
      .from('communications')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async sendCommunication(communication: Omit<Communication, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('communications')
      .insert(communication)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
