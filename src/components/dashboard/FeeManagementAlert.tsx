import React, { useState, useEffect } from 'react';
import { AlertTriangle, DollarSign, User, Clock, Mail, Send, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { EmailNotificationService } from '../../services/emailNotificationService';

interface StudentWithFees {
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
  status: 'overdue' | 'pending';
}

interface FeeManagementAlertProps {
  setActiveView?: (view: string) => void;
}

const FeeManagementAlert: React.FC<FeeManagementAlertProps> = ({ setActiveView }) => {
  const [students, setStudents] = useState<StudentWithFees[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [sendingReminders, setSendingReminders] = useState<Set<string>>(new Set());
  const [sendingBulkReminders, setSendingBulkReminders] = useState(false);

  useEffect(() => {
    loadStudentsWithUnpaidFees();
  }, []);

  const loadStudentsWithUnpaidFees = async () => {
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
            daysSinceLastPayment,
            status: overdueAmount > 0 ? 'overdue' as const : 'pending' as const
          };
        }).filter(student => student.remainingAmount > 0) // Only show students with pending fees
          .sort((a, b) => {
            // Sort by overdue first, then by remaining amount
            if (a.status === 'overdue' && b.status !== 'overdue') return -1;
            if (a.status !== 'overdue' && b.status === 'overdue') return 1;
            return b.remainingAmount - a.remainingAmount;
          });

        setStudents(studentsWithFees);
      } catch (dbError) {
        console.log('Database tables not ready, using mock data for demo');
        
        // Create mock data for demonstration
        const mockStudents: StudentWithFees[] = [
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
            daysSinceLastPayment: 45,
            status: 'overdue'
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
            daysSinceLastPayment: 80,
            status: 'overdue'
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
            daysSinceLastPayment: 28,
            status: 'pending'
          },
          {
            id: '4',
            first_name: 'Sneha',
            last_name: 'Singh',
            email: 'sneha.singh@email.com',
            phone: '+91-9876543216',
            grade_level: '9th Grade',
            parent: {
              first_name: 'Vikram',
              last_name: 'Singh',
              email: 'vikram.singh@email.com',
              phone: '+91-9876543217'
            },
            totalFees: 8000,
            paidAmount: 1000,
            remainingAmount: 7000,
            overdueAmount: 2000,
            lastPaymentDate: '2024-01-20',
            daysSinceLastPayment: 40,
            status: 'overdue'
          }
        ];
        
        setStudents(mockStudents);
      }
    } catch (error) {
      console.error('Error loading students with unpaid fees:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const sendQuickReminder = async (student: StudentWithFees) => {
    try {
      setSendingReminders(prev => new Set(prev).add(student.id));

      // Send actual email using the email notification service
      const result = await EmailNotificationService.sendFeeReminder({
        type: 'monthly_reminder',
        studentId: student.id,
        parentEmail: student.parent?.email,
        studentEmail: student.email
      });

      if (result.success) {
        alert(`✅ Fee reminder sent successfully to ${student.parent?.email || student.email}!`);

        // Optionally refresh the data to show updated status
        await loadStudentsWithUnpaidFees();
      } else {
        alert(`❌ Failed to send reminder: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      alert(`❌ Failed to send reminder: ${error.message || 'Unknown error'}`);
    } finally {
      setSendingReminders(prev => {
        const newSet = new Set(prev);
        newSet.delete(student.id);
        return newSet;
      });
    }
  };

  const sendBulkReminders = async () => {
    try {
      setSendingBulkReminders(true);

      const studentsWithEmails = students.filter(s => s.email || s.parent?.email);
      let successCount = 0;
      let failCount = 0;

      // Send reminders to all students with emails
      for (const student of studentsWithEmails) {
        try {
          const result = await EmailNotificationService.sendFeeReminder({
            type: 'monthly_reminder',
            studentId: student.id,
            parentEmail: student.parent?.email,
            studentEmail: student.email
          });

          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Failed to send reminder to ${student.first_name} ${student.last_name}:`, error);
          failCount++;
        }

        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      alert(`✅ Bulk reminders completed!\n✅ Sent: ${successCount}\n❌ Failed: ${failCount}`);

      // Refresh the data
      await loadStudentsWithUnpaidFees();
    } catch (error: any) {
      console.error('Error sending bulk reminders:', error);
      alert(`❌ Failed to send bulk reminders: ${error.message || 'Unknown error'}`);
    } finally {
      setSendingBulkReminders(false);
    }
  };

  const overdueStudents = students.filter(s => s.status === 'overdue');
  const pendingStudents = students.filter(s => s.status === 'pending');
  const studentsWithEmails = students.filter(s => s.email || s.parent?.email);
  const studentsWithoutEmails = students.filter(s => !s.email && !s.parent?.email);
  const displayStudents = showAll ? students : students.slice(0, 5);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-soft border border-secondary-200 p-6">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
          <span className="ml-2 text-secondary-600">Loading fee alerts...</span>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-soft border border-secondary-200 p-6">
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 text-success-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-800 mb-2">All Fees Up to Date!</h3>
          <p className="text-secondary-600">No students have pending fee payments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-secondary-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-warning-100 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-warning-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-secondary-800">Fee Management Alert</h2>
            <p className="text-secondary-600 text-sm">
              {overdueStudents.length} overdue • {pendingStudents.length} pending • {studentsWithEmails.length} with email
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={loadStudentsWithUnpaidFees}
            disabled={loading}
            className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setActiveView?.('fee-reminder')}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            <span>View All</span>
          </button>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-3">
        {displayStudents.map((student) => (
          <div
            key={student.id}
            className={`p-4 rounded-xl border-l-4 ${
              student.status === 'overdue'
                ? 'bg-danger-50 border-l-danger-500'
                : 'bg-warning-50 border-l-warning-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <User className="w-4 h-4 text-secondary-500" />
                  <h3 className="font-semibold text-secondary-800">
                    {student.first_name} {student.last_name}
                  </h3>
                  <span className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs">
                    {student.grade_level}
                  </span>
                  {student.status === 'overdue' && (
                    <span className="px-2 py-1 bg-danger-100 text-danger-700 rounded-full text-xs font-medium">
                      Overdue
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-secondary-600">Contact</p>
                    <p className="font-medium text-secondary-800">
                      {student.parent?.email || student.email || 'No email'}
                    </p>
                  </div>

                  <div>
                    <p className="text-secondary-600">Remaining Amount</p>
                    <p className={`font-semibold ${student.status === 'overdue' ? 'text-danger-700' : 'text-warning-700'}`}>
                      QAR{student.remainingAmount.toLocaleString()}
                    </p>
                    {student.overdueAmount > 0 && (
                      <p className="text-danger-600 text-xs">
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

              <div className="flex items-center space-x-2 ml-4">
                {(!student.email && !student.parent?.email) ? (
                  <div className="text-xs text-secondary-500 px-3 py-2">
                    No Email
                  </div>
                ) : (
                  <button
                    onClick={() => sendQuickReminder(student)}
                    disabled={sendingReminders.has(student.id) || sendingBulkReminders}
                    className="flex items-center space-x-1 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title={`Send reminder to ${student.parent?.email || student.email}`}
                  >
                    {sendingReminders.has(student.id) ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">
                      {sendingReminders.has(student.id) ? 'Sending...' : 'Remind'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {students.length > 5 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
          >
            {showAll ? 'Show Less' : `Show All ${students.length} Students`}
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-secondary-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveView?.('fees')}
            className="flex items-center space-x-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <DollarSign className="w-4 h-4" />
            <span>Fee Management</span>
          </button>
          
          <button
            onClick={sendBulkReminders}
            disabled={sendingBulkReminders || studentsWithEmails.length === 0}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={`Send reminders to ${studentsWithEmails.length} students with email addresses`}
          >
            {sendingBulkReminders ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            <span>
              {sendingBulkReminders
                ? 'Sending...'
                : `Send Bulk Reminders (${studentsWithEmails.length})`
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeeManagementAlert;
