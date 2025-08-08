import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import WelcomeHeader from './dashboard/WelcomeHeader';
import KPICards from './dashboard/KPICards';
import LeadPipeline from './dashboard/LeadPipeline';
import QuickActions from './dashboard/QuickActions';
import TaskAutomation from './dashboard/TaskAutomation';
import AttendanceHeatmap from './dashboard/AttendanceHeatmap';
import AddLeadModal from './modals/AddLeadModal';
import TeacherDashboard from './TeacherDashboard';
import AccountantDashboard from './AccountantDashboard';

interface DashboardProps {
  setActiveView?: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
  const { user } = useAuth();
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  // Route to role-specific dashboards
  if (user?.role === 'teacher') {
    return <TeacherDashboard />;
  }

  if (user?.role === 'accountant') {
    return <AccountantDashboard />;
  }

  // Default dashboard for super_admin and office_staff
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-lead':
        setShowAddLeadModal(true);
        break;
      case 'schedule-class':
        setActiveView?.('schedule');
        break;
      case 'share-worksheet':
        // Future implementation
        alert('Worksheet sharing feature coming soon!');
        break;
      case 'fee-reminder':
        setActiveView?.('fees');
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <WelcomeHeader />
      <KPICards />

      {/* Lead Pipeline - Full Width with Fixed Height */}
      <div className="w-full">
        <LeadPipeline onAddLead={() => setShowAddLeadModal(true)} />
      </div>

      {/* Task Automation and Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskAutomation />
        <AttendanceHeatmap />
      </div>

      {/* Quick Actions - Moved to Bottom */}
      <div className="w-full">
        <QuickActions onAction={handleQuickAction} />
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={showAddLeadModal}
        onClose={() => setShowAddLeadModal(false)}
        onLeadAdded={() => {
          setShowAddLeadModal(false);
          // Optionally refresh data or show success message
        }}
      />
    </div>
  );
};

export default Dashboard;