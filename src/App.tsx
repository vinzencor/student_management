import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import LeadManagement from './components/LeadManagement';
import StudentProfile from './components/StudentProfile';
import ClassSchedule from './components/ClassSchedule';
import FeeManagement from './components/FeeManagement';
import Reports from './components/Reports';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-secondary-100 flex">
          <Sidebar
            activeView={activeView}
            setActiveView={setActiveView}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
            <TopBar setSidebarOpen={setSidebarOpen} />

            <main className="flex-1 px-4 lg:px-6 pb-4 lg:pb-6">
              <div className="animate-fade-in">
                {activeView === 'dashboard' && <Dashboard setActiveView={setActiveView} />}
                {activeView === 'leads' && <LeadManagement />}
                {activeView === 'students' && <StudentProfile />}
                {activeView === 'schedule' && <ClassSchedule />}
                {activeView === 'fees' && <FeeManagement />}
                {activeView === 'reports' && <Reports />}
                {activeView === 'settings' && <div className="text-center py-12"><h2 className="text-2xl font-bold text-secondary-600">Settings - Coming Soon</h2></div>}
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
