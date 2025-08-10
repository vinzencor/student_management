import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, AlertTriangle, Clock, Plus, Search, Filter, Mail, Send } from 'lucide-react';
import { DataService } from '../services/dataService';
import { EmailService } from '../services/emailService';
import { supabase } from '../lib/supabase';
import type { Fee } from '../lib/supabase';
import AddFeeModal from './modals/AddFeeModal';

const FeeManagement: React.FC = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [selectedFees, setSelectedFees] = useState<string[]>([]);
  const [payingFee, setPayingFee] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Load courses first
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'active')
        .order('name');
      setCourses(coursesData || []);

      // Load all students with their course info and enrolled courses
      const { data: studentsData } = await supabase
        .from('students')
        .select(`
          *,
          course:courses(id, name, price),
          parent:parents(first_name, last_name, phone),
          student_courses(
            course_id,
            status,
            courses(id, name, price)
          )
        `)
        .eq('status', 'active')
        .order('first_name');
      setStudents(studentsData || []);

      // Load comprehensive fee data from multiple sources
      await loadComprehensiveFees(studentsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComprehensiveFees = async (studentsData: any[]) => {
    try {
      // Load fee records from the database
      const { data: feeRecords, error } = await supabase
        .from('fees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading fees:', error);
        return;
      }

      // Group fees by student and aggregate totals
      const studentFeeMap = new Map();

      // Initialize map with all students
      studentsData.forEach(student => {
        const enrolledCourses = student.student_courses?.map(sc => sc.courses).filter(Boolean) || [];
        const primaryCourse = student.course;

        // Combine primary course with enrolled courses (avoid duplicates)
        const allCourses = [];
        if (primaryCourse) allCourses.push(primaryCourse);
        enrolledCourses.forEach(course => {
          if (!allCourses.find(c => c.id === course.id)) {
            allCourses.push(course);
          }
        });

        studentFeeMap.set(student.id, {
          student,
          courses: allCourses,
          totalAmount: 0,
          totalPaid: 0,
          totalRemaining: 0,
          status: 'pending',
          feeRecords: []
        });
      });

      // Process fee records
      (feeRecords || []).forEach(fee => {
        const studentFee = studentFeeMap.get(fee.student_id);
        if (studentFee) {
          studentFee.totalAmount += fee.amount || 0;
          studentFee.totalPaid += fee.paid_amount || 0;
          studentFee.feeRecords.push(fee);
        }
      });

      // Calculate remaining amounts and status - show students with fee records OR enrolled courses
      const allFees = Array.from(studentFeeMap.values())
        .filter(studentFee =>
          studentFee.feeRecords.length > 0 || // Has fee records
          studentFee.courses.length > 0       // OR has enrolled courses
        )
        .map(studentFee => {
          // If no fee records but has courses, calculate expected fees
          if (studentFee.feeRecords.length === 0 && studentFee.courses.length > 0) {
            studentFee.totalAmount = studentFee.courses.reduce((sum, course) => sum + course.price, 0);
            studentFee.totalPaid = 0;
          }
          studentFee.totalRemaining = Math.max(0, studentFee.totalAmount - studentFee.totalPaid);

          // Determine overall status
          if (studentFee.totalRemaining > 0 && studentFee.totalPaid > 0) {
            studentFee.status = 'partial';
          } else if (studentFee.totalRemaining <= 0 && studentFee.totalPaid > 0) {
            studentFee.status = 'paid';
          } else {
            studentFee.status = 'pending';
          }

        // Get the earliest due date from fee records
        const earliestDueDate = studentFee.feeRecords.length > 0
          ? studentFee.feeRecords.reduce((earliest, fee) => {
              return new Date(fee.due_date) < new Date(earliest) ? fee.due_date : earliest;
            }, studentFee.feeRecords[0].due_date)
          : new Date().toISOString().split('T')[0];

        // Get the latest paid date if any
        const latestPaidDate = studentFee.feeRecords
          .filter(fee => fee.paid_date)
          .reduce((latest, fee) => {
            return new Date(fee.paid_date) > new Date(latest || '1970-01-01') ? fee.paid_date : latest;
          }, null);

        return {
          id: `student-${studentFee.student.id}`,
          student_id: studentFee.student.id,
          student: studentFee.student,
          courses: studentFee.courses,
          amount: studentFee.totalAmount,
          paid_amount: studentFee.totalPaid,
          remaining_amount: studentFee.totalRemaining,
          status: studentFee.status,
          fee_type: 'tuition',
          description: `Total fees for ${studentFee.courses.length} course(s)`,
          due_date: earliestDueDate,
          paid_date: latestPaidDate,
          feeRecords: studentFee.feeRecords,
          course: studentFee.courses[0] // For backward compatibility
        };
      }).filter(fee => fee.student);

      setFees(allFees);
    } catch (error) {
      console.error('Error loading comprehensive fees:', error);
    }
  };

  const filteredFees = fees.filter(fee => {
    const matchesSearch =
      fee.student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.fee_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.course?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || fee.status === statusFilter;

    const matchesCourse = courseFilter === 'all' || fee.student?.course_id === courseFilter;

    return matchesSearch && matchesStatus && matchesCourse;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'overdue': return <AlertTriangle className="w-5 h-5 text-danger-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-warning-600" />;
      default: return <Clock className="w-5 h-5 text-secondary-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success-100 text-success-800 border-success-200';
      case 'overdue': return 'bg-danger-100 text-danger-800 border-danger-200';
      case 'pending': return 'bg-warning-100 text-warning-800 border-warning-200';
      default: return 'bg-secondary-100 text-secondary-800 border-secondary-200';
    }
  };

  const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const paidAmount = fees.filter(fee => fee.status === 'paid').reduce((sum, fee) => sum + fee.amount, 0);
  const overdueAmount = fees.filter(fee => fee.status === 'overdue').reduce((sum, fee) => sum + fee.amount, 0);

  const handleSendReminder = async (feeId: string) => {
    try {
      const fee = fees.find(f => f.id === feeId);
      if (!fee) return;

      await EmailService.sendFeeReminder(fee.student_id, feeId);
      alert('Fee reminder sent successfully!');
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder. Please try again.');
    }
  };

  const handleBulkReminders = async () => {
    if (selectedFees.length === 0) {
      alert('Please select fees to send reminders for.');
      return;
    }

    try {
      setSendingReminders(true);
      const result = await EmailService.sendBulkFeeReminders(selectedFees);
      alert(result.message);
      setSelectedFees([]);
    } catch (error) {
      console.error('Error sending bulk reminders:', error);
      alert('Failed to send reminders. Please try again.');
    } finally {
      setSendingReminders(false);
    }
  };

  const handleFeeSelection = (feeId: string) => {
    setSelectedFees(prev =>
      prev.includes(feeId)
        ? prev.filter(id => id !== feeId)
        : [...prev, feeId]
    );
  };

  const openPaymentModal = (fee: any) => {
    setPayingFee(fee);
    const remaining = fee.amount - (fee.paid_amount || 0);
    setPaymentAmount(remaining);
  };

  const processPayment = async () => {
    if (!payingFee || paymentAmount <= 0) return;

    try {
      setLoading(true);

      // Check if this is an aggregated record (ID starts with "student-")
      if (payingFee.id.startsWith('student-')) {
        // For aggregated records, we need to distribute the payment across individual fee records
        const studentId = payingFee.student_id;

        // Get all pending/partial fee records for this student
        const { data: studentFeeRecords, error: fetchError } = await supabase
          .from('fees')
          .select('*')
          .eq('student_id', studentId)
          .in('status', ['pending', 'partial'])
          .order('due_date');

        if (fetchError) throw fetchError;

        if (!studentFeeRecords || studentFeeRecords.length === 0) {
          // If no fee records exist, create them based on enrolled courses
          const studentCourses = payingFee.courses || [];

          if (studentCourses.length === 0) {
            throw new Error('No courses found for this student. Please add courses first.');
          }

          // Create fee records for each enrolled course
          const feeRecordsToCreate = studentCourses.map(course => ({
            student_id: studentId,
            amount: course.price,
            paid_amount: 0,
            status: 'pending',
            due_date: new Date().toISOString().split('T')[0],
            fee_type: 'tuition',
            description: `Course fee for ${course.name}`,
            created_at: new Date().toISOString()
          }));

          const { data: createdFeeRecords, error: createError } = await supabase
            .from('fees')
            .insert(feeRecordsToCreate)
            .select();

          if (createError) throw createError;

          // Use the newly created fee records for payment processing
          studentFeeRecords = createdFeeRecords;
        }

        // Distribute payment across fee records
        let remainingPayment = paymentAmount;

        for (const feeRecord of studentFeeRecords) {
          if (remainingPayment <= 0) break;

          const feeRemaining = feeRecord.amount - (feeRecord.paid_amount || 0);
          const paymentForThisFee = Math.min(remainingPayment, feeRemaining);

          const newPaidAmount = (feeRecord.paid_amount || 0) + paymentForThisFee;
          const newStatus = newPaidAmount >= feeRecord.amount ? 'paid' : 'partial';

          const { error: updateError } = await supabase
            .from('fees')
            .update({
              paid_amount: newPaidAmount,
              status: newStatus,
              paid_date: newStatus === 'paid' ? new Date().toISOString() : feeRecord.paid_date
            })
            .eq('id', feeRecord.id);

          if (updateError) throw updateError;

          remainingPayment -= paymentForThisFee;
        }

        // Create a receipt record for the payment
        const receiptNumber = `RCP-${Date.now()}`;
        await supabase
          .from('fee_receipts')
          .insert([{
            receipt_number: receiptNumber,
            student_id: studentId,
            student_name: `${payingFee.student.first_name} ${payingFee.student.last_name}`,
            course_name: 'Multiple Courses',
            amount_paid: paymentAmount,
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash',
            description: `Payment for multiple courses`,
            created_at: new Date().toISOString()
          }]);

      } else {
        // Handle individual fee record payment (original logic)
        const newPaidAmount = (payingFee.paid_amount || 0) + paymentAmount;
        const newStatus = newPaidAmount >= payingFee.amount ? 'paid' : 'partial';

        const { error } = await supabase
          .from('fees')
          .update({
            paid_amount: newPaidAmount,
            status: newStatus,
            paid_date: newStatus === 'paid' ? new Date().toISOString() : null
          })
          .eq('id', payingFee.id);

        if (error) throw error;
      }

      setPayingFee(null);
      setPaymentAmount(0);
      await loadAllData(); // Reload all data to reflect changes
      alert(`Payment of ₹${paymentAmount.toLocaleString()} recorded successfully!`);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="w-48 h-8 bg-secondary-200 rounded animate-pulse"></div>
          <div className="w-32 h-10 bg-secondary-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl border border-secondary-200 animate-pulse">
              <div className="w-full h-20 bg-secondary-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800">Fee Management</h1>
          <p className="text-secondary-600 mt-1">Track and manage student fee payments</p>
        </div>
        <div className="flex space-x-3">
          {selectedFees.length > 0 && (
            <button
              onClick={handleBulkReminders}
              disabled={sendingReminders}
              className="flex items-center space-x-2 bg-warning-600 hover:bg-warning-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-soft hover:shadow-medium disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              <span className="font-medium">
                {sendingReminders ? 'Sending...' : `Send ${selectedFees.length} Reminders`}
              </span>
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-soft hover:shadow-medium"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Fee Record</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-secondary-200 p-4 shadow-soft">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by student name, course, or fee type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-secondary-500" />
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors min-w-[180px]"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-success-600" />
            <span className="text-sm font-medium text-success-700 bg-success-100 px-3 py-1 rounded-full border border-success-200">
              Collected
            </span>
          </div>
          <h3 className="text-2xl font-bold text-secondary-800">${paidAmount.toFixed(2)}</h3>
          <p className="text-success-600 text-sm font-medium">Total Collected</p>
        </div>

        <div className="bg-gradient-to-r from-danger-50 to-danger-100 border border-danger-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 text-danger-600" />
            <span className="text-sm font-medium text-danger-700 bg-danger-100 px-3 py-1 rounded-full border border-danger-200">
              Overdue
            </span>
          </div>
          <h3 className="text-2xl font-bold text-secondary-800">${overdueAmount.toFixed(2)}</h3>
          <p className="text-danger-600 text-sm font-medium">Overdue Amount</p>
        </div>

        <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-primary-600" />
            <span className="text-sm font-medium text-primary-700 bg-primary-100 px-3 py-1 rounded-full border border-primary-200">
              Total
            </span>
          </div>
          <h3 className="text-2xl font-bold text-secondary-800">${totalAmount.toFixed(2)}</h3>
          <p className="text-primary-600 text-sm font-medium">Total Expected</p>
        </div>
      </div>

      {/* Fee Table */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-secondary-800">Fee Records</h2>
              <p className="text-secondary-600 mt-1">
                {filteredFees.length} {filteredFees.length === 1 ? 'record' : 'records'} found
              </p>
            </div>
            {filteredFees.some(fee => fee.status !== 'paid') && (
              <button
                onClick={() => setSelectedFees(filteredFees.filter(fee => fee.status !== 'paid').map(fee => fee.id))}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Select All Unpaid
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-secondary-600">
                  <input
                    type="checkbox"
                    checked={selectedFees.length === filteredFees.filter(fee => fee.status !== 'paid').length && filteredFees.filter(fee => fee.status !== 'paid').length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFees(filteredFees.filter(fee => fee.status !== 'paid').map(fee => fee.id));
                      } else {
                        setSelectedFees([]);
                      }
                    }}
                    className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                  />
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-secondary-600">Student</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-secondary-600">Course</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-secondary-600">Fee Type</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-secondary-600">Total Amount</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-secondary-600">Paid Amount</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-secondary-600">Remaining</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-secondary-600">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-secondary-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFees.length > 0 ? (
                filteredFees.map((fee) => (
                  <tr key={fee.id} className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors">
                    <td className="px-6 py-4">
                      {fee.status !== 'paid' && (
                        <input
                          type="checkbox"
                          checked={selectedFees.includes(fee.id)}
                          onChange={() => handleFeeSelection(fee.id)}
                          className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-secondary-800">
                        {fee.student?.first_name} {fee.student?.last_name}
                      </div>
                      <div className="text-sm text-secondary-600">
                        Grade {fee.student?.grade_level} • {fee.student?.phone || 'No phone'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {fee.courses && fee.courses.length > 0 ? (
                          fee.courses.map((course, index) => (
                            <div key={course.id} className="flex justify-between items-center">
                              <span className="font-medium text-secondary-800 text-sm">
                                {course.name}
                              </span>
                              <span className="text-xs text-secondary-600">
                                ₹{course.price.toLocaleString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="font-medium text-secondary-800">
                            {fee.course?.name || fee.student?.course?.name || 'No course assigned'}
                          </div>
                        )}
                        {fee.courses && fee.courses.length > 1 && (
                          <div className="text-xs text-primary-600 font-medium">
                            {fee.courses.length} courses enrolled
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-secondary-800 capitalize">{fee.fee_type || 'tuition'}</div>
                      {fee.description && (
                        <div className="text-sm text-secondary-600">{fee.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-secondary-800">₹{(fee.amount || 0).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-success-600">₹{(fee.paid_amount || 0).toLocaleString()}</div>
                      {fee.paid_date && (
                        <div className="text-xs text-success-600">Paid: {new Date(fee.paid_date).toLocaleDateString()}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-danger-600">
                        ₹{Math.max(0, (fee.amount || 0) - (fee.paid_amount || 0)).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-secondary-600">{new Date(fee.due_date).toLocaleDateString()}</div>
                      {fee.paid_date && (
                        <div className="text-xs text-success-600">Paid: {new Date(fee.paid_date).toLocaleDateString()}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(fee.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(fee.status)}`}>
                          {fee.status?.charAt(0).toUpperCase() + fee.status?.slice(1) || 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {(fee.remaining_amount || 0) > 0 && (
                          <button
                            onClick={() => openPaymentModal(fee)}
                            className="flex items-center space-x-1 bg-success-600 hover:bg-success-700 text-white px-3 py-1 rounded text-sm font-medium"
                          >
                            <DollarSign className="w-4 h-4" />
                            <span>Pay Fees</span>
                          </button>
                        )}
                        {(fee.remaining_amount || 0) === 0 && (
                          <span className="text-success-600 text-sm font-medium">✓ Fully Paid</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <DollarSign className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-secondary-600 mb-2">No fee records found</h3>
                    <p className="text-secondary-500">Try adjusting your search or filters, or add a new fee record</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Fee Modal */}
      <AddFeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onFeeAdded={loadAllData}
      />

      {/* Pay Fees Modal */}
      {payingFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Pay Fees</h3>

            <div className="space-y-4">
              <div className="bg-secondary-50 p-4 rounded-lg">
                <div className="font-medium">{payingFee.student?.first_name} {payingFee.student?.last_name}</div>
                <div className="text-sm text-secondary-600">{payingFee.student?.course?.name}</div>
                <div className="text-sm text-secondary-600 capitalize">{payingFee.fee_type}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Total Fee</label>
                  <div className="text-lg font-semibold">₹{payingFee.amount.toLocaleString()}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Already Paid</label>
                  <div className="text-lg font-semibold text-success-600">₹{(payingFee.paid_amount || 0).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Remaining Amount</label>
                <div className="text-lg font-semibold text-danger-600">₹{(payingFee.amount - (payingFee.paid_amount || 0)).toLocaleString()}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  max={payingFee.amount - (payingFee.paid_amount || 0)}
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  placeholder="Enter payment amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">After Payment</label>
                <div className="text-sm">
                  <div>New Paid Amount: ₹{((payingFee.paid_amount || 0) + paymentAmount).toLocaleString()}</div>
                  <div>Remaining: ₹{Math.max(0, payingFee.amount - (payingFee.paid_amount || 0) - paymentAmount).toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setPayingFee(null)}
                className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50"
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                disabled={loading || paymentAmount <= 0}
                className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeManagement;