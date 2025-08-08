import React from 'react';

interface PrintableReceiptProps {
  receipt: any;
  student: any;
  parent: any;
  course: any;
  onClose: () => void;
}

const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  receipt,
  student,
  parent,
  course,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  const courseFee = course?.price || 0;
  const amountPaying = receipt.amount || 0;
  const remaining = Math.max(0, courseFee - amountPaying);
  const taxAmount = receipt.tax_amount || 0;
  const totalAmount = receipt.total_amount || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header with close button - hidden in print */}
          <div className="flex justify-between items-center mb-6 print:hidden">
            <h2 className="text-xl font-bold">Receipt Preview</h2>
            <div className="space-x-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Print Receipt
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50"
              >
                Close
              </button>
            </div>
          </div>

          {/* Printable Receipt */}
          <div className="print:p-0 print:m-0">
            {/* Header */}
            <div className="text-center border-b-2 border-secondary-800 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-secondary-800">STUDENT MANAGEMENT SYSTEM</h1>
              <p className="text-secondary-600">Fee Payment Receipt</p>
              <p className="text-sm text-secondary-500">Receipt No: {receipt.id?.slice(-8).toUpperCase()}</p>
              <p className="text-sm text-secondary-500">Date: {formatDate(receipt.created_at)}</p>
            </div>

            {/* Student & Parent Info */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-secondary-800 mb-2">Student Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {student?.first_name} {student?.last_name}</p>
                  <p><span className="font-medium">Grade:</span> {student?.grade_level}</p>
                  <p><span className="font-medium">DOB:</span> {student?.date_of_birth ? formatDate(student.date_of_birth) : '-'}</p>
                  <p><span className="font-medium">Gender:</span> {student?.gender || '-'}</p>
                  <p><span className="font-medium">Phone:</span> {student?.phone || '-'}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-secondary-800 mb-2">Parent/Guardian Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {parent?.first_name} {parent?.last_name}</p>
                  <p><span className="font-medium">Relationship:</span> {parent?.relationship_to_student || 'Parent'}</p>
                  <p><span className="font-medium">Phone:</span> {parent?.phone}</p>
                  <p><span className="font-medium">Email:</span> {parent?.email}</p>
                  <p><span className="font-medium">Occupation:</span> {parent?.occupation || '-'}</p>
                </div>
              </div>
            </div>

            {/* Course & Fee Details */}
            <div className="mb-6">
              <h3 className="font-semibold text-secondary-800 mb-3">Course & Fee Details</h3>
              <div className="border border-secondary-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-sm font-medium">Course</th>
                      <th className="text-right px-4 py-2 text-sm font-medium">Total Fee</th>
                      <th className="text-right px-4 py-2 text-sm font-medium">Amount Paying</th>
                      <th className="text-right px-4 py-2 text-sm font-medium">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-3">
                        <div className="font-medium">{course?.name}</div>
                        <div className="text-sm text-secondary-600">{course?.description}</div>
                      </td>
                      <td className="text-right px-4 py-3 font-medium">₹{courseFee.toLocaleString()}</td>
                      <td className="text-right px-4 py-3 font-medium">₹{amountPaying.toLocaleString()}</td>
                      <td className="text-right px-4 py-3 font-medium text-danger-600">₹{remaining.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t-2 border-secondary-800 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-secondary-600">Amount Paying:</span>
                <span className="font-medium">₹{amountPaying.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-secondary-600">Tax ({((receipt.tax_rate || 0) * 100).toFixed(1)}%):</span>
                <span className="font-medium">₹{taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                <span>Total Amount:</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
              {remaining > 0 && (
                <div className="flex justify-between items-center mt-2 text-danger-600">
                  <span className="font-medium">Remaining Balance:</span>
                  <span className="font-bold">₹{remaining.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-secondary-200 text-center text-sm text-secondary-500">
              <p>Thank you for your payment!</p>
              <p>For any queries, please contact the administration office.</p>
              {receipt.notes && (
                <div className="mt-2">
                  <p className="font-medium">Notes:</p>
                  <p>{receipt.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableReceipt;
