import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Eye, Search, Filter, Calendar, DollarSign, User, Phone, Mail, Link, Copy, Trash2, Edit, Send, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ExternalFeePayment {
  id: string;
  student_name: string;
  student_class: string;
  course_name?: string;
  course_fee?: number;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id?: string;
  payment_proof_url?: string;
  remarks?: string;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  verified_by_first_name?: string;
  verified_by_last_name?: string;
  verified_at?: string;
}

const ExternalFeeManagement: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<ExternalFeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<ExternalFeePayment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showFeeDetailsModal, setShowFeeDetailsModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ExternalFeePayment | null>(null);
  const [paymentLinks, setPaymentLinks] = useState<any[]>([]);
  const [showAllLinks, setShowAllLinks] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [selectedPaymentForLink, setSelectedPaymentForLink] = useState<ExternalFeePayment | null>(null);
  const [feeDetails, setFeeDetails] = useState({
    totalFee: '',
    courseName: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    description: ''
  });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<any>(null);

  useEffect(() => {
    fetchPayments();
    fetchPaymentLinks();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('external_fee_payments_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching external fee payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('active_payment_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentLinks(data || []);
    } catch (error) {
      console.error('Error fetching payment links:', error);
    }
  };

  const handleStatusUpdate = async (paymentId: string, newStatus: 'verified' | 'rejected') => {
    try {
      // Get payment details first
      const { data: payment, error: paymentError } = await supabase
        .from('external_fee_payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError) throw paymentError;

      // Get current user's staff record
      const { data: staffRecord } = await supabase
        .from('staff')
        .select('id')
        .eq('email', user?.email)
        .single();

      // Update payment status
      const { error: updateError } = await supabase
        .from('external_fee_payments')
        .update({
          status: newStatus,
          verified_by: staffRecord?.id || null,
          verified_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      // If verified, handle student creation and fee management
      if (newStatus === 'verified') {
        try {
          let studentId = payment.student_id;

          // If no student exists, try to find existing student first
          if (!studentId) {
            console.log('Looking for existing student...');

            // Try to find existing student by name and grade
            const nameParts = payment.student_name.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');

            const { data: existingStudents } = await supabase
              .from('students')
              .select('id, first_name, last_name, grade_level')
              .eq('status', 'active')
              .ilike('first_name', `%${firstName}%`)
              .eq('grade_level', payment.student_class);

            // If we found a matching student, use it
            if (existingStudents && existingStudents.length > 0) {
              // Find the best match (exact first name match preferred)
              const exactMatch = existingStudents.find(s =>
                s.first_name.toLowerCase() === firstName.toLowerCase()
              );

              studentId = exactMatch ? exactMatch.id : existingStudents[0].id;
              console.log('✅ Found existing student:', existingStudents[0].first_name, existingStudents[0].last_name);

              // Update the payment record with the existing student_id
              await supabase
                .from('external_fee_payments')
                .update({ student_id: studentId })
                .eq('id', paymentId);
            } else {
              console.log('No existing student found, creating new one...');

              // First, create or get parent record
              const { data: parentData, error: parentError } = await supabase
                .from('parents')
                .upsert({
                  first_name: payment.parent_name?.split(' ')[0] || 'Parent',
                  last_name: payment.parent_name?.split(' ').slice(1).join(' ') || '',
                  email: payment.parent_email || '',
                  phone: payment.parent_phone || '',
                  address: '',
                  occupation: ''
                }, {
                  onConflict: 'email'
                })
                .select()
                .single();

              if (parentError && parentError.code !== '23505') { // Ignore duplicate key error
                console.error('Error creating parent:', parentError);
              }

              // Create student record with ONLY student information
              const { data: studentData, error: studentError } = await supabase
                .from('students')
                .insert([{
                  first_name: firstName || payment.student_name,
                  last_name: lastName || '',
                  email: '', // Student email should be separate from parent email
                  phone: '', // Student phone should be separate from parent phone
                  grade_level: payment.student_class,
                  parent_id: parentData?.id || null,
                  enrollment_date: payment.payment_date,
                  status: 'active',
                  address: '', // Student address
                  date_of_birth: null, // Will be filled later if needed
                  subjects: [] // Student subjects
                }])
                .select()
                .single();

              if (studentError) {
                console.error('Error creating student:', studentError);
                throw studentError;
              }

              studentId = studentData.id;
              console.log('✅ Created new student:', studentData.first_name, studentData.last_name);

              // Update the payment record with the new student_id
              await supabase
                .from('external_fee_payments')
                .update({ student_id: studentId })
                .eq('id', paymentId);
            }
          }

          // Find course details for proper fee calculation
          let courseDetails = null;
          if (payment.course_name) {
            const { data: courseData } = await supabase
              .from('courses')
              .select('*')
              .eq('name', payment.course_name)
              .single();
            courseDetails = courseData;
          }

          // Calculate correct total fee amount (use course price, not payment amount)
          const totalFeeAmount = courseDetails?.price || payment.course_fee || payment.payment_amount;

          // Check if fee record already exists for this student and course
          const { data: existingFees } = await supabase
            .from('fees')
            .select('*')
            .eq('student_id', studentId)
            .eq('course_id', courseDetails?.id);

          // Also check for any existing fees for this student if no course-specific fee found
          let allStudentFees = [];
          if (!existingFees || existingFees.length === 0) {
            const { data: allFees } = await supabase
              .from('fees')
              .select('*')
              .eq('student_id', studentId);
            allStudentFees = allFees || [];
          }

          if (existingFees && existingFees.length > 0) {
            // Update existing fee record - ADD payment to existing paid amount
            const existingFee = existingFees[0];
            const newPaidAmount = (existingFee.paid_amount || 0) + payment.payment_amount;
            const newStatus = newPaidAmount >= existingFee.amount ? 'paid' :
                             newPaidAmount > 0 ? 'partial' : 'pending';

            await supabase
              .from('fees')
              .update({
                paid_amount: newPaidAmount,
                status: newStatus,
                paid_date: newStatus === 'paid' ? payment.payment_date : existingFee.paid_date,
                payment_date: payment.payment_date,
                payment_method: payment.payment_method,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingFee.id);

            console.log('✅ Updated existing fee record with payment');
          } else {
            // Create new fee record with CORRECT total amount and payment amount
            const newStatus = payment.payment_amount >= totalFeeAmount ? 'paid' :
                             payment.payment_amount > 0 ? 'partial' : 'pending';

            await supabase
              .from('fees')
              .insert([{
                student_id: studentId,
                course_id: courseDetails?.id || null,
                amount: totalFeeAmount, // CORRECT: Use full course fee as total
                paid_amount: payment.payment_amount, // CORRECT: Payment amount as paid
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                paid_date: newStatus === 'paid' ? payment.payment_date : null,
                status: newStatus,
                payment_date: payment.payment_date,
                payment_method: payment.payment_method,
                fee_type: 'tuition',
                description: `External payment verified - ${payment.course_name || 'Course fee'}`,
                created_at: new Date().toISOString()
              }]);

            console.log('✅ Created new fee record with correct amounts');
          }

          // Check if transaction already exists to prevent duplicates
          const { data: existingTransaction } = await supabase
            .from('transactions')
            .select('id')
            .eq('related_id', studentId)
            .eq('amount', payment.payment_amount)
            .eq('date', payment.payment_date)
            .eq('source', 'external_payment')
            .single();

          if (!existingTransaction) {
            // Add to transactions table (for accounts section) with source tracking
            await supabase
              .from('transactions')
              .insert([{
                type: 'income',
                date: payment.payment_date,
                amount: payment.payment_amount,
                category: 'Student Fees',
                sub_category: payment.student_name,
                related_id: studentId,
                payment_mode: payment.payment_method,
                description: `External payment verified - ${payment.student_name} - ${payment.course_name || 'Course fee'}`,
                image_url: payment.payment_proof_url,
                source: 'external_payment',
                created_at: new Date().toISOString()
              }]);

            console.log('✅ Added transaction record for accounts section');
          } else {
            console.log('ℹ️ Transaction already exists, skipping duplicate');
          }

          // Try to add to legacy income table (for backward compatibility) - ignore if table doesn't exist
          try {
            await supabase
              .from('income')
              .insert([{
                date: payment.payment_date,
                type: 'student_fees',
                sub_type: payment.student_name,
                amount: payment.payment_amount,
                payment_mode: payment.payment_method,
                remarks: `External payment verified - ${payment.course_name || 'Course fee'}`,
                image_url: payment.payment_proof_url
              }]);
            console.log('✅ Added legacy income record');
          } catch (incomeError) {
            console.log('ℹ️ Income table not found, skipping legacy record (this is normal)');
          }

          console.log('✅ Created fee record in fees table');

          console.log('✅ Student and fee records processed successfully');
        } catch (error) {
          console.error('⚠️ Error processing student/fee records:', error);
          // Don't fail the main operation if student/fee processing fails
        }
      }

      // If rejected, regenerate payment link for the student
      if (newStatus === 'rejected') {
        try {
          await generatePaymentLink(
            payment.student_name,
            payment.student_class,
            payment.course_name,
            payment.course_fee
          );
          alert(`Payment rejected successfully!\n\nA new payment link has been generated and copied to clipboard. Please share it with the parent.`);
        } catch (linkError) {
          console.warn('Failed to regenerate payment link:', linkError);
          alert(`Payment rejected successfully!\n\nNote: Failed to automatically generate new payment link. Please create one manually.`);
        }
      } else {
        alert(`Payment ${newStatus} successfully!\n\nThe payment has been processed and will now appear in:\n• Fee Management section\n• Accounts section (Income)\n• Student records\n\nPlease refresh those sections to see the updated data.`);
      }

      fetchPayments();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status. Please try again.');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('external_fee_payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      alert('Payment record deleted successfully!');
      fetchPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment record. Please try again.');
    }
  };

  const handleEditPayment = (payment: ExternalFeePayment) => {
    setEditingPayment(payment);
    setShowEditModal(true);
  };

  const handleUpdatePayment = async (updatedPayment: ExternalFeePayment) => {
    try {
      const { error } = await supabase
        .from('external_fee_payments')
        .update({
          student_name: updatedPayment.student_name,
          student_class: updatedPayment.student_class,
          course_name: updatedPayment.course_name,
          course_fee: updatedPayment.course_fee,
          parent_name: updatedPayment.parent_name,
          parent_email: updatedPayment.parent_email,
          parent_phone: updatedPayment.parent_phone,
          payment_amount: updatedPayment.payment_amount,
          payment_date: updatedPayment.payment_date,
          payment_method: updatedPayment.payment_method,
          transaction_id: updatedPayment.transaction_id,
          remarks: updatedPayment.remarks
        })
        .eq('id', updatedPayment.id);

      if (error) throw error;

      alert('Payment record updated successfully!');
      setShowEditModal(false);
      setEditingPayment(null);
      fetchPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Failed to update payment record. Please try again.');
    }
  };

  const generatePaymentLink = async (studentName: string, studentClass: string, courseName?: string, courseFee?: number) => {
    try {
      setGeneratingLink(true);

      // Generate unique token
      const token = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

      // Create payment link record directly
      const { data: linkData, error: linkError } = await supabase
        .from('external_payment_links')
        .insert([{
          link_token: token,
          parent_name: 'Parent', // Will be updated when parent fills the form
          parent_email: '',
          parent_phone: '',
          student_name: studentName,
          student_class: studentClass,
          course_name: courseName || null,
          course_fee: courseFee || null,
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        }])
        .select()
        .single();

      if (linkError) throw linkError;

      // Use the correct domain for payment URL
      const baseUrl = window.location.origin;
      const paymentUrl = `${baseUrl}/external-payment/${token}`;

      // Copy to clipboard
      navigator.clipboard.writeText(paymentUrl).then(() => {
        alert(`Payment link generated and copied to clipboard!\n\n${paymentUrl}\n\nShare this link with the parent to submit payment information.`);
      }).catch(() => {
        alert(`Payment link generated!\n\n${paymentUrl}\n\nPlease copy this link manually and share with the parent.`);
      });

      fetchPaymentLinks();
    } catch (error) {
      console.error('Error generating payment link:', error);
      alert('Failed to generate payment link. Please try again.');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleGeneratePaymentLink = (payment: ExternalFeePayment) => {
    setSelectedPaymentForLink(payment);
    setFeeDetails({
      totalFee: payment.course_fee?.toString() || '',
      courseName: payment.course_name || '',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: `Fee payment for ${payment.student_name} - ${payment.course_name || 'Course'}`
    });
    setShowFeeDetailsModal(true);
  };

  const generatePaymentLinkWithFees = async () => {
    if (!selectedPaymentForLink) return;

    try {
      setGeneratingLink(true);

      // Generate unique token
      const token = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

      // Create payment link record with fee details
      const { error: linkError } = await supabase
        .from('external_payment_links')
        .insert([{
          link_token: token,
          parent_name: 'Parent', // Will be updated when parent fills the form
          parent_email: '',
          parent_phone: '',
          student_name: selectedPaymentForLink.student_name,
          student_class: selectedPaymentForLink.student_class,
          course_name: feeDetails.courseName || selectedPaymentForLink.course_name,
          course_fee: parseFloat(feeDetails.totalFee) || null,
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        }]);

      if (linkError) throw linkError;

      const paymentUrl = `${window.location.origin}/external-payment/${token}`;

      // Copy to clipboard
      navigator.clipboard.writeText(paymentUrl).then(() => {
        alert(`Payment link generated and copied to clipboard!\n\nFee Details:\n- Course: ${feeDetails.courseName}\n- Total Fee: QAR ${feeDetails.totalFee}\n- Due Date: ${feeDetails.dueDate}\n\nPayment Link:\n${paymentUrl}\n\nShare this link with the parent to submit payment information.`);
      }).catch(() => {
        alert(`Payment link generated!\n\nFee Details:\n- Course: ${feeDetails.courseName}\n- Total Fee: QAR ${feeDetails.totalFee}\n\nPayment Link:\n${paymentUrl}\n\nPlease copy this link manually and share with the parent.`);
      });

      setShowFeeDetailsModal(false);
      setSelectedPaymentForLink(null);
      fetchPaymentLinks();
    } catch (error) {
      console.error('Error generating payment link:', error);
      alert('Failed to generate payment link. Please try again.');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Payment link copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy link. Please copy manually.');
    });
  };

  const getPaymentUrl = (token: string) => {
    // Use the current domain (works for both localhost and Vercel)
    return `${window.location.origin}/external-payment/${token}`;
  };

  const handleDeleteLink = (link: any) => {
    setLinkToDelete(link);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteLink = async () => {
    if (!linkToDelete) return;

    try {
      const { error } = await supabase
        .from('external_payment_links')
        .delete()
        .eq('id', linkToDelete.id);

      if (error) throw error;

      alert('Payment link deleted successfully!');
      setShowDeleteConfirmation(false);
      setLinkToDelete(null);
      fetchPaymentLinks(); // Refresh the list
    } catch (error) {
      console.error('Error deleting payment link:', error);
      alert('Failed to delete payment link. Please try again.');
    }
  };

  const cancelDeleteLink = () => {
    setShowDeleteConfirmation(false);
    setLinkToDelete(null);
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'verified': return 'bg-success-100 text-success-800 border-success-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-secondary-100 text-secondary-800 border-secondary-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800">External Fee Payments</h1>
          <p className="text-secondary-600 mt-1">Manage fee payments submitted by parents</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Payments</p>
              <p className="text-2xl font-bold text-secondary-800">{payments.length}</p>
            </div>
            <DollarSign className="w-8 h-8 text-secondary-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Pending</p>
              <p className="text-2xl font-bold text-warning-600">{payments.filter(p => p.status === 'pending').length}</p>
            </div>
            <Clock className="w-8 h-8 text-warning-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Verified</p>
              <p className="text-2xl font-bold text-success-600">{payments.filter(p => p.status === 'verified').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{payments.filter(p => p.status === 'rejected').length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-soft">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by student name, parent name, or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 border-b border-secondary-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Student</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Payment Details</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Parent Info</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-secondary-50 transition-colors">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-semibold text-secondary-800">{payment.student_name}</p>
                      <p className="text-sm text-secondary-600">Grade {payment.student_class}</p>
                      {payment.course_name && (
                        <p className="text-sm text-primary-600">{payment.course_name}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-semibold text-secondary-800">QAR {payment.payment_amount.toLocaleString()}</p>
                      <p className="text-sm text-secondary-600">{payment.payment_method.replace('_', ' ')}</p>
                      <p className="text-sm text-secondary-600">{new Date(payment.payment_date).toLocaleDateString()}</p>
                      {payment.transaction_id && (
                        <p className="text-xs text-secondary-500">ID: {payment.transaction_id}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-secondary-800">{payment.parent_name}</p>
                      {payment.parent_email && (
                        <p className="text-sm text-secondary-600">{payment.parent_email}</p>
                      )}
                      {payment.parent_phone && (
                        <p className="text-sm text-secondary-600">{payment.parent_phone}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="capitalize">{payment.status}</span>
                    </span>
                    {payment.verified_by_first_name && (
                      <p className="text-xs text-secondary-500 mt-1">
                        by {payment.verified_by_first_name} {payment.verified_by_last_name}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEditPayment(payment)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Payment"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleGeneratePaymentLink(payment)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Generate Payment Link with Fee Details"
                        disabled={generatingLink}
                      >
                        <Link className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeletePayment(payment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Payment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {payment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(payment.id, 'verified')}
                            className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                            title="Verify Payment"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(payment.id, 'rejected')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject Payment"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-600 mb-2">No payments found</h3>
            <p className="text-secondary-500">No external fee payments match your current filters</p>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-secondary-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-secondary-800">Payment Details</h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedPayment(null);
                  }}
                  className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6 text-secondary-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Information */}
              <div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-3">Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-secondary-600">Name:</span>
                    <span className="ml-2 font-medium">{selectedPayment.student_name}</span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Class:</span>
                    <span className="ml-2 font-medium">Grade {selectedPayment.student_class}</span>
                  </div>
                  {selectedPayment.course_name && (
                    <div>
                      <span className="text-secondary-600">Course:</span>
                      <span className="ml-2 font-medium">{selectedPayment.course_name}</span>
                    </div>
                  )}
                  {selectedPayment.course_fee && (
                    <div>
                      <span className="text-secondary-600">Course Fee:</span>
                      <span className="ml-2 font-medium">QAR {selectedPayment.course_fee.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-3">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-secondary-600">Amount:</span>
                    <span className="ml-2 font-medium text-primary-600">QAR {selectedPayment.payment_amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Date:</span>
                    <span className="ml-2 font-medium">{new Date(selectedPayment.payment_date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Method:</span>
                    <span className="ml-2 font-medium capitalize">{selectedPayment.payment_method.replace('_', ' ')}</span>
                  </div>
                  {selectedPayment.transaction_id && (
                    <div>
                      <span className="text-secondary-600">Transaction ID:</span>
                      <span className="ml-2 font-medium">{selectedPayment.transaction_id}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Parent Information */}
              {selectedPayment.parent_name && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-3">Parent Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-secondary-600">Name:</span>
                      <span className="ml-2 font-medium">{selectedPayment.parent_name}</span>
                    </div>
                    {selectedPayment.parent_email && (
                      <div>
                        <span className="text-secondary-600">Email:</span>
                        <span className="ml-2 font-medium">{selectedPayment.parent_email}</span>
                      </div>
                    )}
                    {selectedPayment.parent_phone && (
                      <div>
                        <span className="text-secondary-600">Phone:</span>
                        <span className="ml-2 font-medium">{selectedPayment.parent_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Proof */}
              {selectedPayment.payment_proof_url && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-3">Payment Proof</h3>
                  <div className="border border-secondary-200 rounded-lg p-4">
                    <img
                      src={selectedPayment.payment_proof_url}
                      alt="Payment Proof"
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Remarks */}
              {selectedPayment.remarks && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-3">Remarks</h3>
                  <p className="text-sm text-secondary-700 bg-secondary-50 p-3 rounded-lg">
                    {selectedPayment.remarks}
                  </p>
                </div>
              )}

              {/* Status Actions */}
              {selectedPayment.status === 'pending' && (
                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-secondary-200">
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedPayment.id, 'rejected');
                      setShowDetailsModal(false);
                    }}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Payment</span>
                  </button>
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedPayment.id, 'verified');
                      setShowDetailsModal(false);
                    }}
                    className="flex items-center space-x-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Verify Payment</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditModal && editingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-large max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <h3 className="text-xl font-bold text-secondary-800">Edit Payment Record</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPayment(null);
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-secondary-600" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingPayment) {
                handleUpdatePayment(editingPayment);
              }
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Student Name</label>
                  <input
                    type="text"
                    value={editingPayment.student_name}
                    onChange={(e) => setEditingPayment({...editingPayment, student_name: e.target.value})}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Student Class</label>
                  <input
                    type="text"
                    value={editingPayment.student_class}
                    onChange={(e) => setEditingPayment({...editingPayment, student_class: e.target.value})}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Course Name</label>
                  <input
                    type="text"
                    value={editingPayment.course_name || ''}
                    onChange={(e) => setEditingPayment({...editingPayment, course_name: e.target.value})}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Course Fee (QAR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPayment.course_fee || ''}
                    onChange={(e) => setEditingPayment({...editingPayment, course_fee: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Parent Name</label>
                  <input
                    type="text"
                    value={editingPayment.parent_name || ''}
                    onChange={(e) => setEditingPayment({...editingPayment, parent_name: e.target.value})}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Parent Email</label>
                  <input
                    type="email"
                    value={editingPayment.parent_email || ''}
                    onChange={(e) => setEditingPayment({...editingPayment, parent_email: e.target.value})}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Parent Phone</label>
                  <input
                    type="tel"
                    value={editingPayment.parent_phone || ''}
                    onChange={(e) => setEditingPayment({...editingPayment, parent_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Payment Amount (QAR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPayment.payment_amount}
                    onChange={(e) => setEditingPayment({...editingPayment, payment_amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Payment Date</label>
                  <input
                    type="date"
                    value={editingPayment.payment_date}
                    onChange={(e) => setEditingPayment({...editingPayment, payment_date: e.target.value})}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Payment Method</label>
                  <select
                    value={editingPayment.payment_method}
                    onChange={(e) => setEditingPayment({...editingPayment, payment_method: e.target.value})}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Transaction ID</label>
                  <input
                    type="text"
                    value={editingPayment.transaction_id || ''}
                    onChange={(e) => setEditingPayment({...editingPayment, transaction_id: e.target.value})}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Remarks</label>
                <textarea
                  value={editingPayment.remarks || ''}
                  onChange={(e) => setEditingPayment({...editingPayment, remarks: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPayment(null);
                  }}
                  className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Update Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Links Section */}
      {paymentLinks.length > 0 && (
        <div className="bg-white rounded-xl border border-secondary-200 p-4 lg:p-6 shadow-soft mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-800">All Payment Links</h3>
            <span className="text-sm text-secondary-600">{paymentLinks.length} active links</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 border-b border-secondary-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">Parent</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {(showAllLinks ? paymentLinks : paymentLinks.slice(0, 10)).map((link) => (
                  <tr key={link.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-secondary-800">{link.student_name}</p>
                        <p className="text-sm text-secondary-600">{link.student_class}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-secondary-800">{link.parent_name}</p>
                        <p className="text-sm text-secondary-600">{link.parent_email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        link.status === 'active' ? 'bg-success-100 text-success-800' :
                        link.status === 'used' ? 'bg-primary-100 text-primary-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {link.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(getPaymentUrl(link.link_token))}
                          className="p-1 text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors"
                          title="Copy Link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const message = `Payment Link for ${link.student_name}:\n${getPaymentUrl(link.link_token)}`;
                            if (navigator.share) {
                              navigator.share({ text: message });
                            } else {
                              copyToClipboard(getPaymentUrl(link.link_token));
                            }
                          }}
                          className="p-1 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Share Link"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLink(link)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Show More/Show Less Button */}
          {paymentLinks.length > 10 && (
            <div className="mt-4 text-center border-t border-secondary-200 pt-4">
              <button
                onClick={() => setShowAllLinks(!showAllLinks)}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
              >
                {showAllLinks
                  ? `Show Less (Showing all ${paymentLinks.length} links)`
                  : `Show All ${paymentLinks.length} Payment Links (Currently showing 10)`
                }
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fee Details Modal */}
      {showFeeDetailsModal && selectedPaymentForLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-large max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <h3 className="text-xl font-bold text-secondary-800">Enter Fee Details</h3>
              <button
                onClick={() => {
                  setShowFeeDetailsModal(false);
                  setSelectedPaymentForLink(null);
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-secondary-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-primary-800 mb-2">Student Information</h4>
                <p className="text-sm text-primary-700">
                  <strong>Name:</strong> {selectedPaymentForLink.student_name}
                </p>
                <p className="text-sm text-primary-700">
                  <strong>Class:</strong> {selectedPaymentForLink.student_class}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={feeDetails.courseName}
                  onChange={(e) => setFeeDetails({...feeDetails, courseName: e.target.value})}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Mathematics Advanced"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Total Fee Amount (QAR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={feeDetails.totalFee}
                  onChange={(e) => setFeeDetails({...feeDetails, totalFee: e.target.value})}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={feeDetails.dueDate}
                  onChange={(e) => setFeeDetails({...feeDetails, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Description
                </label>
                <textarea
                  value={feeDetails.description}
                  onChange={(e) => setFeeDetails({...feeDetails, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Additional details about the fee..."
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowFeeDetailsModal(false);
                    setSelectedPaymentForLink(null);
                  }}
                  className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={generatePaymentLinkWithFees}
                  disabled={!feeDetails.courseName || !feeDetails.totalFee || generatingLink}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingLink ? 'Generating...' : 'Generate Payment Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && linkToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-large max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <h3 className="text-xl font-bold text-secondary-800">Delete Payment Link</h3>
              <button
                onClick={cancelDeleteLink}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-secondary-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-red-800 mb-2">⚠️ Warning</h4>
                <p className="text-red-700 text-sm">
                  This action cannot be undone. The payment link will be permanently deleted.
                </p>
              </div>

              <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
                <h4 className="font-semibold text-secondary-800 mb-2">Payment Link Details</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-secondary-700">Student:</span>
                    <span className="ml-2 text-secondary-600">{linkToDelete.student_name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-secondary-700">Class:</span>
                    <span className="ml-2 text-secondary-600">{linkToDelete.student_class}</span>
                  </div>
                  <div>
                    <span className="font-medium text-secondary-700">Parent:</span>
                    <span className="ml-2 text-secondary-600">{linkToDelete.parent_name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-secondary-700">Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      linkToDelete.status === 'active' ? 'bg-success-100 text-success-800' :
                      linkToDelete.status === 'used' ? 'bg-primary-100 text-primary-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {linkToDelete.status}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-secondary-600 text-sm">
                Are you sure you want to delete this payment link? This will remove the link permanently and parents will no longer be able to use it for payments.
              </p>
            </div>

            <div className="flex justify-end space-x-4 p-6 border-t border-secondary-200">
              <button
                onClick={cancelDeleteLink}
                className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteLink}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalFeeManagement;
