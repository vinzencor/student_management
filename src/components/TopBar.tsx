import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Menu, User, Settings, ChevronDown, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TopBarProps {
  setSidebarOpen: (open: boolean) => void;
}

const TopBar: React.FC<TopBarProps> = ({ setSidebarOpen }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { user, signOut } = useAuth();

  // Refs for click outside detection
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [notifications, setNotifications] = useState([
    // Real notifications will be loaded from the database
  ]);

  return (
    <div className="bg-white shadow-soft border-b border-secondary-200 px-2 sm:px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between max-w-full">
        {/* Left section */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 transition-colors flex-shrink-0"
          >
            <Menu className="w-6 h-6 text-secondary-600" />
          </button>

          {/* Debug Role Indicator - Remove in production */}
          {process.env.NODE_ENV === 'development' && user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-2 sm:px-3 py-1 hidden lg:block">
              <span className="text-xs font-medium text-blue-800">
                Role: {user.role || 'undefined'} | Email: {user.email}
              </span>
            </div>
          )}

          <div className="relative hidden md:block flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Search students, classes, teachers..."
              className="pl-10 pr-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all w-full text-secondary-700 placeholder-secondary-400"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {/* Quick Sign Out Button - Always visible */}
          <button
            onClick={signOut}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-danger-50 hover:bg-danger-100 text-danger-600 hover:text-danger-700 rounded-lg transition-colors text-xs sm:text-sm font-medium"
            title="Sign Out"
          >
            <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-secondary-100 transition-colors relative group"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-600 group-hover:text-secondary-700" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse font-semibold shadow-soft">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-large border border-secondary-200 z-50 animate-slide-down">
                <div className="p-4 border-b border-secondary-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-secondary-800">Notifications</h3>
                    {notifications.length > 0 && (
                      <span className="text-xs text-secondary-500 bg-secondary-100 px-2 py-1 rounded-full">
                        {notifications.length} new
                      </span>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification: any) => (
                      <div key={notification.id} className="p-4 border-b border-secondary-50 hover:bg-secondary-50 transition-colors cursor-pointer group">
                        <div className="flex items-start space-x-3">
                          <div className={`w-2.5 h-2.5 rounded-full mt-2 ${notification.urgent ? 'bg-danger-500' : 'bg-primary-500'}`} />
                          <div className="flex-1">
                            <p className="text-sm text-secondary-800 group-hover:text-secondary-900">{notification.message}</p>
                            <p className="text-xs text-secondary-500 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-secondary-300 mx-auto mb-2" />
                      <p className="text-secondary-500 text-sm">No notifications yet</p>
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-4 border-t border-secondary-100">
                    <button className="w-full text-center text-primary-600 text-sm hover:text-primary-700 transition-colors font-medium">
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-xl hover:bg-secondary-100 transition-colors group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-soft">
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="font-semibold text-secondary-700 text-sm">
                  {user?.user_metadata?.first_name || 'User'} {user?.user_metadata?.last_name || ''}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <Shield className="w-3 h-3 text-primary-500" />
                  <p className="text-xs text-primary-600 capitalize font-medium">
                    {user?.role?.replace('_', ' ') || 'User'}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-secondary-500 group-hover:text-secondary-600 hidden sm:block" />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-xl shadow-large border border-secondary-200 z-50 animate-slide-down">
                <div className="p-4 border-b border-secondary-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-800">
                        {user?.user_metadata?.first_name || 'User'} {user?.user_metadata?.last_name || ''}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <div className={`w-2 h-2 rounded-full ${
                          user?.role === 'super_admin' ? 'bg-red-500' :
                          user?.role === 'accountant' ? 'bg-green-500' :
                          user?.role === 'teacher' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}></div>
                        <p className="text-sm text-secondary-600 capitalize">
                          {user?.role?.replace('_', ' ') || 'User'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button className="w-full text-left px-4 py-3 hover:bg-secondary-50 transition-colors flex items-center space-x-3 group">
                    <Settings className="w-4 h-4 text-secondary-500 group-hover:text-secondary-600" />
                    <span className="text-sm text-secondary-700 group-hover:text-secondary-800">Account Settings</span>
                  </button>
                  <button
                    onClick={signOut}
                    className="w-full text-left px-4 py-3 hover:bg-danger-50 transition-colors text-danger-600 hover:text-danger-700 flex items-center space-x-3"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;