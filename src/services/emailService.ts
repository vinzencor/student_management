import { supabase } from '../lib/supabase';

export class EmailService {
  // In a real application, you would integrate with an email service like:
  // - SendGrid
  // - Mailgun
  // - AWS SES
  // - Nodemailer with SMTP
  
  static async sendFeeReminder(studentId: string, feeId: string) {
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

      if (studentError) throw studentError;

      // Get fee information
      const { data: fee, error: feeError } = await supabase
        .from('fees')
        .select('*')
        .eq('id', feeId)
        .single();

      if (feeError) throw feeError;

      // Prepare email content
      const emailContent = this.generateFeeReminderEmail(student, fee);
      
      // In a real application, you would send the email here
      // For demo purposes, we'll log the communication and show a success message
      
      // Log the communication
      await this.logCommunication({
        student_id: studentId,
        type: 'email',
        subject: emailContent.subject,
        message: emailContent.body,
        recipient: student.parent?.email || student.email,
        status: 'sent'
      });

      return { success: true, message: 'Fee reminder sent successfully' };
    } catch (error) {
      console.error('Error sending fee reminder:', error);
      throw new Error('Failed to send fee reminder');
    }
  }

  static async sendBulkFeeReminders(feeIds: string[]) {
    try {
      const results = [];
      
      for (const feeId of feeIds) {
        // Get fee with student information
        const { data: fee, error } = await supabase
          .from('fees')
          .select(`
            *,
            student:students(
              *,
              parent:parents(*)
            )
          `)
          .eq('id', feeId)
          .single();

        if (error) {
          results.push({ feeId, success: false, error: error.message });
          continue;
        }

        try {
          await this.sendFeeReminder(fee.student_id, feeId);
          results.push({ feeId, success: true });
        } catch (error: any) {
          results.push({ feeId, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      return {
        success: true,
        message: `${successCount} of ${feeIds.length} reminders sent successfully`,
        results
      };
    } catch (error) {
      console.error('Error sending bulk fee reminders:', error);
      throw new Error('Failed to send bulk fee reminders');
    }
  }

  private static generateFeeReminderEmail(student: any, fee: any) {
    const studentName = `${student.first_name} ${student.last_name}`;
    const parentName = student.parent ? `${student.parent.first_name} ${student.parent.last_name}` : 'Parent/Guardian';
    const dueDate = new Date(fee.due_date).toLocaleDateString();
    const amount = fee.amount.toFixed(2);

    const subject = `Fee Reminder - ${fee.fee_type} for ${studentName}`;
    
    const body = `
Dear ${parentName},

This is a friendly reminder that a fee payment is due for ${studentName}.

Fee Details:
- Type: ${fee.fee_type.charAt(0).toUpperCase() + fee.fee_type.slice(1)} Fee
- Amount: $${amount}
- Due Date: ${dueDate}
- Student: ${studentName} (${student.grade_level})

${fee.description ? `Description: ${fee.description}` : ''}

Please ensure the payment is made by the due date to avoid any late fees.

If you have already made the payment, please disregard this reminder. If you have any questions or need assistance with the payment, please contact our office.

Thank you for your attention to this matter.

Best regards,
EduCare Administration Team

---
This is an automated message from the EduCare Student Management System.
    `.trim();

    return { subject, body };
  }

  private static async logCommunication(communication: {
    student_id: string;
    type: 'email' | 'sms' | 'whatsapp';
    subject: string;
    message: string;
    recipient: string;
    status: 'sent' | 'failed' | 'pending';
  }) {
    try {
      const { error } = await supabase
        .from('communications')
        .insert(communication);

      if (error) throw error;
    } catch (error) {
      console.error('Error logging communication:', error);
      // Don't throw here as it's not critical for the main operation
    }
  }

  static async getEmailTemplates() {
    // In a real application, you might store email templates in the database
    return {
      feeReminder: {
        subject: 'Fee Payment Reminder - {{studentName}}',
        body: `Dear {{parentName}},

This is a reminder that a fee payment is due for {{studentName}}.

Fee Details:
- Type: {{feeType}}
- Amount: ${{amount}}
- Due Date: {{dueDate}}

Please make the payment by the due date.

Best regards,
EduCare Team`
      },
      feeOverdue: {
        subject: 'Overdue Fee Payment - {{studentName}}',
        body: `Dear {{parentName}},

This is to inform you that a fee payment for {{studentName}} is now overdue.

Fee Details:
- Type: {{feeType}}
- Amount: ${{amount}}
- Due Date: {{dueDate}}
- Days Overdue: {{daysOverdue}}

Please make the payment immediately to avoid additional charges.

Best regards,
EduCare Team`
      }
    };
  }

  static async scheduleAutomaticReminders() {
    try {
      // Get all pending and overdue fees
      const { data: fees, error } = await supabase
        .from('fees')
        .select(`
          *,
          student:students(
            *,
            parent:parents(*)
          )
        `)
        .in('status', ['pending', 'overdue']);

      if (error) throw error;

      const today = new Date();
      const remindersToSend = [];

      for (const fee of fees || []) {
        const dueDate = new Date(fee.due_date);
        const daysDifference = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

        // Send reminder 7 days before due date, 1 day before, and every 3 days after overdue
        if (daysDifference === 7 || daysDifference === 1 || (daysDifference < 0 && Math.abs(daysDifference) % 3 === 0)) {
          remindersToSend.push(fee.id);
        }
      }

      if (remindersToSend.length > 0) {
        return await this.sendBulkFeeReminders(remindersToSend);
      }

      return { success: true, message: 'No reminders to send at this time' };
    } catch (error) {
      console.error('Error scheduling automatic reminders:', error);
      throw new Error('Failed to schedule automatic reminders');
    }
  }
}
