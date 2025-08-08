import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Users, CreditCard, Banknote, AlertTriangle } from 'lucide-react';
import { DataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import type { Fee, SalaryRecord, Staff } from '../lib/supabase';

const AccountantDashboard: React.FC = () => {
  const { user } = useAuth();
  const [moneyFlowData, setMoneyFlowData] = useState<any>(null);
  const [fees, setFees] = useState<Fee[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('current_month');

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  const getDateRange = () => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentYear = new Date(now.getFullYear(), 0, 1);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (dateRange) {
      case 'current_month':
        return { start: currentMonth.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
      case 'current_year':
        return { start: currentYear.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
      case 'last_30_days':
        return { start: last30Days.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
      default:
        return { start: currentMonth.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
    }
  };

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const range = getDateRange();
      
      const [moneyFlow, feesData, salariesData, staffData] = await Promise.all([
        DataService.getMoneyFlowReport(range),
        DataService.getFees(),
        DataService.getSalaryRecords(),
        DataService.getStaff({ status: 'active' })
      ]);

      setMoneyFlowData(moneyFlow);
      setFees(feesData || []);
      setSalaryRecords(salariesData || []);
      setStaff(staffData || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOverdueFees = () => {
    const today = new Date();
    return fees.filter(fee => 
      fee.status === 'pending' && 
      new Date(fee.due_date) < today
    );
  };

  const getPendingSalaries = () => {
    return salaryRecords.filter(salary => salary.status === 'pending');
  };

  const getRecentTransactions = () => {
    const paidFees = fees
      .filter(fee => fee.status === 'paid' && fee.paid_date)
      .map(fee => ({
        id: fee.id,
        type: 'income',
        amount: fee.amount,
        date: fee.paid_date!,
        description: `Fee payment - ${fee.receipt_number || 'N/A'}`,
        method: fee.payment_method
      }));

    const paidSalaries = salaryRecords
      .filter(salary => salary.status === 'paid')
      .map(salary => ({
        id: salary.id,
        type: 'expense',
        amount: salary.amount,
        date: salary.payment_date,
        description: `Salary payment - ${salary.month_year}`,
        method: salary.payment_method
      }));

    return [...paidFees, ...paidSalaries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-6">
        <div className="flex justify-between items-center">
          <div className="w-48 h-8 bg-secondary-200 rounded animate-pulse"></div>
          <div className="w-32 h-10 bg-secondary-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl border border-secondary-200 animate-pulse">
              <div className="w-full h-32 bg-secondary-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const recentTransactions = getRecentTransactions();
  const overdueFees = getOverdueFees();
  const pendingSalaries = getPendingSalaries();

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800">Financial Dashboard</h1>
          <p className="text-secondary-600 mt-1">Monitor income, expenses, and money flow</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option value="current_month">Current Month</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="current_year">Current Year</option>
          </select>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-success-600" />
            <span className="text-sm font-medium text-success-700 bg-success-100 px-3 py-1 rounded-full border border-success-200">
              Income
            </span>
          </div>
          <h3 className="text-2xl font-bold text-secondary-800">
            ${moneyFlowData?.income?.toFixed(2) || '0.00'}
          </h3>
          <p className="text-success-600 text-sm font-medium">Total Income</p>
        </div>

        <div className="bg-gradient-to-r from-danger-50 to-danger-100 border border-danger-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <TrendingDown className="w-8 h-8 text-danger-600" />
            <span className="text-sm font-medium text-danger-700 bg-danger-100 px-3 py-1 rounded-full border border-danger-200">
              Expenses
            </span>
          </div>
          <h3 className="text-2xl font-bold text-secondary-800">
            ${moneyFlowData?.expenses?.toFixed(2) || '0.00'}
          </h3>
          <p className="text-danger-600 text-sm font-medium">Total Expenses</p>
        </div>

        <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-primary-600" />
            <span className="text-sm font-medium text-primary-700 bg-primary-100 px-3 py-1 rounded-full border border-primary-200">
              Net Flow
            </span>
          </div>
          <h3 className={`text-2xl font-bold ${moneyFlowData?.netFlow >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            ${moneyFlowData?.netFlow?.toFixed(2) || '0.00'}
          </h3>
          <p className="text-primary-600 text-sm font-medium">Net Cash Flow</p>
        </div>

        <div className="bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 text-warning-600" />
            <span className="text-sm font-medium text-warning-700 bg-warning-100 px-3 py-1 rounded-full border border-warning-200">
              Pending
            </span>
          </div>
          <h3 className="text-2xl font-bold text-secondary-800">
            ${moneyFlowData?.pending?.toFixed(2) || '0.00'}
          </h3>
          <p className="text-warning-600 text-sm font-medium">Pending Fees</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overdue Fees */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-secondary-800">Overdue Fees</h3>
            <AlertTriangle className="w-6 h-6 text-danger-600" />
          </div>
          
          {overdueFees.length > 0 ? (
            <div className="space-y-3">
              {overdueFees.slice(0, 5).map((fee) => (
                <div key={fee.id} className="flex items-center justify-between p-3 bg-danger-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-secondary-800">
                      ${fee.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-secondary-600">
                      Due: {new Date(fee.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-danger-100 text-danger-700">
                    Overdue
                  </span>
                </div>
              ))}
              {overdueFees.length > 5 && (
                <p className="text-xs text-secondary-500 text-center">
                  +{overdueFees.length - 5} more overdue fees
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-secondary-500 text-sm">No overdue fees</p>
            </div>
          )}
        </div>

        {/* Pending Salaries */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-secondary-800">Pending Salaries</h3>
            <Users className="w-6 h-6 text-warning-600" />
          </div>
          
          {pendingSalaries.length > 0 ? (
            <div className="space-y-3">
              {pendingSalaries.slice(0, 5).map((salary) => (
                <div key={salary.id} className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-secondary-800">
                      ${salary.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-secondary-600">
                      {salary.month_year}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-warning-100 text-warning-700">
                    Pending
                  </span>
                </div>
              ))}
              {pendingSalaries.length > 5 && (
                <p className="text-xs text-secondary-500 text-center">
                  +{pendingSalaries.length - 5} more pending salaries
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-secondary-500 text-sm">No pending salaries</p>
            </div>
          )}
        </div>

        {/* Staff Summary */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-secondary-800">Staff Summary</h3>
            <Users className="w-6 h-6 text-primary-600" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600">Total Staff</span>
              <span className="text-sm font-semibold text-secondary-800">{staff.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600">Teachers</span>
              <span className="text-sm font-semibold text-secondary-800">
                {staff.filter(s => s.role === 'teacher').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600">Office Staff</span>
              <span className="text-sm font-semibold text-secondary-800">
                {staff.filter(s => s.role === 'office_staff').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600">Monthly Payroll</span>
              <span className="text-sm font-semibold text-secondary-800">
                ${staff.reduce((sum, s) => sum + (s.salary || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-secondary-800">Recent Transactions</h3>
          <Calendar className="w-6 h-6 text-primary-600" />
        </div>

        {recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={`${transaction.type}-${transaction.id}`} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' 
                      ? 'bg-success-100 text-success-600' 
                      : 'bg-danger-100 text-danger-600'
                  }`}>
                    {transaction.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-800">{transaction.description}</p>
                    <p className="text-xs text-secondary-600">
                      {new Date(transaction.date).toLocaleDateString()} • {transaction.method || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
            <p className="text-secondary-500">No recent transactions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountantDashboard;
