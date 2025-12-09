import type { Fee } from '../lib/supabase';

export interface WhatsAppMessageData {
  studentName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  phoneNumber: string;
  courses?: string[];
  lastPaymentDate?: string;
}

export class WhatsAppService {
  /**
   * Format phone number for WhatsApp (Qatar format)
   */
  static formatPhoneForWhatsApp(phone: string): string {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    // If phone starts with +974 or 974, use as is
    if (cleanPhone.startsWith('974')) {
      return cleanPhone;
    }

    // If phone doesn't start with country code, add Qatar country code
    if (cleanPhone.length === 8) {
      return `974${cleanPhone}`;
    }

    return cleanPhone;
  }

  /**
   * Get the best phone number for a student (parent first, then student)
   */
  static getContactPhone(student: any): string | null {
    // Try parent phone first
    if (student.parent?.phone) {
      return student.parent.phone;
    }

    // Fallback to student phone
    if (student.phone) {
      return student.phone;
    }

    return null;
  }

  /**
   * Create a professional WhatsApp message for fee reminders
   */
  static createFeeReminderMessage(data: WhatsAppMessageData): string {
    const {
      studentName,
      totalAmount,
      paidAmount,
      remainingAmount,
      dueDate,
      courses = [],
      lastPaymentDate
    } = data;

    const coursesText = courses.length > 0 
      ? courses.join(', ')
      : 'Course fees';

    const lastPaymentText = lastPaymentDate 
      ? `\n📅 *Last Payment:* ${new Date(lastPaymentDate).toLocaleDateString()}`
      : '';

    const message = `🎓 *Fee Reminder - Student Management System*

👤 *Student:* ${studentName}
📚 *Course(s):* ${coursesText}

💰 *Fee Details:*
• Total Amount: QAR ${totalAmount.toLocaleString()}
• Paid Amount: QAR ${paidAmount.toLocaleString()}
• *Remaining Balance: QAR ${remainingAmount.toLocaleString()}*

📅 *Due Date:* ${new Date(dueDate).toLocaleDateString()}${lastPaymentText}

💳 *Payment Instructions:*
Please make your payment at the earliest convenience. You can visit our office or contact us for payment options.

📞 *Contact:* For any queries, please contact the administration office.

*Best regards,*
*Student Management Team*`;

    return message;
  }

  /**
   * Send WhatsApp message by opening WhatsApp Web/App
   */
  static async sendWhatsAppMessage(phoneNumber: string, message: string): Promise<void> {
    try {
      const formattedPhone = this.formatPhoneForWhatsApp(phoneNumber);
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      throw new Error('Failed to open WhatsApp');
    }
  }

  /**
   * Send fee reminder via WhatsApp for a specific fee record
   */
  static async sendFeeReminder(fee: Fee): Promise<void> {
    try {
      const phoneNumber = this.getContactPhone(fee.student);
      
      if (!phoneNumber) {
        throw new Error(`No phone number found for ${fee.student?.first_name} ${fee.student?.last_name}`);
      }

      // Prepare message data
      const messageData: WhatsAppMessageData = {
        studentName: `${fee.student?.first_name} ${fee.student?.last_name}`,
        totalAmount: fee.amount || 0,
        paidAmount: fee.paid_amount || 0,
        remainingAmount: Math.max(0, (fee.amount || 0) - (fee.paid_amount || 0)),
        dueDate: fee.due_date,
        phoneNumber,
        courses: fee.courses ? fee.courses.map(c => c.name) : [fee.course?.name || 'Course'],
        lastPaymentDate: fee.paid_date
      };

      const message = this.createFeeReminderMessage(messageData);
      await this.sendWhatsAppMessage(phoneNumber, message);
      
      return;
    } catch (error) {
      console.error('Error sending WhatsApp fee reminder:', error);
      throw error;
    }
  }

  /**
   * Send bulk WhatsApp reminders with delays
   */
  static async sendBulkFeeReminders(fees: Fee[], delayMs: number = 1000): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < fees.length; i++) {
      try {
        // Add delay between messages (except for the first one)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        await this.sendFeeReminder(fees[i]);
        sent++;
      } catch (error) {
        console.error(`Failed to send WhatsApp reminder for fee ${fees[i].id}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * Validate if a phone number is valid for WhatsApp
   */
  static isValidPhoneNumber(phone: string): boolean {
    if (!phone) return false;
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid Qatar number (8 digits) or international format
    return cleanPhone.length >= 8 && cleanPhone.length <= 15;
  }
}
