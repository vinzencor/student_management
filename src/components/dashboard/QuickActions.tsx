import React from 'react';
import { UserPlus, Calendar, FileText, DollarSign } from 'lucide-react';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const actions = [
    {
      title: 'Add New Lead',
      description: 'Register a new student inquiry',
      icon: UserPlus,
      color: 'blue',
      bgGradient: 'from-blue-500 to-indigo-600',
      hoverGradient: 'from-blue-600 to-indigo-700',
      action: 'add-lead'
    },
    {
      title: 'Schedule Class',
      description: 'Create a new class session',
      icon: Calendar,
      color: 'green',
      bgGradient: 'from-green-500 to-emerald-600',
      hoverGradient: 'from-green-600 to-emerald-700',
      action: 'schedule-class'
    },
    {
      title: 'Share Worksheet',
      description: 'Distribute study materials',
      icon: FileText,
      color: 'purple',
      bgGradient: 'from-purple-500 to-violet-600',
      hoverGradient: 'from-purple-600 to-violet-700',
      action: 'share-worksheet'
    },
    {
      title: 'Fee Reminder',
      description: 'Send payment notifications',
      icon: DollarSign,
      color: 'orange',
      bgGradient: 'from-orange-500 to-amber-600',
      hoverGradient: 'from-orange-600 to-amber-700',
      action: 'fee-reminder'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
      
      <div className="space-y-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              onClick={() => onAction(action.action)}
              className={`
                w-full p-4 bg-gradient-to-r ${action.bgGradient} hover:bg-gradient-to-r hover:${action.hoverGradient}
                rounded-xl text-white text-left transition-all duration-300 hover:scale-105 hover:shadow-lg
                transform animate-slideInRight
              `}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Additional info card */}
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-100">
        <h4 className="font-semibold text-gray-800 mb-2">💡 Quick Tip</h4>
        <p className="text-sm text-gray-600">
          Use keyboard shortcuts to access these actions faster: 
          <span className="font-mono bg-white px-2 py-1 rounded ml-2">Ctrl + N</span> for new lead
        </p>
      </div>
    </div>
  );
};

export default QuickActions;