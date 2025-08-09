import React, { useEffect, useState } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Upload, X, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Transaction {
  id?: string;
  type: 'income' | 'expense';
  date: string;
  amount: number;
  category: string;
  payment_mode: string;
  description: string;
  image_url?: string;
  created_at?: string;
}

const Accounts: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [formData, setFormData] = useState<Transaction>({
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: '',
    payment_mode: '',
    description: '',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205') {
          // Table doesn't exist, show helpful message
          console.warn('Transactions table not found. Please run the database migration.');
          setTransactions([]);
          return;
        }
        throw error;
      }
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = (type: 'income' | 'expense') => {
    setModalType(type);
    setFormData({
      type,
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      category: '',
      payment_mode: '',
      description: '',
      image_url: ''
    });
    setImageFile(null);
    setShowAddModal(true);
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `transaction-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploading(true);

      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      const { error } = await supabase
        .from('transactions')
        .insert([{
          ...formData,
          image_url: imageUrl
        }]);

      if (error) {
        if (error.code === 'PGRST205') {
          alert('Database table not found. Please contact administrator to run database migrations.');
          return;
        }
        throw error;
      }

      setShowAddModal(false);
      loadTransactions();
      alert('Transaction added successfully!');
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      alert(`Failed to add transaction: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const calculateSummary = () => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses
    };
  };

  const summary = calculateSummary();

  const expenseCategories = [
    'Rent', 'Utilities', 'Salaries', 'Office Supplies', 'Marketing', 
    'Maintenance', 'Travel', 'Food & Beverages', 'Equipment', 'Other'
  ];

  const incomeCategories = [
    'Student Fees', 'Course Sales', 'Consulting', 'Grants', 
    'Donations', 'Investment Returns', 'Other Income'
  ];

  const paymentModes = [
    'Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 
    'UPI', 'Cheque', 'Online Payment'
  ];

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800">Accounts Management</h1>
          <p className="text-secondary-600 mt-1">Track income, expenses, and financial overview</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleAddTransaction('income')}
            className="flex items-center space-x-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-soft hover:shadow-medium"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Income</span>
          </button>
          <button
            onClick={() => handleAddTransaction('expense')}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-soft hover:shadow-medium"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-secondary-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Income</p>
              <p className="text-2xl font-bold text-success-600">₹{summary.totalIncome.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-secondary-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">₹{summary.totalExpenses.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-secondary-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Net Balance</p>
              <p className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-success-600' : 'text-red-600'}`}>
                ₹{summary.netBalance.toLocaleString()}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              summary.netBalance >= 0 ? 'bg-success-100' : 'bg-red-100'
            }`}>
              <DollarSign className={`w-6 h-6 ${summary.netBalance >= 0 ? 'text-success-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-secondary-200">
          <h2 className="text-xl font-bold text-secondary-800">Recent Transactions</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-secondary-600 mt-2">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-secondary-400" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-800 mb-2">No Transactions Found</h3>
            <p className="text-secondary-600 mb-4">
              Start by adding your first income or expense transaction.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h4 className="font-semibold text-blue-800 mb-2">Database Setup Required</h4>
              <p className="text-blue-700 text-sm mb-2">
                If you're seeing this message, the transactions table may not exist in your database.
              </p>
              <p className="text-blue-600 text-sm">
                Please run the SQL file: <code className="bg-blue-100 px-1 rounded">database/add-transactions-table.sql</code> in your Supabase SQL Editor.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50 border-b border-secondary-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-secondary-700">Date</th>
                  <th className="text-left py-3 px-6 font-medium text-secondary-700">Type</th>
                  <th className="text-left py-3 px-6 font-medium text-secondary-700">Category</th>
                  <th className="text-left py-3 px-6 font-medium text-secondary-700">Amount</th>
                  <th className="text-left py-3 px-6 font-medium text-secondary-700">Payment Mode</th>
                  <th className="text-left py-3 px-6 font-medium text-secondary-700">Description</th>
                  <th className="text-left py-3 px-6 font-medium text-secondary-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                    <td className="py-4 px-6 text-secondary-800">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'income' 
                          ? 'bg-success-100 text-success-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-secondary-800">{transaction.category}</td>
                    <td className="py-4 px-6">
                      <span className={`font-semibold ${
                        transaction.type === 'income' ? 'text-success-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-secondary-600">{transaction.payment_mode}</td>
                    <td className="py-4 px-6 text-secondary-600 max-w-xs truncate">
                      {transaction.description}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {transaction.image_url && (
                          <button className="p-1 text-primary-600 hover:text-primary-700">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <h2 className="text-2xl font-bold text-secondary-800">
                Add New {modalType === 'income' ? 'Income' : 'Expense'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-secondary-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-secondary-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Date *
                </label>
                <div className="relative">
                  <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  {modalType === 'income' ? 'Income' : 'Expense'} Type *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select Category</option>
                  {(modalType === 'income' ? incomeCategories : expenseCategories).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-500 font-medium">₹</span>
                  <input
                    type="number"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Payment Mode *
                </label>
                <select
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select Payment Mode</option>
                  {paymentModes.map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>

              {/* Description/Remarks */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Remarks
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Add any additional notes or remarks..."
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Attach Image (Receipt/Bill)
                </label>
                <div className="border-2 border-dashed border-secondary-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-secondary-400 mx-auto mb-2" />
                    <p className="text-secondary-600">Click to upload image</p>
                    <p className="text-xs text-secondary-500 mt-1">PNG, JPG up to 10MB</p>
                  </label>
                  {imageFile && (
                    <p className="text-sm text-primary-600 mt-2">Selected: {imageFile.name}</p>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 border border-secondary-300 text-secondary-700 rounded-xl hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className={`px-6 py-3 text-white rounded-xl transition-colors disabled:opacity-50 ${
                    modalType === 'income'
                      ? 'bg-success-600 hover:bg-success-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {uploading ? 'Adding...' : `Add ${modalType === 'income' ? 'Income' : 'Expense'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
