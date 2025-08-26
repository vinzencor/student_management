import React, { useState, useEffect } from 'react';
import { Upload, DollarSign, User, Phone, Mail, BookOpen, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PaymentLinkDetails {
  link_id: string;
  lead_id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  student_name: string;
  student_class: string;
  course_name?: string;
  course_fee?: number;
  is_valid: boolean;
  expires_at: string;
}

interface ExternalPaymentFormProps {
  token: string;
}

const ExternalPaymentForm: React.FC<ExternalPaymentFormProps> = ({ token }) => {
  const [linkDetails, setLinkDetails] = useState<PaymentLinkDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    payment_amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    transaction_id: '',
    payment_proof: null as File | null,
    remarks: ''
  });

  useEffect(() => {
    fetchLinkDetails();
  }, [token]);

  const fetchLinkDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('external_payment_links')
        .select('*')
        .eq('link_token', token)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Invalid or expired payment link');
        } else {
          throw error;
        }
        return;
      }

      if (data) {
        const details = {
          link_id: data.id,
          lead_id: data.lead_id,
          parent_name: data.parent_name,
          parent_email: data.parent_email,
          parent_phone: data.parent_phone,
          student_name: data.student_name,
          student_class: data.student_class,
          course_name: data.course_name,
          course_fee: data.course_fee,
          is_valid: true,
          expires_at: data.expires_at
        };

        setLinkDetails(details);

        // Pre-fill payment amount if course fee is available
        if (details.course_fee) {
          setFormData(prev => ({
            ...prev,
            payment_amount: details.course_fee.toString()
          }));
        }
      } else {
        setError('Invalid or expired payment link');
      }
    } catch (error) {
      console.error('Error fetching link details:', error);
      setError('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }

    setFormData(prev => ({ ...prev, payment_proof: file }));
  };

  const uploadPaymentProof = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = fileName; // Just the filename, not nested path

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);

      // Provide specific error messages
      if (uploadError.message?.includes('Bucket not found')) {
        throw new Error('Storage not configured. Please contact school administration.');
      } else if (uploadError.message?.includes('File size')) {
        throw new Error('File is too large. Please use a file smaller than 10MB.');
      } else if (uploadError.message?.includes('mime type')) {
        throw new Error('Invalid file type. Please upload an image file (PNG, JPG, etc.).');
      } else {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
    }

    const { data } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkDetails || !linkDetails.is_valid) {
      setError('Invalid or expired payment link');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let paymentProofUrl = '';

      // Upload payment proof if provided
      if (formData.payment_proof) {
        try {
          setUploadingImage(true);
          paymentProofUrl = await uploadPaymentProof(formData.payment_proof);
          setUploadingImage(false);
        } catch (uploadError) {
          setUploadingImage(false);
          console.error('File upload failed:', uploadError);
          setError('Failed to upload payment proof. Please try again or contact support.');
          return;
        }
      }

      // Get parent information from form (will be filled by parent)
      const parentName = formData.parent_name || linkDetails.parent_name || 'Parent';
      const parentEmail = formData.parent_email || linkDetails.parent_email || '';
      const parentPhone = formData.parent_phone || linkDetails.parent_phone || '';

      // Try to find existing student record
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .ilike('first_name', linkDetails.student_name.split(' ')[0])
        .ilike('last_name', linkDetails.student_name.split(' ').slice(1).join(' ') || '')
        .limit(1)
        .maybeSingle();

      // Prepare payment data
      const paymentData = {
        student_id: studentData?.id || null,
        student_name: linkDetails.student_name,
        student_class: linkDetails.student_class,
        course_name: linkDetails.course_name || '',
        course_fee: linkDetails.course_fee || 0,
        parent_name: parentName,
        parent_email: parentEmail,
        parent_phone: parentPhone,
        payment_amount: parseFloat(formData.payment_amount),
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        transaction_id: formData.transaction_id || null,
        payment_proof_url: paymentProofUrl || null,
        remarks: formData.remarks || null,
        status: 'pending'
      };

      // Save to external_fee_payments table
      const { error } = await supabase
        .from('external_fee_payments')
        .insert([paymentData]);

      if (error) throw error;

      // Update the payment link with parent information and mark as used
      await supabase
        .from('external_payment_links')
        .update({
          status: 'used',
          parent_name: parentName,
          parent_email: parentEmail,
          parent_phone: parentPhone
        })
        .eq('id', linkDetails.link_id);

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting payment:', error);
      setError('Failed to submit payment information. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (error || !linkDetails || !linkDetails.is_valid) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-secondary-800 mb-2">Invalid Link</h2>
            <p className="text-secondary-600 mb-4">
              {error || 'This payment link is invalid or has expired.'}
            </p>
            <p className="text-sm text-secondary-500">
              Please contact the school for a new payment link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-secondary-800 mb-2">Payment Submitted!</h2>
            <p className="text-secondary-600 mb-4">
              Your payment information has been submitted successfully.
            </p>
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-primary-700">
                <strong>What's next?</strong><br />
                Our team will verify your payment and update your records within 1-2 business days.
                You will receive a confirmation email once verified.
              </p>
            </div>
            <p className="text-sm text-secondary-500">
              Thank you for choosing our school!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isExpiringSoon = linkDetails.expires_at && 
    new Date(linkDetails.expires_at).getTime() - Date.now() < 24 * 60 * 60 * 1000; // 24 hours

  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-primary-600 text-white p-6">
            <h1 className="text-2xl font-bold mb-2">Fee Payment Portal</h1>
            <p className="text-primary-100">Submit your payment information securely</p>
          </div>

          {/* Expiration Warning */}
          {isExpiringSoon && (
            <div className="bg-warning-50 border-l-4 border-warning-400 p-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-warning-600 mr-2" />
                <p className="text-warning-700 text-sm">
                  <strong>Notice:</strong> This payment link expires soon. Please submit your payment information as soon as possible.
                </p>
              </div>
            </div>
          )}

          {/* Student Information */}
          <div className="p-6 border-b border-secondary-200">
            <h2 className="text-lg font-semibold text-secondary-800 mb-4">Student Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-secondary-400" />
                <div>
                  <p className="text-sm text-secondary-600">Student Name</p>
                  <p className="font-medium text-secondary-800">{linkDetails.student_name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-secondary-400" />
                <div>
                  <p className="text-sm text-secondary-600">Class/Grade</p>
                  <p className="font-medium text-secondary-800">{linkDetails.student_class}</p>
                </div>
              </div>
              {linkDetails.course_name && (
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-600">Course</p>
                    <p className="font-medium text-secondary-800">{linkDetails.course_name}</p>
                  </div>
                </div>
              )}
              {linkDetails.course_fee && (
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-secondary-400" />
                  <div>
                    <p className="text-sm text-secondary-600">Course Fee</p>
                    <p className="font-medium text-primary-600">QAR {linkDetails.course_fee.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Parent Information */}
            <div>
              <h2 className="text-lg font-semibold text-secondary-800 mb-4">Parent Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Parent Name *
                  </label>
                  <input
                    type="text"
                    name="parent_name"
                    value={formData.parent_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="parent_email"
                    value={formData.parent_email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="parent_phone"
                    value={formData.parent_phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+974 XXXX XXXX"
                    required
                  />
                </div>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-secondary-800">Payment Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Amount Paying (QAR) *
                </label>
                <input
                  type="number"
                  name="payment_amount"
                  value={formData.payment_amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  name="payment_date"
                  value={formData.payment_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  name="transaction_id"
                  value={formData.transaction_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Reference number from bank/UPI"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Payment Proof (Receipt/Screenshot) - Optional
              </label>
              <div className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-secondary-400 mx-auto mb-2" />
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="payment-proof"
                />
                <label
                  htmlFor="payment-proof"
                  className="cursor-pointer text-primary-600 hover:text-primary-700 font-medium"
                >
                  Click to upload payment receipt
                </label>
                <p className="text-xs text-secondary-500 mt-1">PNG, JPG, PDF up to 10MB (Optional)</p>
                {formData.payment_proof && (
                  <p className="text-sm text-success-600 mt-2">
                    ✓ {formData.payment_proof.name}
                  </p>
                )}
                <p className="text-xs text-secondary-400 mt-2">
                  You can submit without uploading a file and provide proof later if needed.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Additional Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                placeholder="Any additional information about the payment..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : uploadingImage ? 'Uploading...' : 'Submit Payment Information'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExternalPaymentForm;
