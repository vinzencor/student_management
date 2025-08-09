import React, { useEffect, useState } from 'react';
import { TrendingUp, Download, Calendar, Filter, DollarSign, Plus, Upload, X, Eye, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Transaction {
  id?: string;
  type: 'income' | 'expense';
  date: string;
  amount: number;
  category: string;
  sub_category?: string;
  related_id?: string;
  payment_mode: string;
  description: string;
  image_url?: string;
  created_at?: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  course_id?: string;
}

interface Course {
  id: string;
  name: string;
  price: number;
}

const IncomeReports: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Add Income Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Transaction>({
    type: 'income',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: '',
    sub_category: '',
    related_id: '',
    payment_mode: '',
    description: '',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Data for cascading dropdowns
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredSubOptions, setFilteredSubOptions] = useState<any[]>([]);
  const [subSearch, setSubSearch] = useState('');
  const [showSubDropdown, setShowSubDropdown] = useState(false);

  useEffect(() => {
    loadIncomeTransactions();
    loadStudents();
    loadCourses();
  }, [dateRange]);

  const loadIncomeTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'income')
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading income transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load students for fee-related transactions
  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, email, course_id')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  // Load courses for course sales
  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, price')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  // Handle category change and determine sub-options
  const handleCategoryChange = (category: string) => {
    setFormData({
      ...formData,
      category,
      sub_category: '',
      related_id: '',
      amount: 0
    });
    setSubSearch('');

    // Determine what sub-options to show based on category
    let subOptions: any[] = [];

    if (category === 'Student Fees') {
      subOptions = students.map(student => ({
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        email: student.email,
        type: 'student'
      }));
    } else if (category === 'Course Sales') {
      subOptions = courses.map(course => ({
        id: course.id,
        name: course.name,
        price: course.price,
        type: 'course'
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
      option.email?.toLowerCase().includes(subSearch.toLowerCase())
    );
  };

  // Handle sub-category selection
  const handleSubCategorySelect = (option: any) => {
    setFormData({
      ...formData,
      sub_category: option.name,
      related_id: option.id,
      amount: option.price || formData.amount // Auto-fill amount for courses
    });
    // Keep dropdown open but clear search
    setSubSearch('');
  };

  const handleAddIncome = () => {
    setFormData({
      type: 'income',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      category: '',
      sub_category: '',
      related_id: '',
      payment_mode: '',
      description: '',
      image_url: ''
    });
    setImageFile(null);
    setSubSearch('');
    setShowSubDropdown(false);
    setFilteredSubOptions([]);
    setShowAddModal(true);
  };

  // Image upload functionality
  const handleImageUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `transaction-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('transaction-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('transaction-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate sub-category selection for categories that require it
    const incomeCategories = [
      { value: 'Student Fees', hasSubCategory: true },
      { value: 'Course Sales', hasSubCategory: true },
      { value: 'Consulting', hasSubCategory: false },
      { value: 'Grants', hasSubCategory: false },
      { value: 'Donations', hasSubCategory: false },
      { value: 'Investment Returns', hasSubCategory: false },
      { value: 'Other Income', hasSubCategory: false }
    ];

    const selectedCategory = incomeCategories.find(cat => cat.value === formData.category);

    if (selectedCategory?.hasSubCategory && !formData.sub_category) {
      alert(`Please select a ${formData.category === 'Student Fees' ? 'student' : 'course'}`);
      return;
    }

    try {
      setUploading(true);

      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      // Insert transaction
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

      // If this is a student fee payment, update the fee management and create receipt
      if (formData.category === 'Student Fees' && formData.related_id) {
        try {
          console.log('Updating fee management for student:', formData.related_id, 'Amount:', formData.amount);

          // Get student details for receipt
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('*, courses(name, price)')
            .eq('id', formData.related_id)
            .single();

          if (studentError) {
            console.error('Error fetching student data:', studentError);
          } else {
            console.log('Student data fetched:', studentData);
          }

          let feeRecordId = null;

          const { data: existingFees, error: feesError } = await supabase
            .from('fees')
            .select('*')
            .eq('student_id', formData.related_id)
            .order('created_at', { ascending: false });

          if (feesError) {
            console.error('Error fetching existing fees:', feesError);
          } else {
            console.log('Existing fees found:', existingFees);
          }

          if (existingFees && existingFees.length > 0) {
            const unpaidFee = existingFees.find(fee => fee.status === 'pending' || fee.status === 'partial');

            if (unpaidFee) {
              const newPaidAmount = (unpaidFee.paid_amount || 0) + formData.amount;
              const newRemainingAmount = Math.max(0, unpaidFee.amount - newPaidAmount);
              const newStatus = newRemainingAmount <= 0 ? 'paid' : 'partial';

              const { error: updateError } = await supabase
                .from('fees')
                .update({
                  paid_amount: newPaidAmount,
                  status: newStatus,
                  paid_date: newStatus === 'paid' ? formData.date : unpaidFee.paid_date,
                  payment_method: formData.payment_mode,
                  updated_at: new Date().toISOString()
                })
                .eq('id', unpaidFee.id);

              if (!updateError) {
                feeRecordId = unpaidFee.id;
                console.log('Successfully updated existing fee record');
              }
            } else {
              const { data: newFeeData, error: insertError } = await supabase
                .from('fees')
                .insert([{
                  student_id: formData.related_id,
                  amount: formData.amount,
                  paid_amount: formData.amount,
                  status: 'paid',
                  paid_date: formData.date,
                  payment_method: formData.payment_mode,
                  fee_type: 'tuition',
                  description: formData.description || 'Fee payment via accounts',
                  due_date: formData.date,
                  created_at: new Date().toISOString()
                }])
                .select()
                .single();

              if (!insertError && newFeeData) {
                feeRecordId = newFeeData.id;
                console.log('Successfully created new fee record');
              }
            }
          } else {
            const { data: newFeeData, error: insertError } = await supabase
              .from('fees')
              .insert([{
                student_id: formData.related_id,
                amount: formData.amount,
                paid_amount: formData.amount,
                status: 'paid',
                paid_date: formData.date,
                payment_method: formData.payment_mode,
                fee_type: 'tuition',
                description: formData.description || 'Fee payment via accounts',
                due_date: formData.date,
                created_at: new Date().toISOString()
              }])
              .select()
              .single();

            if (!insertError && newFeeData) {
              feeRecordId = newFeeData.id;
              console.log('Successfully created first fee record for student');
            }
          }

          // Create receipt record for printing
          if (feeRecordId && studentData) {
            const receiptNumber = `RCP-${Date.now()}`;

            await supabase
              .from('fee_receipts')
              .insert([{
                receipt_number: receiptNumber,
                student_id: formData.related_id,
                fee_id: feeRecordId,
                student_name: `${studentData.first_name} ${studentData.last_name}`,
                course_name: studentData.courses?.name || 'N/A',
                amount_paid: formData.amount,
                payment_date: formData.date,
                payment_method: formData.payment_mode,
                description: formData.description,
                created_at: new Date().toISOString()
              }]);

            console.log('Receipt record created:', receiptNumber);
          }

        } catch (feeError) {
          console.error('Error updating fee management:', feeError);
          alert('Income added successfully, but there was an issue updating fee management.');
        }
      }

      setShowAddModal(false);
      loadIncomeTransactions();
      alert('Income transaction added successfully!');
    } catch (error: any) {
      console.error('Error adding income:', error);
      alert(`Failed to add income: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const downloadIncomeReport = () => {
    if (transactions.length === 0) {
      alert('No income transactions found for the selected period');
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
    link.setAttribute('download', `income-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalIncome = transactions.reduce((sum, t) => sum + t.amount, 0);

  const incomeCategories = [
    'Student Fees', 'Course Sales', 'Consulting', 'Grants', 
    'Donations', 'Investment Returns', 'Other Income'
  ];

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800 flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-success-600" />
            <span>Income Reports</span>
          </h1>
          <p className="text-secondary-600 mt-1">Detailed income analysis and reporting</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAddIncome}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl transition-colors shadow-soft hover:shadow-medium"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Income</span>
          </button>
          <button
            onClick={downloadIncomeReport}
            className="flex items-center space-x-2 bg-success-600 hover:bg-success-700 text-white px-6 py-3 rounded-xl transition-colors shadow-soft hover:shadow-medium"
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
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-success-500 text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-secondary-700">To:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-success-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-success-50 to-success-100 rounded-xl border border-success-200 p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-success-700">Total Income</p>
            <p className="text-3xl font-bold text-success-800">₹{totalIncome.toLocaleString()}</p>
            <p className="text-sm text-success-600 mt-1">
              {transactions.length} transactions from {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="w-16 h-16 bg-success-200 rounded-full flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-success-700" />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-soft">
        <div className="p-6 border-b border-secondary-200">
          <h3 className="text-xl font-semibold text-secondary-800">Income by Category</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {incomeCategories.map(category => {
              const categoryTransactions = transactions.filter(t => t.category === category);
              const categoryTotal = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
              
              if (categoryTotal === 0) return null;
              
              const percentage = totalIncome > 0 ? (categoryTotal / totalIncome) * 100 : 0;
              
              return (
                <div key={category} className="flex items-center justify-between p-4 bg-success-50 rounded-lg border border-success-200">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-secondary-800">{category}</p>
                      <span className="font-bold text-success-700">₹{categoryTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-success-200 rounded-full h-2">
                        <div 
                          className="bg-success-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-success-600 font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-secondary-600 mt-1">{categoryTransactions.length} transactions</p>
                  </div>
                </div>
              );
            })}
            {transactions.length === 0 && (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                <p className="text-secondary-600">No income transactions found for the selected period</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-secondary-200">
          <h3 className="text-xl font-semibold text-secondary-800">Income Transactions</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-success-600 mx-auto"></div>
            <p className="text-secondary-600 mt-2">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <TrendingUp className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
            <p className="text-secondary-600">No income transactions found for the selected period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-success-50 border-b border-success-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-success-800">Date</th>
                  <th className="text-left py-3 px-6 font-medium text-success-800">Category</th>
                  <th className="text-left py-3 px-6 font-medium text-success-800">Details</th>
                  <th className="text-left py-3 px-6 font-medium text-success-800">Amount</th>
                  <th className="text-left py-3 px-6 font-medium text-success-800">Payment Mode</th>
                  <th className="text-left py-3 px-6 font-medium text-success-800">Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-secondary-100 hover:bg-success-50">
                    <td className="py-4 px-6 text-secondary-800">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-secondary-800">{transaction.category}</td>
                    <td className="py-4 px-6 text-secondary-600">
                      {transaction.sub_category ? (
                        <div>
                          <p className="font-medium text-secondary-800">{transaction.sub_category}</p>
                          <p className="text-xs text-success-600">
                            {transaction.category === 'Student Fees' && 'Student Fee Payment'}
                            {transaction.category === 'Course Sales' && 'Course Purchase'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-secondary-500">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-success-600">
                        +₹{transaction.amount.toLocaleString()}
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

      {/* Add Income Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-large w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <h2 className="text-xl font-bold text-secondary-800">Add Income Transaction</h2>
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
                    className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Income Type *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Student Fees">Student Fees</option>
                  <option value="Course Sales">Course Sales</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Grants">Grants</option>
                  <option value="Donations">Donations</option>
                  <option value="Investment Returns">Investment Returns</option>
                  <option value="Other Income">Other Income</option>
                </select>
              </div>

              {/* Sub-Category Dropdown */}
              {showSubDropdown && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    {formData.category === 'Student Fees' ? 'Select Student' : 'Select Course'} *
                  </label>

                  {/* Selected Item Display */}
                  {formData.sub_category ? (
                    <div className="mb-3 p-4 bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-success-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-success-800">
                              {formData.sub_category}
                            </p>
                            <p className="text-xs text-success-600">
                              {formData.category === 'Student Fees' ? 'Student Fee Payment' : 'Course Purchase'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, sub_category: '', related_id: '' })}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove selection"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Search Input - Always show when sub-category is available */}
                  {!formData.sub_category && (
                    <>
                      <div className="relative mb-3">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                        <input
                          type="text"
                          placeholder={`Search ${formData.category === 'Student Fees' ? 'students' : 'courses'}...`}
                          value={subSearch}
                          onChange={(e) => setSubSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500"
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
                              className="w-full text-left px-4 py-3 hover:bg-success-50 transition-colors border-b border-secondary-100 last:border-b-0"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-secondary-800">{option.name}</p>
                                  {option.email && (
                                    <p className="text-xs text-secondary-600">{option.email}</p>
                                  )}
                                </div>
                                {option.price && (
                                  <span className="text-sm font-semibold text-success-600">₹{option.price}</span>
                                )}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-secondary-500">
                            <p className="text-sm">No {formData.category === 'Student Fees' ? 'students' : 'courses'} found</p>
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
                      onClick={() => setFormData({ ...formData, sub_category: '', related_id: '' })}
                      className="w-full mt-3 px-4 py-2 border border-success-300 text-success-600 hover:bg-success-50 rounded-lg transition-colors text-sm font-medium"
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
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500"
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
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500"
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
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500"
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
                  className="px-6 py-3 bg-success-600 hover:bg-success-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Income</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeReports;
