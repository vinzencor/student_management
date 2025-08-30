import React, { useState, useEffect } from 'react';
import { Mail, Send, Clock, Users, AlertTriangle, CheckCircle, RefreshCw, Settings, Calendar, BarChart3 } from 'lucide-react';
import { EmailNotificationService } from '../services/emailNotificationService';

interface EmailReminderRecord {
  id: string;
  student_id: string;
  reminder_type: string;
  sent_at: string;
  recipient_email: string;
  status: 'sent' | 'failed' | 'bounced';
  student?: {
    first_name: string;
    last_name: string;
    grade_level: string;
    parent?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

const EmailNotificationManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'manual' | 'settings'>('dashboard');
  const [emailHistory, setEmailHistory] = useState<EmailReminderRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [cronJobs, setCronJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadEmailHistory(),
          loadStats(),
          loadCronJobStatus()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const loadEmailHistory = async () => {
    try {
      const history = await EmailNotificationService.getAllEmailReminders(100);
      setEmailHistory(history);
    } catch (error) {
      console.error('Error loading email history:', error);
      setEmailHistory([]); // Set empty array on error
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await EmailNotificationService.getEmailReminderStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(null); // Set null on error
    }
  };

  const loadCronJobStatus = async () => {
    try {
      const jobs = await EmailNotificationService.getCronJobStatus();
      setCronJobs(jobs);
    } catch (error) {
      console.error('Error loading cron job status:', error);
      setCronJobs([]); // Set empty array on error
    }
  };

  const handleTestAllReminders = async () => {
    if (loading) return; // Prevent multiple clicks

    setLoading(true);
    try {
      const results = await EmailNotificationService.testAllReminders();
      setTestResults(results);
      alert('Test completed! Check the results below.');
    } catch (error) {
      console.error('Error testing reminders:', error);
      alert('Error testing reminders. Please check the console.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerEnrollmentReminders = async () => {
    if (loading) return; // Prevent multiple clicks

    setLoading(true);
    try {
      const results = await EmailNotificationService.triggerEnrollmentReminders();
      alert(`Enrollment reminders processed: ${results.emailsSent || 0} emails sent out of ${results.processedStudents || 0} students.`);
      await loadEmailHistory(); // Reload data
    } catch (error) {
      console.error('Error triggering enrollment reminders:', error);
      alert('Error triggering enrollment reminders: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAttendanceReminders = async () => {
    if (loading) return; // Prevent multiple clicks

    setLoading(true);
    try {
      const results = await EmailNotificationService.checkAttendanceReminders();
      alert(`Attendance reminders processed: ${results.emailsSent || 0} emails sent.`);
      await loadEmailHistory(); // Reload data
    } catch (error) {
      console.error('Error triggering attendance reminders:', error);
      alert('Error triggering attendance reminders: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerMonthlyReminders = async () => {
    if (loading) return; // Prevent multiple clicks

    setLoading(true);
    try {
      const results = await EmailNotificationService.sendMonthlyReminders();
      alert(`Monthly reminders processed: ${results.emailsSent || 0} emails sent.`);
      await loadEmailHistory(); // Reload data
    } catch (error) {
      console.error('Error triggering monthly reminders:', error);
      alert('Error triggering monthly reminders: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'bounced':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case 'enrollment_8_days':
        return 'Enrollment (8 days)';
      case 'attendance_8_days':
        return 'Attendance (8 days)';
      case 'monthly_fee':
        return 'Monthly Fee';
      default:
        return type;
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Mail className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Email Notification Manager</h2>
        </div>
        <button
          onClick={async () => {
            setLoading(true);
            try {
              await Promise.all([
                loadEmailHistory(),
                loadStats(),
                loadCronJobStatus()
              ]);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { key: 'history', label: 'Email History', icon: Clock },
          { key: 'manual', label: 'Manual Triggers', icon: Send },
          { key: 'settings', label: 'Settings', icon: Settings }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Emails Sent</p>
                  <p className="text-2xl font-bold text-blue-900">{emailHistory.length}</p>
                </div>
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Successful</p>
                  <p className="text-2xl font-bold text-green-900">
                    {emailHistory.filter(e => e.status === 'sent').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-red-50 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Failed</p>
                  <p className="text-2xl font-bold text-red-900">
                    {emailHistory.filter(e => e.status === 'failed').length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Email Activity</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {emailHistory.slice(0, 10).map((email) => (
                  <div key={email.id} className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(email.status)}
                      <div>
                        <p className="font-medium text-gray-900">
                          {email.student?.first_name} {email.student?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {getReminderTypeLabel(email.reminder_type)} • {email.recipient_email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatDate(email.sent_at)}</p>
                      <p className="text-xs text-gray-400 capitalize">{email.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Triggers Tab */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Reminders</h3>
              <p className="text-sm text-gray-600 mb-4">
                Send reminders to students who enrolled 8 days ago and haven't received a reminder yet.
              </p>
              <button
                onClick={handleTriggerEnrollmentReminders}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Trigger Enrollment Reminders</span>
              </button>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Reminders</h3>
              <p className="text-sm text-gray-600 mb-4">
                Send reminders to students who have attended exactly 8 days.
              </p>
              <button
                onClick={handleTriggerAttendanceReminders}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Users className="w-4 h-4" />
                <span>Trigger Attendance Reminders</span>
              </button>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Reminders</h3>
              <p className="text-sm text-gray-600 mb-4">
                Send monthly fee reminders to all active students.
              </p>
              <button
                onClick={handleTriggerMonthlyReminders}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Calendar className="w-4 h-4" />
                <span>Trigger Monthly Reminders</span>
              </button>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test All Systems</h3>
              <p className="text-sm text-gray-600 mb-4">
                Test all reminder systems to ensure they're working correctly.
              </p>
              <button
                onClick={handleTestAllReminders}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                <Settings className="w-4 h-4" />
                <span>Test All Systems</span>
              </button>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Test Email</h3>
              <p className="text-sm text-gray-600 mb-4">
                Send a test email to verify the email system is working.
              </p>
              <button
                onClick={async () => {
                  if (loading) return;
                  setLoading(true);
                  try {
                    const result = await EmailNotificationService.sendFeeReminder({
                      type: 'enrollment_reminder',
                      studentId: 'test-student-id',
                      parentEmail: 'test@example.com',
                      studentEmail: 'student@example.com'
                    });

                    if (result.success) {
                      alert('✅ Test email sent successfully! Check your email logs.');
                    } else {
                      alert('❌ Test email failed: ' + result.error);
                    }
                  } catch (error: any) {
                    alert('❌ Test email error: ' + error.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                <span>Send Test Email</span>
              </button>
            </div>
          </div>

          {testResults && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
              <pre className="text-sm bg-white p-4 rounded border overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailNotificationManager;
