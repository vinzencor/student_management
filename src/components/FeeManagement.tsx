import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, AlertTriangle, Clock, Plus, Search, Filter, Mail, Send } from 'lucide-react';
import { DataService } from '../services/dataService';
import { EmailService } from '../services/emailService';
import type { Fee } from '../lib/supabase';
import AddFeeModal from './modals/AddFeeModal';

const FeeManagement: React.FC = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [selectedFees, setSelectedFees] = useState<string[]>([]);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const data = await DataService.getFees();
      setFees(data || []);
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFees = fees.filter(fee => {
    const matchesSearch =
      fee.student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.fee_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || fee.status === statusFilter;

    return matchesSearch && matchesStatus;
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
    <div className="space-y-6">
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
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by student name or fee type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-secondary-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
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
                <th className="text-left px-6 py-4 text-sm font-semibold text-secondary-600">Fee Type</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-secondary-600">Amount</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-secondary-600">Due Date</th>
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
                      <div className="text-sm text-secondary-600">{fee.student?.grade_level}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-secondary-800 capitalize">{fee.fee_type}</div>
                      {fee.description && (
                        <div className="text-sm text-secondary-600">{fee.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-secondary-800">${fee.amount.toFixed(2)}</div>
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
                          {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {fee.status !== 'paid' && (
                          <button
                            onClick={() => handleSendReminder(fee.id)}
                            className="flex items-center space-x-1 text-warning-600 hover:text-warning-700 text-sm font-medium"
                          >
                            <Mail className="w-4 h-4" />
                            <span>Remind</span>
                          </button>
                        )}
                        <button className="text-secondary-600 hover:text-secondary-700 text-sm font-medium">
                          Details
                        </button>
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
        onFeeAdded={fetchFees}
      />
    </div>
  );
};

export default FeeManagement;