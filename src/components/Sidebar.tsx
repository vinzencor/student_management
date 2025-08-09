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

  // Role-based navigation - exactly as requested
  const getMenuItems = () => {
    if (!user) return [];

    const userRole = user.role || '';
    const userEmail = user.email || '';

    // 👨‍🏫 TEACHER ACCESS - Only student-related features
    if (userRole === 'teacher' || userEmail.includes('teacher')) {
      return allMenuItems.filter(item =>
        ['students', 'batches', 'courses', 'schedule', 'attendance', 'reports'].includes(item.id)
      );
    }

    // 💰 ACCOUNTANT ACCESS - Financial and staff management
    if (userRole === 'accountant' || userEmail.includes('accountant')) {
      return allMenuItems.filter(item =>
        ['dashboard', 'staff', 'leads', 'fees', 'accounts', 'receipts', 'reports'].includes(item.id)
      );
    }

    // 👑 SUPER ADMIN ACCESS - Everything including staff management
    if (userRole === 'super_admin' || userEmail.includes('admin')) {
      return allMenuItems; // Full access to all features
    }

    // 🏢 OFFICE STAFF ACCESS - Limited operations
    if (userRole === 'office_staff' || userEmail.includes('office')) {
      return allMenuItems.filter(item =>
        ['dashboard', 'students', 'batches', 'leads', 'attendance', 'reports'].includes(item.id)
      );
    }

    // Default fallback - minimal access
    return allMenuItems.filter(item => ['dashboard'].includes(item.id));
  };

  const menuItems = getMenuItems();

  // Debug logging for troubleshooting
  console.log('🔍 Sidebar Debug:', {
    userEmail: user?.email,
    userRole: user?.role,
    userMetadata: user?.user_metadata,
    menuItemsCount: menuItems.length,
    menuItemIds: menuItems.map(m => m.id),
    allMenuItemsCount: allMenuItems.length
  });

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

        {/* User Role Indicator */}
        {user && (
          <div className="mt-4 px-4">
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-3">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  user.role === 'super_admin' ? 'bg-red-500' :
                  user.role === 'accountant' ? 'bg-green-500' :
                  user.role === 'teacher' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`}></div>
                <div>
                  <p className="text-xs font-medium text-primary-700">
                    {user.user_metadata?.first_name || 'User'}
                  </p>
                  <p className="text-xs text-primary-600 capitalize">
                    {user.role?.replace('_', ' ') || 'User'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 mt-6 px-4">
          <div className="space-y-1">
            {!user ? (
              // Loading state
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-10 bg-secondary-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : (
              // Menu items
              menuItems.map((item) => {
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
            }))
            }
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;