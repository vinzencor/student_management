import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import StaffManagement from './components/StaffManagement';
import StaffLeadTracking from './components/StaffLeadTracking';
import LeadManagement from './components/LeadManagement';
import LeadTriage from './components/LeadTriage';
import StudentProfile from './components/StudentProfile';
import BatchManagement from './components/BatchManagement';
import StudentsByBatch from './components/StudentsByBatch';
import CourseManagement from './components/CourseManagement';
import ClassSchedule from './components/ClassSchedule';
import BatchScheduling from './components/BatchScheduling';
import FeeManagement from './components/FeeManagement';
import ExternalFeeManagement from './components/ExternalFeeManagement';
import Reports from './components/Reports';
import AttendanceManagement from './components/AttendanceManagement';
import Accounts from './components/Accounts';
import IncomeReports from './components/IncomeReports';
import ExpenseReports from './components/ExpenseReports';
import Receipts from './components/Receipts';
import FeeReceipts from './components/FeeReceipts';
import FeeReminder from './components/FeeReminder';
import EmailNotificationManager from './components/EmailNotificationManager';
import ExternalPaymentForm from './components/ExternalPaymentForm';

// Main App Content Component
const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigateToFeeReceipts = (studentId: string) => {
    setActiveView('fee-receipts');
    // You can also store the studentId in state if you want to filter by that student
  };

  // Set default landing page based on user role
  useEffect(() => {
    if (user && user.role) {
      const getDefaultView = (role: string, email: string) => {
        // Role-based default landing pages as requested
        if (role === 'teacher' || email.includes('teacher')) {
          return 'students'; // 👨‍🏫 Teachers → Students page (their main focus)
        } else if (role === 'accountant' || email.includes('accountant')) {
          return 'dashboard'; // 💰 Accountants → Dashboard (financial overview)
        } else if (role === 'super_admin' || email.includes('admin')) {
          return 'dashboard'; // 👑 Super Admin → Dashboard (system overview)
        } else if (role === 'office_staff' || email.includes('office')) {
          return 'students'; // 🏢 Office Staff → Students page (their main work)
        }
        return 'dashboard'; // Default fallback
      };

      const defaultView = getDefaultView(user.role || '', user.email || '');
      setActiveView(defaultView);
      console.log('🎯 Role-based redirect:', {
        role: user.role,
        email: user.email,
        defaultView,
        userMetadata: user.user_metadata,
        currentActiveView: activeView
      });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-secondary-100 flex overflow-hidden">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <TopBar setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 px-2 sm:px-4 lg:px-6 pb-4 lg:pb-6 overflow-x-hidden overflow-y-auto">
          <div className="animate-fade-in max-w-full">
            {activeView === 'dashboard' && <Dashboard setActiveView={setActiveView} />}
            {activeView === 'staff' && <StaffManagement />}
            {activeView === 'staff-leads' && <StaffLeadTracking />}
            {activeView === 'leads' && <LeadManagement />}
            {activeView === 'lead-triage' && <LeadTriage />}
            {activeView === 'students' && <StudentProfile onNavigateToFeeReceipts={handleNavigateToFeeReceipts} />}
            {activeView === 'batch-management' && <BatchManagement />}
            {activeView === 'batches' && <StudentsByBatch />}
            {activeView === 'courses' && <CourseManagement />}
            {activeView === 'schedule' && <ClassSchedule />}
            {activeView === 'batch-scheduling' && <BatchScheduling />}
            {activeView === 'attendance' && <AttendanceManagement />}
            {activeView === 'fees' && <FeeManagement />}
            {activeView === 'external-fees' && <ExternalFeeManagement />}
            {activeView === 'accounts' && <Accounts />}
            {activeView === 'accounts-income' && <IncomeReports />}
            {activeView === 'accounts-expense' && <ExpenseReports />}
            {activeView === 'receipts' && <Receipts />}
            {activeView === 'fee-receipts' && <FeeReceipts />}
            {activeView === 'fee-reminder' && <FeeReminder />}
            {activeView === 'email-notifications' && <EmailNotificationManager />}
            {activeView === 'reports' && <Reports />}
            {activeView === 'settings' && <div className="text-center py-12"><h2 className="text-2xl font-bold text-secondary-600">Settings - Coming Soon</h2></div>}
          </div>
        </main>
      </div>
    </div>
  );
};

// External Payment Page Component (Public Route)
const ExternalPaymentPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  if (!token) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-secondary-800 mb-2">Invalid Link</h2>
            <p className="text-secondary-600">This payment link is invalid or malformed.</p>
          </div>
        </div>
      </div>
    );
  }

  return <ExternalPaymentForm token={token} />;
};

// Main App Component with Auth Provider and Routing
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route for External Payment */}
          <Route path="/external-payment/:token" element={<ExternalPaymentPage />} />

          {/* Protected Routes for Admin Dashboard */}
          <Route path="/*" element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
