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
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Quick Actions</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              onClick={() => onAction(action.action)}
              className={`
                w-full p-3 sm:p-4 bg-gradient-to-r ${action.bgGradient} hover:bg-gradient-to-r hover:${action.hoverGradient}
                rounded-xl text-white text-center sm:text-left transition-all duration-300 hover:scale-105 hover:shadow-lg
                transform animate-slideInRight
              `}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base lg:text-lg">{action.title}</h3>
                  <p className="text-xs sm:text-sm opacity-90 hidden sm:block">{action.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Additional info card */}
      
    </div>
  );
};

export default QuickActions;