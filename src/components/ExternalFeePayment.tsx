import React, { useState, useEffect } from 'react';
import { Upload, DollarSign, User, Phone, Mail, BookOpen, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  grade_level: string;
  course?: {
    id: string;
    name: string;
    price: number;
  };
  parent?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

interface FeePayment {
  student_id: string;
  student_name: string;
  student_class: string;
  course_name: string;
  course_fee: number;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id?: string;
  payment_proof_url?: string;
  remarks?: string;
}

const ExternalFeePayment: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    student_id: '',
    payment_amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    transaction_id: '',
    remarks: '',
    payment_proof: null as File | null
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          course:courses(id, name, price),
          parent:parents(first_name, last_name, email, phone)
        `)
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleStudentSelect = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    setSelectedStudent(student || null);
    setFormData(prev => ({
      ...prev,
      student_id: studentId,
      payment_amount: student?.course?.price?.toString() || ''
    }));
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `payment-proof-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      setLoading(true);

      let paymentProofUrl = '';
      if (formData.payment_proof) {
        paymentProofUrl = await handleImageUpload(formData.payment_proof);
      }

      const paymentData: FeePayment = {
        student_id: selectedStudent.id,
        student_name: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
        student_class: selectedStudent.grade_level,
        course_name: selectedStudent.course?.name || '',
        course_fee: selectedStudent.course?.price || 0,
        parent_name: `${selectedStudent.parent?.first_name || ''} ${selectedStudent.parent?.last_name || ''}`.trim(),
        parent_email: selectedStudent.parent?.email || '',
        parent_phone: selectedStudent.parent?.phone || '',
        payment_amount: parseFloat(formData.payment_amount),
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        transaction_id: formData.transaction_id,
        payment_proof_url: paymentProofUrl,
        remarks: formData.remarks
      };

      // Save to external_fee_payments table
      const { error } = await supabase
        .from('external_fee_payments')
        .insert([paymentData]);

      if (error) throw error;

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Failed to submit payment information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-large p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success-600" />
          </div>
          <h2 className="text-2xl font-bold text-secondary-800 mb-2">Payment Submitted Successfully!</h2>
          <p className="text-secondary-600 mb-6">
            Thank you for submitting your payment information. Our team will verify the payment and update your records shortly.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                student_id: '',
                payment_amount: '',
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: 'bank_transfer',
                transaction_id: '',
                remarks: '',
                payment_proof: null
              });
              setSelectedStudent(null);
            }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Submit Another Payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-secondary-800 mb-2">Fee Payment Portal</h1>
          <p className="text-secondary-600">Submit your fee payment information securely</p>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-xl shadow-large p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Select Student *
              </label>
              <select
                value={formData.student_id}
                onChange={(e) => handleStudentSelect(e.target.value)}
                className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Choose a student</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} - Grade {student.grade_level}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Details */}
            {selectedStudent && (
              <div className="bg-secondary-50 rounded-xl p-4">
                <h3 className="font-semibold text-secondary-800 mb-3">Student Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-secondary-600">Student:</span>
                    <span className="ml-2 font-medium">{selectedStudent.first_name} {selectedStudent.last_name}</span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Class:</span>
                    <span className="ml-2 font-medium">Grade {selectedStudent.grade_level}</span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Course:</span>
                    <span className="ml-2 font-medium">{selectedStudent.course?.name || 'Not assigned'}</span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Course Fee:</span>
                    <span className="ml-2 font-medium text-primary-600">QAR {selectedStudent.course?.price?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  value={formData.payment_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_amount: e.target.value }))}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Transaction ID
                </label>
                <input
                  type="text"
                  value={formData.transaction_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter transaction ID"
                />
              </div>
            </div>

            {/* Payment Proof Upload */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Payment Proof (Receipt/Screenshot)
              </label>
              <div className="border-2 border-dashed border-secondary-300 rounded-xl p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData(prev => ({ ...prev, payment_proof: file }));
                    }
                  }}
                  className="hidden"
                  id="payment-proof"
                />
                <label htmlFor="payment-proof" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-secondary-400 mx-auto mb-2" />
                  <p className="text-sm text-secondary-600">
                    {formData.payment_proof ? formData.payment_proof.name : 'Click to upload payment proof'}
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">PNG, JPG up to 10MB</p>
                </label>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Remarks (Optional)
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Any additional information..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || uploadingImage || !selectedStudent}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-400 text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {loading || uploadingImage ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{uploadingImage ? 'Uploading...' : 'Submitting...'}</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5" />
                  <span>Submit Payment Information</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-secondary-600">
          <p>Your payment information will be verified by our team within 24 hours.</p>
          <p className="mt-1">For any queries, please contact us at support@school.com</p>
        </div>
      </div>
    </div>
  );
};

export default ExternalFeePayment;

// Database schema for external_fee_payments table:
/*
CREATE TABLE IF NOT EXISTS external_fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  student_name VARCHAR(200) NOT NULL,
  student_class VARCHAR(50) NOT NULL,
  course_name VARCHAR(200),
  course_fee DECIMAL(10,2),
  parent_name VARCHAR(200),
  parent_email VARCHAR(255),
  parent_phone VARCHAR(20),
  payment_amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(100),
  payment_proof_url TEXT,
  remarks TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES staff(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true);

-- Create policy for public upload
CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs');
*/
