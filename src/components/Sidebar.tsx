import React from 'react';
import {
  Home,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  GraduationCap,
  X,
  UserCog
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { canAccessNavItem } from '../utils/roleUtils';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, badge: null },
    { id: 'staff', label: 'Staff Management', icon: UserCog, badge: null },
    { id: 'leads', label: 'Lead Management', icon: Users, badge: null },
    { id: 'students', label: 'Students', icon: GraduationCap, badge: null },
    { id: 'batches', label: 'Students by Batch', icon: Calendar, badge: null },
    { id: 'courses', label: 'Course Management', icon: GraduationCap, badge: null },
    { id: 'schedule', label: 'Class Schedule', icon: Calendar, badge: null },
    { id: 'attendance', label: 'Attendance', icon: Calendar, badge: null },
    { id: 'fees', label: 'Fee Management', icon: DollarSign, badge: null },
    { id: 'accounts', label: 'Accounts', icon: DollarSign, badge: null },
    { id: 'receipts', label: 'Receipts', icon: BarChart3, badge: null },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => canAccessNavItem(user, item.id));

  const handleMenuClick = (viewId: string) => {
    setActiveView(viewId);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-large transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0 border-r border-secondary-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo section */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-soft">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-secondary-800">EduCare</span>
              <p className="text-xs text-secondary-500 font-medium">Student Management</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            <X className="w-5 h-5 text-secondary-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6 px-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200 group
                    ${isActive
                      ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 shadow-soft border border-primary-200'
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                    }
                    hover:scale-[1.01] transform
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'group-hover:text-secondary-700'}`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      isActive
                        ? 'bg-primary-200 text-primary-700'
                        : 'bg-secondary-200 text-secondary-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;