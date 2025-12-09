import React, { useEffect, useState } from 'react';
import { Printer, Download, Search, Calendar, Filter, Receipt, Eye, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AddFeePaymentModal from './modals/AddFeePaymentModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, receiptId: string, receiptNumber: string}>({
    show: false,
    receiptId: '',
    receiptNumber: ''
  });

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
            <div style="text-align: center; margin-bottom: 10px;">
              <img src="/Logo.jpeg" alt="School Logo" style="height: 60px; width: auto; margin: 0 auto; display: block;" onerror="this.style.display='none';" />
            </div>
            <div class="receipt-title">FEE PAYMENT RECEIPT</div>
            <div class="receipt-number">Receipt No: ${receipt.receipt_number}</div>
            <div style="font-size: 12px; color: #666; margin-top: 10px; line-height: 1.4;">
              <strong>School Address:</strong><br>
              123 Education Street, Knowledge District<br>
              Doha, Qatar - 12345<br>
              Phone: +974 1234 5678 | Email: info@school.edu.qa
            </div>
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
            <div class="amount-paid">Amount Paid: QAR ${receipt.amount_paid.toLocaleString()}</div>
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
    try {
      // Create a temporary div with the receipt HTML
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';

      const receiptHTML = `
        <div style="font-family: Arial, sans-serif; padding: 30px; background: white; width: 100%; box-sizing: border-box;">
          <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="text-align: center; margin-bottom: 10px;">
              <img src="/Logo.jpeg" alt="School Logo" style="height: 60px; width: auto; margin: 0 auto; display: block;" onerror="this.style.display='none';" />
            </div>
            <div style="font-size: 24px; font-weight: bold; color: #2563eb; margin-top: 15px;">FEE PAYMENT RECEIPT</div>
            <div style="font-size: 14px; color: #666; margin-top: 5px;">Receipt No: ${receipt.receipt_number}</div>
            <div style="font-size: 12px; color: #666; margin-top: 10px; line-height: 1.4;">
              <strong>School Address:</strong><br>
              123 Education Street, Knowledge District<br>
              Doha, Qatar - 12345<br>
              Phone: +974 1234 5678 | Email: info@school.edu.qa
            </div>
          </div>

          <div style="margin: 30px 0;">
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee;">
              <span style="font-weight: bold; color: #333; width: 40%;">Student Name:</span>
              <span style="color: #666; width: 60%; text-align: right;">${receipt.student_name}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee;">
              <span style="font-weight: bold; color: #333; width: 40%;">Course:</span>
              <span style="color: #666; width: 60%; text-align: right;">${receipt.course_name}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee;">
              <span style="font-weight: bold; color: #333; width: 40%;">Payment Date:</span>
              <span style="color: #666; width: 60%; text-align: right;">${new Date(receipt.payment_date).toLocaleDateString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee;">
              <span style="font-weight: bold; color: #333; width: 40%;">Payment Method:</span>
              <span style="color: #666; width: 60%; text-align: right;">${receipt.payment_method}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0;">
              <span style="font-weight: bold; color: #333; width: 40%;">Description:</span>
              <span style="color: #666; width: 60%; text-align: right;">${receipt.description}</span>
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; border: 1px solid #dee2e6;">
            <div style="font-size: 24px; font-weight: bold; color: #28a745; text-align: center;">
              Amount Paid: QAR ${receipt.amount_paid.toLocaleString()}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 40px;">
            <div style="text-align: center; width: 45%;">
              <div style="border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; font-size: 12px; color: #666;">
                Student Signature
              </div>
            </div>
            <div style="text-align: center; width: 45%;">
              <div style="border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; font-size: 12px; color: #666;">
                Authorized Signature
              </div>
            </div>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              Thank you for your payment. Please keep this receipt for your records.
            </p>
            <div style="font-size: 12px; color: #999; margin-top: 20px;">
              Generated on: ${new Date().toLocaleString()}
            </div>
          </div>
        </div>
      `;

      tempDiv.innerHTML = receiptHTML;
      document.body.appendChild(tempDiv);

      // Use html2canvas to convert to image, then jsPDF to create PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Download the PDF
      pdf.save(`Fee_Receipt_${receipt.receipt_number}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleDeleteReceipt = (receiptId: string, receiptNumber: string) => {
    setDeleteConfirm({
      show: true,
      receiptId,
      receiptNumber
    });
  };

  const confirmDeleteReceipt = async () => {
    try {
      setLoading(true);

      // Delete the fee receipt from the database
      const { error } = await supabase
        .from('fee_receipts')
        .delete()
        .eq('id', deleteConfirm.receiptId);

      if (error) throw error;

      // Reload receipts to reflect the deletion
      await loadReceipts();

      // Close confirmation dialog
      setDeleteConfirm({ show: false, receiptId: '', receiptNumber: '' });

      console.log('Receipt deleted successfully');
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('Failed to delete receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancelDeleteReceipt = () => {
    setDeleteConfirm({ show: false, receiptId: '', receiptNumber: '' });
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
              Total Amount: QAR {filteredReceipts.reduce((sum, r) => sum + r.amount_paid, 0).toLocaleString()}
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
                        QAR {receipt.amount_paid.toLocaleString()}
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
                        <button
                          onClick={() => handleDeleteReceipt(receipt.id, receipt.receipt_number)}
                          className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm"
                          title="Delete Receipt"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-800">Delete Receipt</h3>
                <p className="text-sm text-secondary-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-secondary-700">
                Are you sure you want to delete receipt <strong>{deleteConfirm.receiptNumber}</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2">
                ⚠️ This will permanently remove the receipt from the system.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleteReceipt}
                className="px-4 py-2 text-secondary-600 hover:text-secondary-800 font-medium transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteReceipt}
                disabled={loading}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Receipt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeReceipts;
