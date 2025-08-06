import React, { useState } from 'react';
import WelcomeHeader from './dashboard/WelcomeHeader';
import KPICards from './dashboard/KPICards';
import LeadPipeline from './dashboard/LeadPipeline';
import QuickActions from './dashboard/QuickActions';
import TaskAutomation from './dashboard/TaskAutomation';
import AttendanceHeatmap from './dashboard/AttendanceHeatmap';
import AddLeadModal from './modals/AddLeadModal';

interface DashboardProps {
  setActiveView?: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
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
    <div className="space-y-6">
      <WelcomeHeader />
      <KPICards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LeadPipeline onAddLead={() => setShowAddLeadModal(true)} />
        </div>
        <div>
          <QuickActions onAction={handleQuickAction} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskAutomation />
        <AttendanceHeatmap />
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