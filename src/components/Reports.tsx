import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Download, Calendar, Filter, FileText, PieChart, Activity } from 'lucide-react';
import { DataService } from '../services/dataService';

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState({
    students: [],
    leads: [],
    fees: [],
    classes: [],
    communications: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');
  const [reportType, setReportType] = useState('overview');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [students, leads, fees, classes, communications] = await Promise.all([
        DataService.getStudents(),
        DataService.getLeads(),
        DataService.getFees(),
        DataService.getClasses(),
        DataService.getCommunications()
      ]);

      setReportData({
        students: students || [],
        leads: leads || [],
        fees: fees || [],
        classes: classes || [],
        communications: communications || []
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics
  const analytics = {
    totalStudents: reportData.students.length,
    activeStudents: reportData.students.filter(s => s.status === 'active').length,
    totalLeads: reportData.leads.length,
    convertedLeads: reportData.leads.filter(l => l.status === 'converted').length,
    totalRevenue: reportData.fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0),
    pendingRevenue: reportData.fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0),
    overdueRevenue: reportData.fees.filter(f => f.status === 'overdue').reduce((sum, f) => sum + f.amount, 0),
    totalClasses: reportData.classes.length,
    conversionRate: reportData.leads.length > 0 ? (reportData.leads.filter(l => l.status === 'converted').length / reportData.leads.length * 100) : 0
  };

  const exportReport = () => {
    const reportContent = {
      generatedAt: new Date().toISOString(),
      dateRange,
      analytics,
      students: reportData.students,
      leads: reportData.leads,
      fees: reportData.fees,
      classes: reportData.classes
    };

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `educare-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="w-48 h-8 bg-secondary-200 rounded animate-pulse"></div>
          <div className="w-32 h-10 bg-secondary-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
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
          <h1 className="text-3xl font-bold text-secondary-800">Reports & Analytics</h1>
          <p className="text-secondary-600 mt-1">Comprehensive insights and data analysis</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option value="overview">Overview</option>
            <option value="students">Students</option>
            <option value="financial">Financial</option>
            <option value="leads">Leads</option>
          </select>
          <button
            onClick={exportReport}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-soft hover:shadow-medium"
          >
            <Download className="w-5 h-5" />
            <span className="font-medium">Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-primary-600" />
            <span className="text-sm font-medium text-primary-700 bg-primary-100 px-3 py-1 rounded-full border border-primary-200">
              Students
            </span>
          </div>
          <h3 className="text-2xl font-bold text-secondary-800">{analytics.totalStudents}</h3>
          <p className="text-primary-600 text-sm font-medium">Total Students</p>
          <div className="mt-2 text-xs text-primary-600">
            {analytics.activeStudents} active
          </div>
        </div>

        <div className="bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-success-600" />
            <span className="text-sm font-medium text-success-700 bg-success-100 px-3 py-1 rounded-full border border-success-200">
              Revenue
            </span>
          </div>
          <h3 className="text-2xl font-bold text-secondary-800">${analytics.totalRevenue.toFixed(2)}</h3>
          <p className="text-success-600 text-sm font-medium">Total Collected</p>
          <div className="mt-2 text-xs text-success-600">
            ${analytics.pendingRevenue.toFixed(2)} pending
          </div>
        </div>

        <div className="bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-warning-600" />
            <span className="text-sm font-medium text-warning-700 bg-warning-100 px-3 py-1 rounded-full border border-warning-200">
              Conversion
            </span>
          </div>
          <h3 className="text-2xl font-bold text-secondary-800">{analytics.conversionRate.toFixed(1)}%</h3>
          <p className="text-warning-600 text-sm font-medium">Lead Conversion</p>
          <div className="mt-2 text-xs text-warning-600">
            {analytics.convertedLeads} of {analytics.totalLeads} leads
          </div>
        </div>

        <div className="bg-gradient-to-r from-secondary-50 to-secondary-100 border border-secondary-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 text-secondary-600" />
            <span className="text-sm font-medium text-secondary-700 bg-secondary-100 px-3 py-1 rounded-full border border-secondary-200">
              Classes
            </span>
          </div>
          <h3 className="text-2xl font-bold text-secondary-800">{analytics.totalClasses}</h3>
          <p className="text-secondary-600 text-sm font-medium">Active Classes</p>
          <div className="mt-2 text-xs text-secondary-600">
            Across all subjects
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Status Distribution */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-secondary-800">Student Status Distribution</h3>
            <PieChart className="w-6 h-6 text-primary-600" />
          </div>

          <div className="space-y-4">
            {[
              { status: 'Active', count: analytics.activeStudents, color: 'success' },
              { status: 'Inactive', count: reportData.students.filter(s => s.status === 'inactive').length, color: 'warning' },
              { status: 'Graduated', count: reportData.students.filter(s => s.status === 'graduated').length, color: 'primary' }
            ].map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full bg-${item.color}-500`}></div>
                  <span className="text-sm font-medium text-secondary-700">{item.status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-secondary-800">{item.count}</span>
                  <span className="text-xs text-secondary-500">
                    ({analytics.totalStudents > 0 ? ((item.count / analytics.totalStudents) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fee Status Overview */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-secondary-800">Fee Status Overview</h3>
            <DollarSign className="w-6 h-6 text-success-600" />
          </div>

          <div className="space-y-4">
            {[
              { status: 'Paid', amount: analytics.totalRevenue, color: 'success' },
              { status: 'Pending', amount: analytics.pendingRevenue, color: 'warning' },
              { status: 'Overdue', amount: analytics.overdueRevenue, color: 'danger' }
            ].map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full bg-${item.color}-500`}></div>
                  <span className="text-sm font-medium text-secondary-700">{item.status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-secondary-800">${item.amount.toFixed(2)}</span>
                  <span className="text-xs text-secondary-500">
                    ({(analytics.totalRevenue + analytics.pendingRevenue + analytics.overdueRevenue) > 0 ?
                      ((item.amount / (analytics.totalRevenue + analytics.pendingRevenue + analytics.overdueRevenue)) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lead Pipeline Analysis */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-secondary-800">Lead Pipeline Analysis</h3>
          <Activity className="w-6 h-6 text-primary-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { status: 'New', count: reportData.leads.filter(l => l.status === 'new').length, color: 'primary' },
            { status: 'Contacted', count: reportData.leads.filter(l => l.status === 'contacted').length, color: 'warning' },
            { status: 'Interested', count: reportData.leads.filter(l => l.status === 'interested').length, color: 'success' },
            { status: 'Converted', count: reportData.leads.filter(l => l.status === 'converted').length, color: 'success' },
            { status: 'Lost', count: reportData.leads.filter(l => l.status === 'lost').length, color: 'danger' }
          ].map((stage) => (
            <div key={stage.status} className="text-center">
              <div className={`w-16 h-16 bg-gradient-to-r from-${stage.color}-500 to-${stage.color}-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-soft`}>
                <span className="text-xl font-bold text-white">{stage.count}</span>
              </div>
              <h4 className="font-semibold text-secondary-800">{stage.status}</h4>
              <p className="text-sm text-secondary-600">
                {analytics.totalLeads > 0 ? ((stage.count / analytics.totalLeads) * 100).toFixed(1) : 0}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-secondary-800">System Summary</h3>
          <FileText className="w-6 h-6 text-primary-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-secondary-50 rounded-xl">
            <div className="text-2xl font-bold text-secondary-800 mb-2">
              {reportData.communications.length}
            </div>
            <h4 className="font-semibold text-secondary-700">Communications</h4>
            <p className="text-sm text-secondary-600">Total sent</p>
          </div>

          <div className="text-center p-4 bg-primary-50 rounded-xl">
            <div className="text-2xl font-bold text-secondary-800 mb-2">
              {reportData.students.filter(s => s.subjects && s.subjects.length > 0).length}
            </div>
            <h4 className="font-semibold text-secondary-700">Enrolled Students</h4>
            <p className="text-sm text-secondary-600">With subjects</p>
          </div>

          <div className="text-center p-4 bg-success-50 rounded-xl">
            <div className="text-2xl font-bold text-secondary-800 mb-2">
              {reportData.fees.filter(f => f.status === 'paid').length}
            </div>
            <h4 className="font-semibold text-secondary-700">Paid Fees</h4>
            <p className="text-sm text-secondary-600">This period</p>
          </div>

          <div className="text-center p-4 bg-warning-50 rounded-xl">
            <div className="text-2xl font-bold text-secondary-800 mb-2">
              {reportData.leads.filter(l => l.follow_up_date && new Date(l.follow_up_date) <= new Date()).length}
            </div>
            <h4 className="font-semibold text-secondary-700">Follow-ups Due</h4>
            <p className="text-sm text-secondary-600">Requires attention</p>
          </div>
        </div>
      </div>

      {/* Data Export Summary */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-secondary-800 mb-2">Export Data</h3>
            <p className="text-secondary-600">
              Generate comprehensive reports with all your data for external analysis or backup purposes.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportReport}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-soft hover:shadow-medium"
            >
              <Download className="w-5 h-5" />
              <span className="font-medium">Export JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;