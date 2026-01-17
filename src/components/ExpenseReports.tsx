import React, { useEffect, useState } from 'react';
import { TrendingDown, Download, Calendar, Filter, DollarSign, Plus, Upload, X, Eye, Search, Settings } from 'lucide-react';
import ManageExpenseTypesModal from './modals/ManageExpenseTypesModal';
import { supabase } from '../lib/supabase';

interface Transaction {
  id?: string;
  type: 'income' | 'expense';
  date: string;
  amount: number;
  category: string;
  sub_category?: string | null;
  related_id?: string | null;
  payment_mode: string;
  description: string;
  image_url?: string | null;
  source?: string; // 'manual', 'external_payment', 'fee_management'
  created_at?: string;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department?: string;
}

const ExpenseReports: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Add Expense Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Transaction>({
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: '',
    sub_category: null,
    related_id: null,
    payment_mode: '',
    description: '',
    image_url: null
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Data for cascading dropdowns
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredSubOptions, setFilteredSubOptions] = useState<any[]>([]);
  const [subSearch, setSubSearch] = useState('');
  const [showSubDropdown, setShowSubDropdown] = useState(false);

  // Expense types management
  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);
  const [showManageTypesModal, setShowManageTypesModal] = useState(false);

  useEffect(() => {
    loadExpenseTransactions();
    loadStaff();
    loadExpenseTypes();
  }, [dateRange]);

  const loadExpenseTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'expense')
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading expense transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load staff for salary-related transactions
  const loadStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email, role, department')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  // Load expense types from database
  const loadExpenseTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_types')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name');

      if (error) {
        console.error('Error loading expense types:', error);
        // Fallback to hardcoded types if database table doesn't exist
        setExpenseTypes([
          { name: 'Rent', hasSubCategory: false },
          { name: 'Utilities', hasSubCategory: false },
          { name: 'Salaries', hasSubCategory: true },
          { name: 'Office Supplies', hasSubCategory: false },
          { name: 'Marketing', hasSubCategory: false },
          { name: 'Maintenance', hasSubCategory: false },
          { name: 'Travel', hasSubCategory: false },
          { name: 'Food & Beverages', hasSubCategory: false },
          { name: 'Equipment', hasSubCategory: false },
          { name: 'Govt Fees', hasSubCategory: false },
          { name: 'Operating Expense', hasSubCategory: false },
          { name: 'Other', hasSubCategory: false }
        ]);
        return;
      }

      // Convert database format to component format
      const formattedTypes = (data || []).map(type => ({
        name: type.name,
        hasSubCategory: type.name === 'Salaries'
      }));

      setExpenseTypes(formattedTypes);
    } catch (error) {
      console.error('Error loading expense types:', error);
    }
  };

  // Handle category change and determine sub-options
  const handleCategoryChange = (category: string) => {
    setFormData({
      ...formData,
      category,
      sub_category: null, // Use null instead of empty string
      related_id: null,   // Use null instead of empty string
      amount: 0
    });
    setSubSearch('');

    // Determine what sub-options to show based on category
    let subOptions: any[] = [];

    if (category === 'Salaries') {
      subOptions = staff.map(member => ({
        id: member.id,
        name: `${member.first_name} ${member.last_name}`,
        email: member.email,
        role: member.role,
        department: member.department,
        type: 'staff'
      }));
    }

    setFilteredSubOptions(subOptions);
    setShowSubDropdown(subOptions.length > 0);
  };

  // Filter sub-options based on search
  const getFilteredSubOptions = () => {
    if (!subSearch) return filteredSubOptions;

    return filteredSubOptions.filter(option =>
      option.name.toLowerCase().includes(subSearch.toLowerCase()) ||
      option.email?.toLowerCase().includes(subSearch.toLowerCase()) ||
      option.role?.toLowerCase().includes(subSearch.toLowerCase())
    );
  };

  // Handle sub-category selection
  const handleSubCategorySelect = (option: any) => {
    setFormData({
      ...formData,
      sub_category: option.name,
      related_id: option.id
    });
    // Keep dropdown open but clear search
    setSubSearch('');
  };

  const handleAddExpense = () => {
    setFormData({
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      category: '',
      sub_category: null, // Use null instead of empty string
      related_id: null,   // Use null instead of empty string
      payment_mode: '',
      description: '',
      image_url: null     // Use null instead of empty string
    });
    setImageFile(null);
    setSubSearch('');
    setShowSubDropdown(false);
    setFilteredSubOptions([]);
    setShowAddModal(true);
  };

  // Image upload functionality
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `transaction-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('transaction-images')
        .upload(filePath, file);

      if (uploadError) {
        // If bucket doesn't exist, create it and try again
        if (uploadError.message?.includes('Bucket not found')) {
          console.log('Creating transaction-images bucket...');

          // Try to create the bucket
          const { error: bucketError } = await supabase.storage.createBucket('transaction-images', {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 5242880 // 5MB
          });

          if (bucketError && !bucketError.message?.includes('already exists')) {
            console.error('Failed to create bucket:', bucketError);
            throw new Error('Failed to create storage bucket. Please contact administrator.');
          }

          // Retry upload after creating bucket
          const { error: retryError } = await supabase.storage
            .from('transaction-images')
            .upload(filePath, file);

          if (retryError) {
            throw retryError;
          }
        } else {
          throw uploadError;
        }
      }

      const { data } = supabase.storage
        .from('transaction-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Image upload error:', error);
      throw new Error(`Failed to upload image: ${error.message || 'Unknown error'}`);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate sub-category selection for categories that require it
    const selectedCategory = expenseTypes.find(cat => cat.name === formData.category);

    if (selectedCategory?.hasSubCategory && !formData.sub_category) {
      alert('Please select a staff member');
      return;
    }

    try {
      setUploading(true);

      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      // Clean up the form data - convert empty strings to null for UUID fields
      const cleanedFormData = {
        ...formData,
        image_url: imageUrl,
        related_id: formData.related_id?.trim() || null, // Convert empty string to null
        sub_category: formData.sub_category?.trim() || null // Convert empty string to null
      };

      // Insert transaction
      const { error } = await supabase
        .from('transactions')
        .insert([cleanedFormData]);

      if (error) {
        if (error.code === 'PGRST205') {
          alert('Database table not found. Please contact administrator to run database migrations.');
          return;
        }
        throw error;
      }

      setShowAddModal(false);
      loadExpenseTransactions();
      alert('Expense transaction added successfully!');
    } catch (error: any) {
      console.error('Error adding expense:', error);
      alert(`Failed to add expense: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const downloadExpenseReport = () => {
    if (transactions.length === 0) {
      alert('No expense transactions found for the selected period');
      return;
    }

    const headers = [
      'Date', 'Category', 'Sub Category', 'Amount', 
      'Payment Mode', 'Description', 'Created At'
    ];
    
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
        t.date,
        t.category,
        t.sub_category || '',
        t.amount,
        t.payment_mode,
        `"${t.description.replace(/"/g, '""')}"`,
        new Date(t.created_at || '').toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expense-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);

  const expenseCategoryNames = expenseTypes.map(type => type.name);

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800 flex items-center space-x-3">
            <TrendingDown className="w-8 h-8 text-red-600" />
            <span>Expense Reports</span>
          </h1>
          <p className="text-secondary-600 mt-1">Detailed expense analysis and reporting</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAddExpense}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl transition-colors shadow-soft hover:shadow-medium"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Expense</span>
          </button>
          <button
            onClick={downloadExpenseReport}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl transition-colors shadow-soft hover:shadow-medium"
          >
            <Download className="w-5 h-5" />
            <span className="font-medium">Download Report</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl border border-secondary-200 p-4 lg:p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-secondary-600" />
            <h3 className="text-lg font-semibold text-secondary-800">Filter Period</h3>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-secondary-700">From:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-secondary-700">To:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200 p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-700">Total Expenses</p>
            <p className="text-3xl font-bold text-red-800">QAR {totalExpenses.toLocaleString()}</p>
            <p className="text-sm text-red-600 mt-1">
              {transactions.length} transactions from {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center">
            <TrendingDown className="w-8 h-8 text-red-700" />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-soft">
        <div className="p-6 border-b border-secondary-200">
          <h3 className="text-xl font-semibold text-secondary-800">Expenses by Category</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {expenseCategoryNames.map(category => {
              const categoryTransactions = transactions.filter(t => t.category === category);
              const categoryTotal = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
              
              if (categoryTotal === 0) return null;
              
              const percentage = totalExpenses > 0 ? (categoryTotal / totalExpenses) * 100 : 0;
              
              return (
                <div key={category} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-secondary-800">{category}</p>
                      <span className="font-bold text-red-700">QAR {categoryTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-red-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-red-600 font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-secondary-600 mt-1">{categoryTransactions.length} transactions</p>
                  </div>
                </div>
              );
            })}
            {transactions.length === 0 && (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                <p className="text-secondary-600">No expense transactions found for the selected period</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-secondary-200">
          <h3 className="text-xl font-semibold text-secondary-800">Expense Transactions</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-secondary-600 mt-2">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <TrendingDown className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
            <p className="text-secondary-600">No expense transactions found for the selected period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-50 border-b border-red-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-red-800">Date</th>
                  <th className="text-left py-3 px-6 font-medium text-red-800">Category</th>
                  <th className="text-left py-3 px-6 font-medium text-red-800">Details</th>
                  <th className="text-left py-3 px-6 font-medium text-red-800">Amount</th>
                  <th className="text-left py-3 px-6 font-medium text-red-800">Payment Mode</th>
                  <th className="text-left py-3 px-6 font-medium text-red-800">Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-secondary-100 hover:bg-red-50">
                    <td className="py-4 px-6 text-secondary-800">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-secondary-800">{transaction.category}</td>
                    <td className="py-4 px-6 text-secondary-600">
                      {transaction.sub_category ? (
                        <div>
                          <p className="font-medium text-secondary-800">{transaction.sub_category}</p>
                          <p className="text-xs text-red-600">
                            {transaction.category === 'Salaries' && 'Staff Salary Payment'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-secondary-500">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-red-600">
                        -QAR {transaction.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-secondary-600">{transaction.payment_mode}</td>
                    <td className="py-4 px-6 text-secondary-600 max-w-xs truncate">
                      {transaction.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-large w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <h2 className="text-xl font-bold text-secondary-800">Add Expense Transaction</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-secondary-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-secondary-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                    className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-secondary-700">
                    Expense Type *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowManageTypesModal(true)}
                    className="flex items-center space-x-1 text-xs text-danger-600 hover:text-danger-700 transition-colors"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Manage Types</span>
                  </button>
                </div>
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="">Select Category</option>
                  {expenseTypes.map(type => (
                    <option key={type.name} value={type.name}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Sub-Category Dropdown */}
              {showSubDropdown && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Select Staff Member *
                  </label>

                  {/* Selected Item Display */}
                  {formData.sub_category ? (
                    <div className="mb-3 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-red-800">
                              {formData.sub_category}
                            </p>
                            <p className="text-xs text-red-600">Staff Salary Payment</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, sub_category: null, related_id: null })}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove selection"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Search Input */}
                  {!formData.sub_category && (
                    <>
                      <div className="relative mb-3">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                        <input
                          type="text"
                          placeholder="Search staff members..."
                          value={subSearch}
                          onChange={(e) => setSubSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>

                      {/* Sub-Category Options */}
                      <div className="max-h-48 overflow-y-auto border border-secondary-300 rounded-xl bg-white scrollbar-thin">
                        {getFilteredSubOptions().length > 0 ? (
                          getFilteredSubOptions().map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => handleSubCategorySelect(option)}
                              className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors border-b border-secondary-100 last:border-b-0"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-secondary-800">{option.name}</p>
                                  {option.email && (
                                    <p className="text-xs text-secondary-600">{option.email}</p>
                                  )}
                                  {option.role && (
                                    <p className="text-xs text-red-600 capitalize">{option.role}</p>
                                  )}
                                  {option.department && (
                                    <p className="text-xs text-secondary-500">{option.department}</p>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-secondary-500">
                            <p className="text-sm">No staff members found</p>
                            {subSearch && (
                              <p className="text-xs mt-1">Try a different search term</p>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Change Selection Button */}
                  {formData.sub_category && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, sub_category: null, related_id: null })}
                      className="w-full mt-3 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      Change Selection
                    </button>
                  )}
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Payment Mode *
                </label>
                <select
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="">Select Payment Mode</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter description"
                  rows={3}
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Receipt/Image (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center space-x-2 px-4 py-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 text-secondary-600" />
                    <span className="text-sm text-secondary-600">Choose File</span>
                  </label>
                  {imageFile && (
                    <span className="text-sm text-secondary-600">{imageFile.name}</span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
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
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Expense</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Expense Types Modal */}
      <ManageExpenseTypesModal
        isOpen={showManageTypesModal}
        onClose={() => setShowManageTypesModal(false)}
        onUpdate={loadExpenseTypes}
      />
    </div>
  );
};

export default ExpenseReports;
