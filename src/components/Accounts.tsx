import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';

const Accounts: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await DataService.getMoneyFlowReport();
        setSummary(data);
      } catch (e) {
        console.error('Error loading accounts summary', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-4 lg:p-6 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-secondary-800">Accounts</h2>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl border">
            <div className="text-secondary-500 text-sm">Income (fees paid)</div>
            <div className="text-2xl font-bold">₹ {summary?.income?.toLocaleString() || 0}</div>
          </div>
          <div className="p-4 rounded-xl border">
            <div className="text-secondary-500 text-sm">Expenses (salaries)</div>
            <div className="text-2xl font-bold">₹ {summary?.expenses?.toLocaleString() || 0}</div>
          </div>
          <div className="p-4 rounded-xl border">
            <div className="text-secondary-500 text-sm">Pending Fees</div>
            <div className="text-2xl font-bold">₹ {summary?.pending?.toLocaleString() || 0}</div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="font-semibold mb-2">Fee Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {summary?.feeDetails?.map((f:any, idx:number) => (
                <tr key={idx} className="border-b">
                  <td className="py-2 pr-4">₹ {f.amount}</td>
                  <td className="py-2 pr-4">{f.status}</td>
                  <td className="py-2 pr-4">{f.paid_date || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-semibold mb-2">Salary Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {summary?.salaryDetails?.map((s:any, idx:number) => (
                <tr key={idx} className="border-b">
                  <td className="py-2 pr-4">₹ {s.amount}</td>
                  <td className="py-2 pr-4">{s.payment_date}</td>
                  <td className="py-2 pr-4">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Accounts;

