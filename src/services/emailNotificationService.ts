import { supabase } from '../lib/supabase';

export interface EmailReminderRequest {
  type: 'enrollment_reminder' | 'monthly_reminder' | 'attendance_reminder';
  studentId: string;
  parentEmail?: string;
  studentEmail?: string;
  attendanceDays?: number;
}

export interface EmailReminderResponse {
  success: boolean;
  emailId?: string;
  paymentLink?: string;
  error?: string;
}

export interface EmailReminderRecord {
  id: string;
  student_id: string;
  reminder_type: string;
  sent_at: string;
  recipient_email: string;
  status: 'sent' | 'failed' | 'bounced';
  email_id?: string;
}

export class EmailNotificationService {
  
  /**
   * Send a fee reminder email using Supabase Edge Function
   */
  static async sendFeeReminder(request: EmailReminderRequest): Promise<EmailReminderResponse> {
    try {
      console.log('Sending fee reminder:', request);

      const { data, error } = await supabase.functions.invoke('send-fee-reminder', {
        body: request
      });

      if (error) {
        console.error('Error sending fee reminder:', error);
        return { success: false, error: error.message || 'Failed to send email' };
      }

      console.log('Fee reminder response:', data);
      return data || { success: true };
    } catch (error: any) {
      console.error('Error invoking fee reminder function:', error);
      return { success: false, error: error.message || 'Failed to send email reminder' };
    }
  }

  /**
   * Check and send attendance-based reminders
   */
  static async checkAttendanceReminders(): Promise<any> {
    try {
      console.log('Checking attendance reminders...');

      const { data, error } = await supabase.functions.invoke('check-attendance-reminders');

      if (error) {
        console.error('Error checking attendance reminders:', error);
        return { success: false, error: error.message || 'Failed to check attendance reminders' };
      }

      console.log('Attendance reminders response:', data);
      return data || { success: true, emailsSent: 0 };
    } catch (error: any) {
      console.error('Error invoking attendance reminders function:', error);
      return { success: false, error: error.message || 'Failed to check attendance reminders' };
    }
  }

  /**
   * Send monthly fee reminders to all students
   */
  static async sendMonthlyReminders(): Promise<any> {
    try {
      console.log('Sending monthly reminders...');

      const { data, error } = await supabase.functions.invoke('monthly-fee-reminders');

      if (error) {
        console.error('Error sending monthly reminders:', error);
        return { success: false, error: error.message || 'Failed to send monthly reminders' };
      }

      console.log('Monthly reminders response:', data);
      return data || { success: true, emailsSent: 0 };
    } catch (error: any) {
      console.error('Error invoking monthly reminders function:', error);
      return { success: false, error: error.message || 'Failed to send monthly reminders' };
    }
  }

  /**
   * Get email reminder history for a student
   */
  static async getStudentEmailHistory(studentId: string): Promise<EmailReminderRecord[]> {
    try {
      const { data, error } = await supabase
        .from('email_reminders')
        .select('*')
        .eq('student_id', studentId)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('Error fetching email history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting student email history:', error);
      return [];
    }
  }

  /**
   * Get all email reminders with student information
   */
  static async getAllEmailReminders(limit: number = 50): Promise<any[]> {
    try {
      // First, get email reminders
      const { data: reminders, error: remindersError } = await supabase
        .from('email_reminders')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (remindersError) {
        console.error('Error fetching email reminders:', remindersError);
        return [];
      }

      if (!reminders || reminders.length === 0) {
        return [];
      }

      // Get student IDs
      const studentIds = reminders.map(r => r.student_id).filter(Boolean);

      if (studentIds.length === 0) {
        return reminders;
      }

      // Get student information separately
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          grade_level,
          parent:parents(
            first_name,
            last_name,
            email
          )
        `)
        .in('id', studentIds);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        return reminders; // Return reminders without student info
      }

      // Combine the data
      const combinedData = reminders.map(reminder => {
        const student = students?.find(s => s.id === reminder.student_id);
        return {
          ...reminder,
          student: student || null
        };
      });

      return combinedData;
    } catch (error) {
      console.error('Error getting all email reminders:', error);
      return [];
    }
  }

  /**
   * Get email reminder statistics
   */
  static async getEmailReminderStats(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('email_reminders_summary')
        .select('*')
        .order('sent_date', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching email reminder stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting email reminder stats:', error);
      return null;
    }
  }

  /**
   * Manually trigger enrollment reminders for students enrolled 8 days ago
   */
  static async triggerEnrollmentReminders(): Promise<any> {
    try {
      // Get students enrolled exactly 8 days ago
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      const enrollmentDate = eightDaysAgo.toISOString().split('T')[0];

      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          parent:parents(*)
        `)
        .eq('enrollment_date', enrollmentDate)
        .eq('status', 'active');

      if (studentsError) {
        console.error('Error fetching students for enrollment reminders:', studentsError);
        return { success: false, error: studentsError.message };
      }

      const results = [];

      for (const student of students || []) {
        // Check if reminder already sent
        const { data: existingReminder } = await supabase
          .from('email_reminders')
          .select('id')
          .eq('student_id', student.id)
          .eq('reminder_type', 'enrollment_8_days')
          .single();

        if (!existingReminder) {
          const result = await this.sendFeeReminder({
            type: 'enrollment_reminder',
            studentId: student.id,
            parentEmail: student.parent?.email,
            studentEmail: student.email
          });

          results.push({
            studentId: student.id,
            studentName: `${student.first_name} ${student.last_name}`,
            ...result
          });
        }
      }

      return {
        success: true,
        processedStudents: students?.length || 0,
        emailsSent: results.filter(r => r.success).length,
        results
      };
    } catch (error) {
      console.error('Error triggering enrollment reminders:', error);
      return { success: false, error: 'Failed to trigger enrollment reminders' };
    }
  }

  /**
   * Test all reminder systems
   */
  static async testAllReminders(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('test_all_reminder_jobs');

      if (error) {
        console.error('Error testing reminder jobs:', error);
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      console.error('Error testing all reminders:', error);
      return { success: false, error: 'Failed to test reminder systems' };
    }
  }

  /**
   * Get cron job status
   */
  static async getCronJobStatus(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_cron_job_status');

      if (error) {
        console.error('Error getting cron job status:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting cron job status:', error);
      return [];
    }
  }

  /**
   * Send manual reminder to specific student
   */
  static async sendManualReminder(
    studentId: string, 
    type: 'enrollment_reminder' | 'monthly_reminder' | 'attendance_reminder',
    attendanceDays?: number
  ): Promise<EmailReminderResponse> {
    try {
      // Get student and parent information
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          parent:parents(*)
        `)
        .eq('id', studentId)
        .single();

      if (studentError) {
        return { success: false, error: 'Student not found' };
      }

      return await this.sendFeeReminder({
        type,
        studentId,
        parentEmail: student.parent?.email,
        studentEmail: student.email,
        attendanceDays
      });
    } catch (error) {
      console.error('Error sending manual reminder:', error);
      return { success: false, error: 'Failed to send manual reminder' };
    }
  }
}
