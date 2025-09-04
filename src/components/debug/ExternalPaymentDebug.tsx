import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Database } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DebugData {
  externalPayments: any[];
  students: any[];
  fees: any[];
  transactions: any[];
  income: any[];
}

const ExternalPaymentDebug: React.FC = () => {
  const [debugData, setDebugData] = useState<DebugData>({
    externalPayments: [],
    students: [],
    fees: [],
    transactions: [],
    income: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const loadDebugData = async () => {
    try {
      setLoading(true);
      
      const [
        externalPaymentsResult,
        studentsResult,
        feesResult,
        transactionsResult,
        incomeResult
      ] = await Promise.all([
        supabase.from('external_fee_payments').select('*').order('created_at', { ascending: false }),
        supabase.from('students').select('*').eq('status', 'active'),
        supabase.from('fees').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').eq('type', 'income').order('created_at', { ascending: false }),
        supabase.from('income').select('*').order('created_at', { ascending: false })
      ]);

      setDebugData({
        externalPayments: externalPaymentsResult.data || [],
        students: studentsResult.data || [],
        fees: feesResult.data || [],
        transactions: transactionsResult.data || [],
        income: incomeResult.data || []
      });
    } catch (error) {
      console.error('Error loading debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugData();
  }, []);

  const getPaymentStatus = (payment: any) => {
    const student = debugData.students.find(s => s.id === payment.student_id);
    const relatedFees = debugData.fees.filter(f => f.student_id === payment.student_id);
    const relatedTransactions = debugData.transactions.filter(t => 
      t.related_id === payment.student_id && 
      t.amount === payment.payment_amount &&
      t.date === payment.payment_date
    );
    const relatedIncome = debugData.income.filter(i => 
      i.sub_type === payment.student_name && 
      i.amount === payment.payment_amount &&
      i.date === payment.payment_date
    );

    return {
      hasStudent: !!student,
      hasFeeRecord: relatedFees.length > 0,
      hasTransaction: relatedTransactions.length > 0,
      hasIncomeRecord: relatedIncome.length > 0,
      student,
      fees: relatedFees,
      transactions: relatedTransactions,
      income: relatedIncome
    };
  };

  const verifiedPayments = debugData.externalPayments.filter(p => p.status === 'verified');
  const pendingPayments = debugData.externalPayments.filter(p => p.status === 'pending');

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">External Payment Debug</h1>
          <p className="text-secondary-600">Debug external payment integration issues</p>
        </div>
        <button
          onClick={loadDebugData}
          disabled={loading}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-secondary-600">External Payments</p>
              <p className="text-xl font-bold">{debugData.externalPayments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-secondary-600">Verified</p>
              <p className="text-xl font-bold">{verifiedPayments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-secondary-600">Students</p>
              <p className="text-xl font-bold">{debugData.students.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-secondary-600">Fee Records</p>
              <p className="text-xl font-bold">{debugData.fees.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-teal-600" />
            <div>
              <p className="text-sm text-secondary-600">Transactions</p>
              <p className="text-xl font-bold">{debugData.transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Payments Analysis */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Verified Payments Analysis</h2>
        </div>
        <div className="p-4">
          {verifiedPayments.length === 0 ? (
            <p className="text-secondary-600">No verified payments found.</p>
          ) : (
            <div className="space-y-4">
              {verifiedPayments.map(payment => {
                const status = getPaymentStatus(payment);
                return (
                  <div key={payment.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{payment.student_name}</h3>
                        <p className="text-sm text-secondary-600">
                          QAR {payment.payment_amount} • {payment.payment_date}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedPayment(selectedPayment?.id === payment.id ? null : payment)}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        {selectedPayment?.id === payment.id ? 'Hide Details' : 'Show Details'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        {status.hasStudent ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span>Student Record</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {status.hasFeeRecord ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span>Fee Record</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {status.hasTransaction ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span>Transaction</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {status.hasIncomeRecord ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span>Income Record</span>
                      </div>
                    </div>

                    {selectedPayment?.id === payment.id && (
                      <div className="mt-4 p-4 bg-secondary-50 rounded-lg">
                        <h4 className="font-semibold mb-2">Detailed Information</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <strong>Student ID:</strong> {payment.student_id || 'Not set'}
                          </div>
                          <div>
                            <strong>Related Fee Records:</strong> {status.fees.length}
                          </div>
                          <div>
                            <strong>Related Transactions:</strong> {status.transactions.length}
                          </div>
                          <div>
                            <strong>Related Income Records:</strong> {status.income.length}
                          </div>
                          {!status.hasStudent && (
                            <div className="text-red-600">
                              <AlertTriangle className="w-4 h-4 inline mr-1" />
                              Student record missing - this payment may not appear in Fee Management
                            </div>
                          )}
                          {!status.hasFeeRecord && (
                            <div className="text-red-600">
                              <AlertTriangle className="w-4 h-4 inline mr-1" />
                              Fee record missing - this payment may not appear in Fee Management
                            </div>
                          )}
                          {!status.hasTransaction && (
                            <div className="text-red-600">
                              <AlertTriangle className="w-4 h-4 inline mr-1" />
                              Transaction record missing - this payment may not appear in Accounts
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Pending Payments</h2>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {pendingPayments.map(payment => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <span className="font-medium">{payment.student_name}</span>
                    <span className="text-secondary-600 ml-2">QAR {payment.payment_amount}</span>
                  </div>
                  <span className="text-yellow-600 text-sm">Awaiting verification</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalPaymentDebug;
