import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import StaffManagement from './components/StaffManagement';
import LeadManagement from './components/LeadManagement';
import StudentProfile from './components/StudentProfile';
import StudentsByBatch from './components/StudentsByBatch';
import CourseManagement from './components/CourseManagement';
import ClassSchedule from './components/ClassSchedule';
import FeeManagement from './components/FeeManagement';
import Reports from './components/Reports';
import AttendanceManagement from './components/AttendanceManagement';
import Accounts from './components/Accounts';
import IncomeReports from './components/IncomeReports';
import ExpenseReports from './components/ExpenseReports';
import Receipts from './components/Receipts';
import FeeReceipts from './components/FeeReceipts';

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
            {activeView === 'leads' && <LeadManagement />}
            {activeView === 'students' && <StudentProfile onNavigateToFeeReceipts={handleNavigateToFeeReceipts} />}
            {activeView === 'batches' && <StudentsByBatch />}
            {activeView === 'courses' && <CourseManagement />}
            {activeView === 'schedule' && <ClassSchedule />}
            {activeView === 'attendance' && <AttendanceManagement />}
            {activeView === 'fees' && <FeeManagement />}
            {activeView === 'accounts' && <Accounts />}
            {activeView === 'accounts-income' && <IncomeReports />}
            {activeView === 'accounts-expense' && <ExpenseReports />}
            {activeView === 'receipts' && <Receipts />}
            {activeView === 'fee-receipts' && <FeeReceipts />}
            {activeView === 'reports' && <Reports />}
            {activeView === 'settings' && <div className="text-center py-12"><h2 className="text-2xl font-bold text-secondary-600">Settings - Coming Soon</h2></div>}
          </div>
        </main>
      </div>
    </div>
  );
};

// Main App Component with Auth Provider
function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
