import React, { useState, useEffect } from 'react';
import { X, DollarSign, User, BookOpen, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AddFeePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFeeAdded: () => void;
}

const AddFeePaymentModal: React.FC<AddFeePaymentModalProps> = ({
  isOpen,
  onClose,
  onFeeAdded
}) => {
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    fee_amount: 0,
    payment_amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    description: '',
    due_date: new Date().toISOString().split('T')[0]
  });

  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadStudents();
      loadCourses();
    }
  }, [isOpen]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('status', 'active')
        .order('first_name');
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    setSelectedStudent(student);
    setFormData(prev => ({ ...prev, student_id: studentId }));
  };

  const handleCourseChange = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    setSelectedCourse(course);
    setFormData(prev => ({ 
      ...prev, 
      course_id: courseId,
      fee_amount: course?.price || 0,
      description: course ? `Course fee for ${course.name}` : ''
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'fee_amount' || name === 'payment_amount' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create fee record
      const { data: feeRecord, error: feeError } = await supabase
        .from('fees')
        .insert([{
          student_id: formData.student_id,
          amount: formData.fee_amount,
          paid_amount: formData.payment_amount,
          status: formData.payment_amount >= formData.fee_amount ? 'paid' : 
                  formData.payment_amount > 0 ? 'partial' : 'unpaid',
          due_date: formData.due_date,
          paid_date: formData.payment_amount > 0 ? formData.payment_date : null,
          payment_method: formData.payment_amount > 0 ? formData.payment_method : null,
          fee_type: 'tuition',
          description: formData.description,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (feeError) throw feeError;

      // Create receipt record if payment was made
      if (formData.payment_amount > 0) {
        const receiptNumber = `RCP-${Date.now()}`;
        
        await supabase
          .from('fee_receipts')
          .insert([{
            receipt_number: receiptNumber,
            student_id: formData.student_id,
            fee_id: feeRecord.id,
            student_name: `${selectedStudent?.first_name} ${selectedStudent?.last_name}`,
            course_name: selectedCourse?.name || 'General Fee',
            amount_paid: formData.payment_amount,
            payment_date: formData.payment_date,
            payment_method: formData.payment_method,
            description: formData.description,
            created_at: new Date().toISOString()
          }]);
      }

      onFeeAdded();
      
      // Reset form
      setFormData({
        student_id: '',
        course_id: '',
        fee_amount: 0,
        payment_amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        description: '',
        due_date: new Date().toISOString().split('T')[0]
      });
      setSelectedStudent(null);
      setSelectedCourse(null);
      
    } catch (error: any) {
      setError(error.message || 'Failed to create fee payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-large max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div>
            <h2 className="text-2xl font-bold text-secondary-800">Add Fee Payment</h2>
            <p className="text-secondary-600 mt-1">Create fee record and payment receipt</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-secondary-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0" />
              <p className="text-danger-700 text-sm">{error}</p>
            </div>
          )}

          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Select Student *
            </label>
            <select
              value={formData.student_id}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Choose a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} - {student.grade_level}
                </option>
              ))}
            </select>
          </div>

          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Select Course *
            </label>
            <select
              value={formData.course_id}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Choose a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} - ₹{course.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Fee Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Total Fee Amount *
              </label>
              <input
                type="number"
                name="fee_amount"
                value={formData.fee_amount}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Payment Amount *
              </label>
              <input
                type="number"
                name="payment_amount"
                value={formData.payment_amount}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="0"
                step="0.01"
                max={formData.fee_amount}
                required
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Payment Date *
              </label>
              <input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Payment Method *
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Due Date *
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Additional notes about this fee payment..."
            />
          </div>

          {/* Summary */}
          {selectedStudent && selectedCourse && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h4 className="font-medium text-primary-800 mb-2">Payment Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-primary-700">Student:</span>
                  <span className="font-medium text-primary-800">{selectedStudent.first_name} {selectedStudent.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-700">Course:</span>
                  <span className="font-medium text-primary-800">{selectedCourse.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-700">Total Fee:</span>
                  <span className="font-medium text-primary-800">₹{formData.fee_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-700">Payment Amount:</span>
                  <span className="font-medium text-primary-800">₹{formData.payment_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-primary-300 pt-1 mt-1">
                  <span className="text-primary-700">Remaining:</span>
                  <span className="font-bold text-primary-900">₹{(formData.fee_amount - formData.payment_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-secondary-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-secondary-300 text-secondary-700 rounded-xl hover:bg-secondary-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.student_id || !formData.course_id}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Fee & Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFeePaymentModal;
