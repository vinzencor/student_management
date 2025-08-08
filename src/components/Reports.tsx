import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Download, Calendar, Filter, FileText, PieChart, Activity, UserCog } from 'lucide-react';
import { DataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/roleUtils';
import StudentReportGenerator from './StudentReportGenerator';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState({
    students: [],
    leads: [],
    fees: [],
    classes: [],
    communications: [],
    staff: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');
  const [reportType, setReportType] = useState('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [showStudentReports, setShowStudentReports] = useState(false);

  // For teachers, show student reports by default
  useEffect(() => {
    if (user?.role === 'teacher') {
      setShowStudentReports(true);
    }
  }, [user]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const promises = [
        DataService.getStudents(),
        DataService.getLeads(),
        DataService.getFees(),
        DataService.getClasses(),
        DataService.getCommunications()
      ];

      // Add staff data for super admin
      if (hasPermission(user, 'manage_staff')) {
        promises.push(DataService.getStaff());
      }

      const results = await Promise.all(promises);
      const [students, leads, fees, classes, communications, staff] = results;

      setReportData({
        students: students || [],
        leads: leads || [],
        fees: fees || [],
        classes: classes || [],
        communications: communications || [],
        staff: staff || []
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

  // Show student report generator for teachers
  if (showStudentReports && user?.role === 'teacher') {
    return (
      <div className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-800">Student Reports</h1>
            <p className="text-secondary-600 mt-1">Generate comprehensive student reports</p>
          </div>
          <button
            onClick={() => setShowStudentReports(false)}
            className="px-4 py-2 text-secondary-600 hover:text-secondary-800 transition-colors"
          >
            View Analytics
          </button>
        </div>
        <StudentReportGenerator />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800">Reports & Analytics</h1>
          <p className="text-secondary-600 mt-1">Comprehensive insights and data analysis</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option value="overview">Overview</option>
            <option value="students">Students</option>
            <option value="financial">Financial</option>
            <option value="leads">Leads</option>
            {hasPermission(user, 'manage_staff') && <option value="staff">Staff</option>}
          </select>

          {/* Student Reports Button for Teachers */}
          {user?.role === 'teacher' && (
            <button
              onClick={() => setShowStudentReports(true)}
              className="flex items-center space-x-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-soft hover:shadow-medium"
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Student Reports</span>
            </button>
          )}

          {/* Date Range Filters for Super Admin */}
          {hasPermission(user, 'view_all_reports') && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="End Date"
              />
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              >
                <option value="">All Users</option>
                {reportData.staff.map((staff: any) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.first_name} {staff.last_name} ({staff.role})
                  </option>
                ))}
              </select>
            </>
          )}

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

      {/* Staff Analytics - Super Admin Only */}
      {hasPermission(user, 'manage_staff') && reportData.staff.length > 0 && (
        <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-secondary-800">Staff Analytics</h3>
            <UserCog className="w-6 h-6 text-primary-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Staff by Role */}
            <div>
              <h4 className="font-semibold text-secondary-800 mb-4">Staff by Role</h4>
              <div className="space-y-3">
                {[
                  { role: 'teacher', label: 'Teachers', color: 'primary' },
                  { role: 'office_staff', label: 'Office Staff', color: 'warning' },
                  { role: 'accountant', label: 'Accountants', color: 'success' },
                  { role: 'super_admin', label: 'Super Admins', color: 'danger' }
                ].map((roleData) => {
                  const count = reportData.staff.filter((s: any) => s.role === roleData.role).length;
                  return (
                    <div key={roleData.role} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full bg-${roleData.color}-500`}></div>
                        <span className="text-sm text-secondary-700">{roleData.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-secondary-800">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Staff Status */}
            <div>
              <h4 className="font-semibold text-secondary-800 mb-4">Staff Status</h4>
              <div className="space-y-3">
                {[
                  { status: 'active', label: 'Active', color: 'success' },
                  { status: 'inactive', label: 'Inactive', color: 'warning' },
                  { status: 'terminated', label: 'Terminated', color: 'danger' }
                ].map((statusData) => {
                  const count = reportData.staff.filter((s: any) => s.status === statusData.status).length;
                  return (
                    <div key={statusData.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full bg-${statusData.color}-500`}></div>
                        <span className="text-sm text-secondary-700">{statusData.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-secondary-800">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Salary Overview */}
            <div>
              <h4 className="font-semibold text-secondary-800 mb-4">Salary Overview</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-700">Total Monthly</span>
                  <span className="text-sm font-semibold text-secondary-800">
                    ${reportData.staff.reduce((sum: number, s: any) => sum + (s.salary || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-700">Average Salary</span>
                  <span className="text-sm font-semibold text-secondary-800">
                    ${reportData.staff.length > 0 ? (reportData.staff.reduce((sum: number, s: any) => sum + (s.salary || 0), 0) / reportData.staff.length).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-700">Highest Salary</span>
                  <span className="text-sm font-semibold text-secondary-800">
                    ${Math.max(...reportData.staff.map((s: any) => s.salary || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Experience Distribution */}
            <div>
              <h4 className="font-semibold text-secondary-800 mb-4">Experience</h4>
              <div className="space-y-3">
                {[
                  { range: '0-2 years', min: 0, max: 2, color: 'primary' },
                  { range: '3-5 years', min: 3, max: 5, color: 'warning' },
                  { range: '6-10 years', min: 6, max: 10, color: 'success' },
                  { range: '10+ years', min: 11, max: 100, color: 'danger' }
                ].map((expData) => {
                  const count = reportData.staff.filter((s: any) =>
                    s.experience_years >= expData.min && s.experience_years <= expData.max
                  ).length;
                  return (
                    <div key={expData.range} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full bg-${expData.color}-500`}></div>
                        <span className="text-sm text-secondary-700">{expData.range}</span>
                      </div>
                      <span className="text-sm font-semibold text-secondary-800">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

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