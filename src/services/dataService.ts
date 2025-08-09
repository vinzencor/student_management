import { supabase } from '../lib/supabase'
import type { Student, Parent, Lead, Class, Teacher, Staff, Attendance, Fee, Performance, Communication, Worksheet, SalaryRecord, StaffSession, RolePermission } from '../lib/supabase'

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

  static async getParentById(id: string) {
    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  static async findParentByEmail(email: string) {
    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .eq('email', email)
      .maybeSingle()
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

  static async updateParent(id: string, updates: Partial<Parent>) {
    const { data, error } = await supabase
      .from('parents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
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

  static async getLeadById(id: string) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()
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

  static async deleteLead(id: string) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)

    if (error) throw error
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

  static async updateClass(id: string, updates: Partial<Class>) {
    const { data, error } = await supabase
      .from('classes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
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

  // Class Management
  static async enrollStudentInClass(studentId: string, classId: string): Promise<any> {
    // First check if enrollment already exists
    const { data: existing } = await supabase
      .from('class_enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .single();

    if (existing) {
      throw new Error('Student is already enrolled in this class');
    }

    const { data, error } = await supabase
      .from('class_enrollments')
      .insert({
        student_id: studentId,
        class_id: classId,
        enrollment_date: new Date().toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getClassEnrollments(classId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .select(`
        *,
        student:students(id, first_name, last_name, email, grade_level)
      `)
      .eq('class_id', classId)
      .eq('status', 'active')
      .order('enrollment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async removeStudentFromClass(enrollmentId: string): Promise<void> {
    const { error } = await supabase
      .from('class_enrollments')
      .delete()
      .eq('id', enrollmentId);

    if (error) throw error;
  }

  // Attendance Management
  static async getAttendance(filters?: { start_date?: string; end_date?: string }): Promise<any[]> {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        student:students(id, first_name, last_name, email),
        staff:staff(id, first_name, last_name, email)
      `)
      .order('date', { ascending: false });

    if (filters?.start_date) {
      query = query.gte('date', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('date', filters.end_date);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getStaff(): Promise<any[]> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Transactions Management
  static async getTransactions(): Promise<any[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async addTransaction(transaction: any): Promise<any> {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTransaction(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
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

  // Staff Management
  static async getStaff(filters?: { role?: string; status?: string }) {
    let query = supabase
      .from('staff')
      .select('*')

    if (filters?.role) query = query.eq('role', filters.role)
    if (filters?.status) query = query.eq('status', filters.status)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async getStaffById(id: string) {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async getStaffByEmail(email: string) {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('email', email)
      .single()

    if (error) throw error
    return data
  }

  static async createStaff(staff: Omit<Staff, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('staff')
      .insert(staff)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async createStaffWithAuth(staff: Omit<Staff, 'id' | 'created_at' | 'updated_at'>, password: string) {
    try {
      // Try using the simple SQL function first (more reliable)
      const { data: functionData, error: functionError } = await supabase
        .rpc('create_staff_with_auth_simple', {
          p_email: staff.email,
          p_password: password,
          p_first_name: staff.first_name,
          p_last_name: staff.last_name,
          p_role: staff.role,
          p_phone: staff.phone || '+1234567890',
          p_qualification: staff.qualification || 'Not specified',
          p_experience_years: staff.experience_years || 0,
          p_salary: staff.salary,
          p_subjects: staff.subjects
        });

      if (functionError) {
        console.warn('SQL function failed, trying admin API:', functionError);

        // Fallback to admin API
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: staff.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            first_name: staff.first_name,
            last_name: staff.last_name,
            role: staff.role
          }
        });

        if (authError) {
          // If both methods fail, create staff record only
          console.warn('Both auth methods failed, creating staff record only:', authError);
          return await this.createStaff(staff);
        }

        // Create staff record with the auth user ID
        const staffWithId = {
          ...staff,
          id: authData.user.id
        };

        const { data, error } = await supabase
          .from('staff')
          .insert(staffWithId)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // If SQL function succeeded, get the created staff record
      const result = functionData;
      if (!result.success) {
        throw new Error(result.message);
      }

      // Fetch the created staff record
      const { data: staffRecord, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('id', result.user_id)
        .single();

      if (staffError) throw staffError;
      return staffRecord;
    } catch (error) {
      console.error('Error creating staff with auth:', error);
      throw error;
    }
  }

  static async updateStaff(id: string, updates: Partial<Staff>) {
    const { data, error } = await supabase
      .from('staff')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteStaff(id: string) {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Role Permissions
  static async getRolePermissions(role?: string) {
    let query = supabase
      .from('role_permissions')
      .select('*')

    if (role) query = query.eq('role', role)

    const { data, error } = await query.order('role', { ascending: true })

    if (error) throw error
    return data
  }

  static async createRolePermission(rolePermission: Omit<RolePermission, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('role_permissions')
      .insert(rolePermission)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteRolePermission(role: string, permission: string) {
    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role', role)
      .eq('permission', permission)

    if (error) throw error
  }

  // Salary Records
  static async getSalaryRecords(filters?: { staff_id?: string; month_year?: string; status?: string }) {
    let query = supabase
      .from('salary_records')
      .select(`
        *,
        staff:staff(*)
      `)

    if (filters?.staff_id) query = query.eq('staff_id', filters.staff_id)
    if (filters?.month_year) query = query.eq('month_year', filters.month_year)
    if (filters?.status) query = query.eq('status', filters.status)

    const { data, error } = await query.order('payment_date', { ascending: false })

    if (error) throw error
    return data
  }

  static async createSalaryRecord(salaryRecord: Omit<SalaryRecord, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('salary_records')
      .insert(salaryRecord)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateSalaryRecord(id: string, updates: Partial<SalaryRecord>) {
    const { data, error } = await supabase
      .from('salary_records')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteSalaryRecord(id: string) {
    const { error } = await supabase
      .from('salary_records')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Staff Sessions
  static async createStaffSession(session: Omit<StaffSession, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('staff_sessions')
      .insert(session)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateStaffSession(id: string, updates: Partial<StaffSession>) {
    const { data, error } = await supabase
      .from('staff_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getStaffSessions(staffId: string, limit?: number) {
    let query = supabase
      .from('staff_sessions')
      .select('*')
      .eq('staff_id', staffId)
      .order('login_time', { ascending: false })

    if (limit) query = query.limit(limit)

    const { data, error } = await query

    if (error) throw error
    return data
  }

  // Financial Reports for Accountants
  static async getFinancialSummary(dateRange?: { start: string; end: string }) {
    let feeQuery = supabase
      .from('fees')
      .select('amount, status, paid_date, created_at')

    let salaryQuery = supabase
      .from('salary_records')
      .select('amount, payment_date, status')

    if (dateRange) {
      feeQuery = feeQuery
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)

      salaryQuery = salaryQuery
        .gte('payment_date', dateRange.start)
        .lte('payment_date', dateRange.end)
    }

    const [feeResult, salaryResult] = await Promise.all([
      feeQuery,
      salaryQuery
    ])

    if (feeResult.error) throw feeResult.error
    if (salaryResult.error) throw salaryResult.error

    return {
      fees: feeResult.data,
      salaries: salaryResult.data
    }
  }

  // Student Reports for Teachers
  static async getStudentReport(studentId: string) {
    const [student, attendance, performance, fees] = await Promise.all([
      this.getStudentById(studentId),
      this.getAttendance({ student_id: studentId }),
      this.getPerformance({ student_id: studentId }),
      this.getFees({ student_id: studentId })
    ])

    return {
      student,
      attendance,
      performance,
      fees
    }
  }

  // Money Flow Report for Accountants
  static async getMoneyFlowReport(dateRange?: { start: string; end: string }) {
    const financialData = await this.getFinancialSummary(dateRange)

    const income = financialData.fees
      .filter(f => f.status === 'paid')
      .reduce((sum, f) => sum + f.amount, 0)

    const expenses = financialData.salaries
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + s.amount, 0)

    const pending = financialData.fees
      .filter(f => f.status === 'pending')
      .reduce((sum, f) => sum + f.amount, 0)

    return {
      income,
      expenses,
      pending,
      netFlow: income - expenses,
      feeDetails: financialData.fees,
      salaryDetails: financialData.salaries
    }
  }
}
