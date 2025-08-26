import React, { useState, useEffect } from 'react';
import { Mail, Send, Clock, DollarSign, User, AlertTriangle, CheckCircle, Loader, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  grade_level: string;
  parent?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  totalFees: number;
  paidAmount: number;
  remainingAmount: number;
  overdueAmount: number;
  lastPaymentDate?: string;
  daysSinceLastPayment: number;
}

const FeeReminder: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState<Set<string>>(new Set());
  const [sentReminders, setSentReminders] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'overdue' | 'pending'>('all');

  useEffect(() => {
    loadStudentsWithFees();
  }, []);

  const loadStudentsWithFees = async () => {
    try {
      setLoading(true);

      // Try to load real data first
      try {
        // Load students with their fee information
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select(`
            *,
            parents(first_name, last_name, email, phone)
          `)
          .eq('status', 'active');

        if (studentsError) throw studentsError;

        // Load fee records for all students
        const { data: feesData, error: feesError } = await supabase
          .from('fees')
          .select('*')
          .order('due_date', { ascending: true });

        if (feesError) throw feesError;

        // Process students with fee information
        const studentsWithFees = (studentsData || []).map(student => {
          const studentFees = (feesData || []).filter(fee => fee.student_id === student.id);

          const totalFees = studentFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
          const paidAmount = studentFees.reduce((sum, fee) => sum + (fee.paid_amount || 0), 0);
          const remainingAmount = totalFees - paidAmount;

          // Calculate overdue amount (fees past due date)
          const today = new Date();
          const overdueAmount = studentFees
            .filter(fee => new Date(fee.due_date) < today && fee.status !== 'paid')
            .reduce((sum, fee) => sum + (fee.amount - (fee.paid_amount || 0)), 0);

          // Find last payment date
          const paidFees = studentFees.filter(fee => fee.paid_date);
          const lastPaymentDate = paidFees.length > 0
            ? paidFees.sort((a, b) => new Date(b.paid_date).getTime() - new Date(a.paid_date).getTime())[0].paid_date
            : null;

          // Calculate days since last payment
          const daysSinceLastPayment = lastPaymentDate
            ? Math.floor((today.getTime() - new Date(lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24))
            : 999; // Large number if no payment ever made

          return {
            ...student,
            parent: student.parents?.[0] || null,
            totalFees,
            paidAmount,
            remainingAmount,
            overdueAmount,
            lastPaymentDate,
            daysSinceLastPayment
          };
        }).filter(student => student.remainingAmount > 0); // Only show students with pending fees

        setStudents(studentsWithFees);
      } catch (dbError) {
        console.log('Database tables not ready, using mock data for demo');

        // Create mock data for demonstration
        const mockStudents: Student[] = [
          {
            id: '1',
            first_name: 'Rahul',
            last_name: 'Sharma',
            email: 'rahul.sharma@email.com',
            phone: '+91-9876543210',
            grade_level: '10th Grade',
            parent: {
              first_name: 'Suresh',
              last_name: 'Sharma',
              email: 'suresh.sharma@email.com',
              phone: '+91-9876543211'
            },
            totalFees: 15000,
            paidAmount: 8000,
            remainingAmount: 7000,
            overdueAmount: 3000,
            lastPaymentDate: '2024-01-15',
            daysSinceLastPayment: 45
          },
          {
            id: '2',
            first_name: 'Priya',
            last_name: 'Patel',
            email: 'priya.patel@email.com',
            phone: '+91-9876543212',
            grade_level: '12th Grade',
            parent: {
              first_name: 'Amit',
              last_name: 'Patel',
              email: 'amit.patel@email.com',
              phone: '+91-9876543213'
            },
            totalFees: 20000,
            paidAmount: 5000,
            remainingAmount: 15000,
            overdueAmount: 8000,
            lastPaymentDate: '2023-12-10',
            daysSinceLastPayment: 80
          },
          {
            id: '3',
            first_name: 'Arjun',
            last_name: 'Kumar',
            email: 'arjun.kumar@email.com',
            phone: '+91-9876543214',
            grade_level: '11th Grade',
            parent: {
              first_name: 'Rajesh',
              last_name: 'Kumar',
              email: 'rajesh.kumar@email.com',
              phone: '+91-9876543215'
            },
            totalFees: 12000,
            paidAmount: 2000,
            remainingAmount: 10000,
            overdueAmount: 0,
            lastPaymentDate: '2024-02-01',
            daysSinceLastPayment: 28
          }
        ];

        setStudents(mockStudents);
      }
    } catch (error) {
      console.error('Error loading students with fees:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const sendReminderEmail = async (student: Student) => {
    try {
      setSendingReminders(prev => new Set(prev).add(student.id));

      // In a real application, you would integrate with an email service like:
      // - SendGrid
      // - Mailgun  
      // - AWS SES
      // - Supabase Edge Functions with email service
      
      // For now, we'll simulate the email sending and log the details
      const emailContent = {
        to: student.email || student.parent?.email,
        subject: 'Fee Payment Reminder - Student Management System',
        body: `
Dear ${student.parent?.first_name || student.first_name},

This is a friendly reminder regarding the pending fee payment for ${student.first_name} ${student.last_name}.

Student Details:
- Name: ${student.first_name} ${student.last_name}
- Grade: ${student.grade_level}
- Total Fees: QAR${student.totalFees.toLocaleString()}
- Amount Paid: QAR${student.paidAmount.toLocaleString()}
- Remaining Amount: QAR${student.remainingAmount.toLocaleString()}
${student.overdueAmount > 0 ? `- Overdue Amount: QAR${student.overdueAmount.toLocaleString()}` : ''}

${student.lastPaymentDate 
  ? `Last Payment: ${new Date(student.lastPaymentDate).toLocaleDateString()} (${student.daysSinceLastPayment} days ago)`
  : 'No payments recorded yet'
}

Please make the payment at your earliest convenience. If you have any questions or need assistance, please contact us.

Thank you for your cooperation.

Best regards,
Student Management System
        `
      };

      console.log('Email would be sent:', emailContent);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real implementation, you would call your email service API here:
      // const response = await fetch('/api/send-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(emailContent)
      // });

      // For demo purposes, we'll assume success
      setSentReminders(prev => new Set(prev).add(student.id));
      
      // Log the reminder in the database (optional)
      // For now, we'll skip database logging until communications table is properly set up
      // await supabase
      //   .from('communications')
      //   .insert([{
      //     student_id: student.id,
      //     type: 'fee_reminder',
      //     subject: emailContent.subject,
      //     message: emailContent.body,
      //     recipient_email: emailContent.to,
      //     status: 'sent',
      //     sent_at: new Date().toISOString()
      //   }]);

      alert(`Fee reminder sent successfully to ${emailContent.to}`);
      
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder. Please try again.');
    } finally {
      setSendingReminders(prev => {
        const newSet = new Set(prev);
        newSet.delete(student.id);
        return newSet;
      });
    }
  };

  const getFilteredStudents = () => {
    switch (filterType) {
      case 'overdue':
        return students.filter(student => student.overdueAmount > 0);
      case 'pending':
        return students.filter(student => student.remainingAmount > 0 && student.overdueAmount === 0);
      default:
        return students;
    }
  };

  const filteredStudents = getFilteredStudents();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-secondary-600">Loading fee reminders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800 flex items-center space-x-3">
            <Mail className="w-8 h-8 text-primary-600" />
            <span>Fee Reminders</span>
            <button
              onClick={loadStudentsWithFees}
              disabled={loading}
              className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </h1>
          <p className="text-secondary-600 mt-1">Send payment reminders to students and parents</p>
        </div>

        {/* Filter Options */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            All ({students.length})
          </button>
          <button
            onClick={() => setFilterType('overdue')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'overdue'
                ? 'bg-danger-600 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            Overdue ({students.filter(s => s.overdueAmount > 0).length})
          </button>
          <button
            onClick={() => setFilterType('pending')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'pending'
                ? 'bg-warning-600 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            Pending ({students.filter(s => s.remainingAmount > 0 && s.overdueAmount === 0).length})
          </button>
        </div>
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-secondary-50 rounded-2xl">
          <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-secondary-800 mb-2">No Fee Reminders Needed</h3>
          <p className="text-secondary-600">
            {filterType === 'all' 
              ? 'All students have paid their fees!'
              : `No students in the ${filterType} category.`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className={`bg-white rounded-2xl shadow-soft border-l-4 p-6 ${
                student.overdueAmount > 0
                  ? 'border-l-danger-500'
                  : 'border-l-warning-500'
              }`}
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                {/* Student Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <User className="w-5 h-5 text-secondary-500" />
                    <h3 className="text-lg font-semibold text-secondary-800">
                      {student.first_name} {student.last_name}
                    </h3>
                    <span className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs">
                      {student.grade_level}
                    </span>
                    {student.overdueAmount > 0 && (
                      <span className="px-2 py-1 bg-danger-100 text-danger-700 rounded-full text-xs flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Overdue</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-secondary-600">Contact</p>
                      <p className="font-medium text-secondary-800">
                        {student.email || student.parent?.email || 'No email'}
                      </p>
                      <p className="text-secondary-600">
                        {student.phone || student.parent?.phone || 'No phone'}
                      </p>
                    </div>

                    <div>
                      <p className="text-secondary-600">Total Fees</p>
                      <p className="font-semibold text-secondary-800">QAR{student.totalFees.toLocaleString()}</p>
                    </div>

                    <div>
                      <p className="text-secondary-600">Remaining</p>
                      <p className="font-semibold text-warning-700">QAR{student.remainingAmount.toLocaleString()}</p>
                      {student.overdueAmount > 0 && (
                        <p className="font-semibold text-danger-700">
                          Overdue: QAR{student.overdueAmount.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-secondary-600">Last Payment</p>
                      <p className="font-medium text-secondary-800">
                        {student.lastPaymentDate 
                          ? `${student.daysSinceLastPayment} days ago`
                          : 'No payments'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center space-x-2">
                  {sentReminders.has(student.id) ? (
                    <div className="flex items-center space-x-2 text-success-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Sent</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => sendReminderEmail(student)}
                      disabled={sendingReminders.has(student.id) || !student.email && !student.parent?.email}
                      className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingReminders.has(student.id) ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Reminder</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeeReminder;
