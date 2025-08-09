import React, { useEffect, useState } from 'react';
import { Printer, Download, Search, Calendar, Filter, Receipt, Eye, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AddFeePaymentModal from './modals/AddFeePaymentModal';

interface FeeReceipt {
  id: string;
  receipt_number: string;
  student_id: string;
  fee_id: string;
  student_name: string;
  course_name: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  description: string;
  created_at: string;
}

const FeeReceipts: React.FC = () => {
  const [receipts, setReceipts] = useState<FeeReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    loadReceipts();
  }, [dateRange]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fee_receipts')
        .select('*')
        .gte('payment_date', dateRange.startDate)
        .lte('payment_date', dateRange.endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error('Error loading receipts:', error);
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const printReceipt = (receipt: FeeReceipt) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Receipt - ${receipt.receipt_number}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .receipt {
            max-width: 600px;
            margin: 0 auto;
            border: 2px solid #333;
            padding: 30px;
            background: white;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .school-name {
            font-size: 28px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
          }
          .school-subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 10px;
          }
          .receipt-title {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-top: 15px;
          }
          .receipt-number {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
          }
          .details {
            margin: 30px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #eee;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: bold;
            color: #333;
            width: 40%;
          }
          .detail-value {
            color: #666;
            width: 60%;
            text-align: right;
          }
          .amount-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            border: 1px solid #dee2e6;
          }
          .amount-paid {
            font-size: 24px;
            font-weight: bold;
            color: #28a745;
            text-align: center;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #333;
            text-align: center;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
          }
          .signature {
            text-align: center;
            width: 45%;
          }
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
            font-size: 12px;
            color: #666;
          }
          .print-date {
            font-size: 12px;
            color: #999;
            margin-top: 20px;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .receipt { border: 1px solid #333; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="school-name">EduCare Institute</div>
            <div class="school-subtitle">Student Management System</div>
            <div class="receipt-title">FEE PAYMENT RECEIPT</div>
            <div class="receipt-number">Receipt No: ${receipt.receipt_number}</div>
          </div>

          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Student Name:</span>
              <span class="detail-value">${receipt.student_name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Course:</span>
              <span class="detail-value">${receipt.course_name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Date:</span>
              <span class="detail-value">${new Date(receipt.payment_date).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${receipt.payment_method}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Description:</span>
              <span class="detail-value">${receipt.description}</span>
            </div>
          </div>

          <div class="amount-section">
            <div class="amount-paid">Amount Paid: ₹${receipt.amount_paid.toLocaleString()}</div>
          </div>

          <div class="signature-section">
            <div class="signature">
              <div class="signature-line">Student Signature</div>
            </div>
            <div class="signature">
              <div class="signature-line">Authorized Signature</div>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0; font-size: 14px; color: #666;">
              Thank you for your payment. Please keep this receipt for your records.
            </p>
            <div class="print-date">
              Generated on: ${new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const downloadReceiptPDF = async (receipt: FeeReceipt) => {
    // For now, we'll use the print functionality
    // In a production environment, you might want to use a library like jsPDF
    printReceipt(receipt);
  };

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800 flex items-center space-x-3">
            <Receipt className="w-8 h-8 text-primary-600" />
            <span>Fee Receipts</span>
          </h1>
          <p className="text-secondary-600 mt-1">Print and manage fee payment receipts</p>
        </div>
        <button
          onClick={() => setShowAddFeeModal(true)}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-soft hover:shadow-medium"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Fee Payment</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-secondary-200 p-4 lg:p-6 shadow-soft">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                placeholder="Search by student name, course, or receipt number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-secondary-600" />
              <label className="text-sm font-medium text-secondary-700">From:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-secondary-700">To:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200 p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary-700">Total Receipts</p>
            <p className="text-3xl font-bold text-primary-800">{filteredReceipts.length}</p>
            <p className="text-sm text-primary-600 mt-1">
              Total Amount: ₹{filteredReceipts.reduce((sum, r) => sum + r.amount_paid, 0).toLocaleString()}
            </p>
          </div>
          <div className="w-16 h-16 bg-primary-200 rounded-full flex items-center justify-center">
            <Receipt className="w-8 h-8 text-primary-700" />
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-secondary-200">
          <h3 className="text-xl font-semibold text-secondary-800">Fee Payment Receipts</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-secondary-600 mt-2">Loading receipts...</p>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
            <p className="text-secondary-600">No fee receipts found for the selected criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50 border-b border-primary-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-primary-800">Receipt No.</th>
                  <th className="text-left py-3 px-6 font-medium text-primary-800">Student</th>
                  <th className="text-left py-3 px-6 font-medium text-primary-800">Course</th>
                  <th className="text-left py-3 px-6 font-medium text-primary-800">Amount</th>
                  <th className="text-left py-3 px-6 font-medium text-primary-800">Date</th>
                  <th className="text-left py-3 px-6 font-medium text-primary-800">Payment Method</th>
                  <th className="text-left py-3 px-6 font-medium text-primary-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="border-b border-secondary-100 hover:bg-primary-50">
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm bg-secondary-100 px-2 py-1 rounded">
                        {receipt.receipt_number}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-secondary-800">{receipt.student_name}</p>
                        <p className="text-xs text-secondary-600">ID: {receipt.student_id}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-secondary-800">{receipt.course_name}</td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-success-600">
                        ₹{receipt.amount_paid.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-secondary-600">
                      {new Date(receipt.payment_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-secondary-600">{receipt.payment_method}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => printReceipt(receipt)}
                          className="flex items-center space-x-1 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Print</span>
                        </button>
                        <button
                          onClick={() => downloadReceiptPDF(receipt)}
                          className="flex items-center space-x-1 bg-secondary-600 hover:bg-secondary-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Fee Payment Modal */}
      {showAddFeeModal && (
        <AddFeePaymentModal
          isOpen={showAddFeeModal}
          onClose={() => setShowAddFeeModal(false)}
          onFeeAdded={() => {
            loadReceipts();
            setShowAddFeeModal(false);
          }}
        />
      )}
    </div>
  );
};

export default FeeReceipts;
