import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Download, Calendar, Upload, X, Eye, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Transaction {
  id?: string;
  type: 'income' | 'expense';
  date: string;
  amount: number;
  category: string;
  sub_category?: string;
  related_id?: string; // student_id or staff_id
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

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department?: string;
}

interface Course {
  id: string;
  name: string;
  price: number;
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
  const [staff, setStaff] = useState<Staff[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredSubOptions, setFilteredSubOptions] = useState<any[]>([]);
  const [subSearch, setSubSearch] = useState('');
  const [showSubDropdown, setShowSubDropdown] = useState(false);

  // For display purposes only - no filtering needed in main accounts view
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadTransactions();
    loadStudents();
    loadStaff();
    loadCourses();
  }, []);

  // Show recent transactions (last 30 days)
  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filtered = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= thirtyDaysAgo;
    });

    setFilteredTransactions(filtered);
  }, [transactions]);

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
    } else if (category === 'Salaries') {
      subOptions = staff.map(staffMember => ({
        id: staffMember.id,
        name: `${staffMember.first_name} ${staffMember.last_name}`,
        email: staffMember.email,
        role: staffMember.role,
        department: staffMember.department,
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
      related_id: option.id,
      amount: option.price || formData.amount // Auto-fill amount for courses
    });
    // Keep dropdown open but clear search
    setSubSearch('');
  };

  const handleAddTransaction = (type: 'income' | 'expense') => {
    setModalType(type);
    setFormData({
      type,
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

  // Download report functionality
  const downloadReport = (type: 'income' | 'expense' | 'all') => {
    const reportTransactions = filteredTransactions.filter(t =>
      type === 'all' ? true : t.type === type
    );

    if (reportTransactions.length === 0) {
      alert('No transactions found for the selected criteria');
      return;
    }

    // Create CSV content
    const headers = [
      'Date', 'Type', 'Category', 'Sub Category', 'Amount',
      'Payment Mode', 'Description', 'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...reportTransactions.map(t => [
        t.date,
        t.type,
        t.category,
        t.sub_category || '',
        t.amount,
        t.payment_mode,
        `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
        new Date(t.created_at || '').toLocaleDateString()
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${type}-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    // Validate sub-category selection for categories that require it
    const selectedCategory = (modalType === 'income' ? incomeCategories : expenseCategories)
      .find(cat => cat.value === formData.category);

    if (selectedCategory?.hasSubCategory && !formData.sub_category) {
      alert(`Please select a ${formData.category === 'Student Fees' ? 'student' :
                              formData.category === 'Course Sales' ? 'course' :
                              formData.category === 'Salaries' ? 'staff member' : 'option'}`);
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
      if (formData.type === 'income' && formData.category === 'Student Fees' && formData.related_id) {
        try {
          console.log('Updating fee management for student:', formData.related_id, 'Amount:', formData.amount);

          // Get student details for receipt
          const { data: studentData } = await supabase
            .from('students')
            .select('*, courses(name, price)')
            .eq('id', formData.related_id)
            .single();

          let feeRecordId = null;

          // First, check if there's any existing fee record for this student (any status)
          const { data: existingFees } = await supabase
            .from('fees')
            .select('*')
            .eq('student_id', formData.related_id)
            .order('created_at', { ascending: false });

          if (existingFees && existingFees.length > 0) {
            // Find the most recent unpaid or partially paid fee
            const unpaidFee = existingFees.find(fee => fee.status === 'pending' || fee.status === 'partial');

            if (unpaidFee) {
              // Update existing fee record
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

              if (updateError) {
                console.error('Error updating existing fee:', updateError);
              } else {
                feeRecordId = unpaidFee.id;
                console.log('Successfully updated existing fee record');
              }
            } else {
              // All fees are paid, create a new fee record
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

              if (insertError) {
                console.error('Error creating new fee record:', insertError);
              } else {
                feeRecordId = newFeeData?.id;
                console.log('Successfully created new fee record');
              }
            }
          } else {
            // No existing fee records, create new one
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

            if (insertError) {
              console.error('Error creating fee record:', insertError);
            } else {
              feeRecordId = newFeeData?.id;
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
          // Don't fail the transaction if fee update fails, but show a warning
          alert('Transaction added successfully, but there was an issue updating fee management. Please check the fee management section.');
        }
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
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses
    };
  };

  const summary = calculateSummary();

  // Categories with sub-category support
  const expenseCategories = [
    { value: 'Rent', hasSubCategory: false },
    { value: 'Utilities', hasSubCategory: false },
    { value: 'Salaries', hasSubCategory: true }, // Will show staff dropdown
    { value: 'Office Supplies', hasSubCategory: false },
    { value: 'Marketing', hasSubCategory: false },
    { value: 'Maintenance', hasSubCategory: false },
    { value: 'Travel', hasSubCategory: false },
    { value: 'Food & Beverages', hasSubCategory: false },
    { value: 'Equipment', hasSubCategory: false },
    { value: 'Other', hasSubCategory: false }
  ];

  const incomeCategories = [
    { value: 'Student Fees', hasSubCategory: true }, // Will show students dropdown
    { value: 'Course Sales', hasSubCategory: true }, // Will show courses dropdown
    { value: 'Consulting', hasSubCategory: false },
    { value: 'Grants', hasSubCategory: false },
    { value: 'Donations', hasSubCategory: false },
    { value: 'Investment Returns', hasSubCategory: false },
    { value: 'Other Income', hasSubCategory: false }
  ];

  const paymentModes = [
    'Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 
    'UPI', 'Cheque', 'Online Payment'
  ];

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800">Accounts Overview</h1>
          <p className="text-secondary-600 mt-1">Financial overview and transaction management</p>
        </div>
      </div>

      {/* Quick Navigation to Reports */}
      <div className="bg-white rounded-xl border border-secondary-200 p-4 lg:p-6 shadow-soft">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-secondary-800">Detailed Reports</h3>
            <p className="text-sm text-secondary-600 mt-1">Access comprehensive income and expense reports with advanced filtering</p>
          </div>

          {/* Quick Navigation to Reports */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                // This will be handled by the sidebar navigation
              }}
              className="flex items-center justify-center space-x-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Income Reports</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                // This will be handled by the sidebar navigation
              }}
              className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <TrendingDown className="w-4 h-4" />
              <span>Expense Reports</span>
            </a>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-secondary-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Income</p>
              <p className="text-2xl font-bold text-success-600">₹{summary.totalIncome.toLocaleString()}</p>
              <p className="text-xs text-secondary-500 mt-1">
                {filteredTransactions.filter(t => t.type === 'income').length} transactions
              </p>
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
              <p className="text-xs text-secondary-500 mt-1">
                {filteredTransactions.filter(t => t.type === 'expense').length} transactions
              </p>
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
              <p className="text-xs text-secondary-500 mt-1">
                Last 30 days overview
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

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <div className="bg-white rounded-xl border border-secondary-200 shadow-soft">
          <div className="p-4 border-b border-secondary-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary-800">Income Breakdown</h3>
              <button
                onClick={() => downloadReport('income')}
                className="flex items-center space-x-1 text-success-600 hover:text-success-700 text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <div className="p-4">
            {incomeCategories.map(category => {
              const categoryTransactions = filteredTransactions.filter(t =>
                t.type === 'income' && t.category === category.value
              );
              const categoryTotal = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);

              if (categoryTotal === 0) return null;

              return (
                <div key={category.value} className="flex justify-between items-center py-2 border-b border-secondary-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-secondary-800">{category.value}</p>
                    <p className="text-xs text-secondary-600">{categoryTransactions.length} transactions</p>
                  </div>
                  <span className="font-semibold text-success-600">₹{categoryTotal.toLocaleString()}</span>
                </div>
              );
            })}
            {filteredTransactions.filter(t => t.type === 'income').length === 0 && (
              <p className="text-center text-secondary-500 py-4">No income transactions in selected period</p>
            )}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl border border-secondary-200 shadow-soft">
          <div className="p-4 border-b border-secondary-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary-800">Expense Breakdown</h3>
              <button
                onClick={() => downloadReport('expense')}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <div className="p-4">
            {expenseCategories.map(category => {
              const categoryTransactions = filteredTransactions.filter(t =>
                t.type === 'expense' && t.category === category.value
              );
              const categoryTotal = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);

              if (categoryTotal === 0) return null;

              return (
                <div key={category.value} className="flex justify-between items-center py-2 border-b border-secondary-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-secondary-800">{category.value}</p>
                    <p className="text-xs text-secondary-600">{categoryTransactions.length} transactions</p>
                  </div>
                  <span className="font-semibold text-red-600">₹{categoryTotal.toLocaleString()}</span>
                </div>
              );
            })}
            {filteredTransactions.filter(t => t.type === 'expense').length === 0 && (
              <p className="text-center text-secondary-500 py-4">No expense transactions in selected period</p>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-secondary-800">Transactions</h2>
              <p className="text-sm text-secondary-600 mt-1">
                Showing {filteredTransactions.length} recent transactions (last 30 days)
              </p>
            </div>
            <button
              onClick={() => downloadReport('all')}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Download All</span>
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-secondary-600 mt-2">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-secondary-400" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-800 mb-2">
              {transactions.length === 0 ? 'No Transactions Found' : 'No Transactions in Selected Date Range'}
            </h3>
            <p className="text-secondary-600 mb-4">
              {transactions.length === 0
                ? 'Start by adding your first income or expense transaction.'
                : 'Try adjusting the date range or add new transactions for this period.'
              }
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
                  <th className="text-left py-3 px-6 font-medium text-secondary-700">Details</th>
                  <th className="text-left py-3 px-6 font-medium text-secondary-700">Amount</th>
                  <th className="text-left py-3 px-6 font-medium text-secondary-700">Payment Mode</th>
                  <th className="text-left py-3 px-6 font-medium text-secondary-700">Description</th>
                  <th className="text-left py-3 px-6 font-medium text-secondary-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
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
                    <td className="py-4 px-6 text-secondary-600">
                      {transaction.sub_category ? (
                        <div>
                          <p className="font-medium text-secondary-800">{transaction.sub_category}</p>
                          {transaction.category === 'Student Fees' && (
                            <p className="text-xs text-primary-600">Student Fee Payment</p>
                          )}
                          {transaction.category === 'Salaries' && (
                            <p className="text-xs text-blue-600">Staff Salary</p>
                          )}
                          {transaction.category === 'Course Sales' && (
                            <p className="text-xs text-success-600">Course Purchase</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-secondary-500">-</span>
                      )}
                    </td>
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
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select Category</option>
                  {(modalType === 'income' ? incomeCategories : expenseCategories).map(category => (
                    <option key={category.value} value={category.value}>{category.value}</option>
                  ))}
                </select>
              </div>

              {/* Sub-Category Dropdown */}
              {showSubDropdown && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    {formData.category === 'Student Fees' ? 'Select Student' :
                     formData.category === 'Course Sales' ? 'Select Course' :
                     formData.category === 'Salaries' ? 'Select Staff Member' : 'Select Option'} *
                  </label>

                  {/* Selected Item Display */}
                  {formData.sub_category ? (
                    <div className="mb-3 p-4 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-primary-800">
                              {formData.sub_category}
                            </p>
                            {formData.category === 'Student Fees' && (
                              <p className="text-xs text-primary-600">Student Fee Payment</p>
                            )}
                            {formData.category === 'Salaries' && (
                              <p className="text-xs text-primary-600">Staff Salary Payment</p>
                            )}
                            {formData.category === 'Course Sales' && (
                              <p className="text-xs text-primary-600">Course Purchase</p>
                            )}
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
                          placeholder={`Search ${formData.category === 'Student Fees' ? 'students' :
                                               formData.category === 'Course Sales' ? 'courses' :
                                               formData.category === 'Salaries' ? 'staff' : 'options'}...`}
                          value={subSearch}
                          onChange={(e) => setSubSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                              className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-secondary-100 last:border-b-0"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-secondary-800">{option.name}</p>
                                  {option.email && (
                                    <p className="text-xs text-secondary-600">{option.email}</p>
                                  )}
                                  {option.role && (
                                    <p className="text-xs text-primary-600 capitalize">{option.role}</p>
                                  )}
                                  {option.department && (
                                    <p className="text-xs text-secondary-500">{option.department}</p>
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
                            <p className="text-sm">No {formData.category === 'Student Fees' ? 'students' :
                                                       formData.category === 'Course Sales' ? 'courses' :
                                                       formData.category === 'Salaries' ? 'staff' : 'options'} found</p>
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
                      className="w-full mt-3 px-4 py-2 border border-primary-300 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium"
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
