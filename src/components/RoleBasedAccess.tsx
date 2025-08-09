import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission, hasAnyPermission, canAccessNavItem } from '../utils/roleUtils';
import { Shield, Lock } from 'lucide-react';

interface RoleBasedAccessProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  navItem?: string;
  role?: string;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  children,
  permission,
  permissions,
  navItem,
  role,
  fallback,
  showFallback = false
}) => {
  const { user } = useAuth();

  // Check access based on different criteria
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(user, permission);
  } else if (permissions) {
    hasAccess = hasAnyPermission(user, permissions);
  } else if (navItem) {
    hasAccess = canAccessNavItem(user, navItem);
  } else if (role) {
    hasAccess = user?.role === role;
  } else {
    // If no criteria specified, allow access
    hasAccess = true;
  }

  if (!hasAccess) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    
    if (showFallback) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Access Restricted</h3>
          <p className="text-red-600">
            You don't have permission to access this feature.
          </p>
          <p className="text-sm text-red-500 mt-2">
            Current role: <span className="font-medium capitalize">{user?.role?.replace('_', ' ')}</span>
          </p>
        </div>
      );
    }
    
    return null;
  }

  return <>{children}</>;
};

// Higher-order component for role-based access
export const withRoleAccess = (
  Component: React.ComponentType<any>,
  accessConfig: Omit<RoleBasedAccessProps, 'children'>
) => {
  return (props: any) => (
    <RoleBasedAccess {...accessConfig}>
      <Component {...props} />
    </RoleBasedAccess>
  );
};

// Role badge component
export const RoleBadge: React.FC<{ role?: string; size?: 'sm' | 'md' | 'lg' }> = ({ 
  role, 
  size = 'md' 
}) => {
  const { user } = useAuth();
  const userRole = role || user?.role;

  if (!userRole) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'accountant':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'teacher':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'office_staff':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full border capitalize
      ${getRoleColor(userRole)} ${getSizeClasses(size)}
    `}>
      <Shield className="w-3 h-3 mr-1" />
      {userRole.replace('_', ' ')}
    </span>
  );
};

// Permission checker hook
export const usePermissions = () => {
  const { user } = useAuth();

  return {
    hasPermission: (permission: string) => hasPermission(user, permission),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(user, permissions),
    canAccessNavItem: (navItem: string) => canAccessNavItem(user, navItem),
    userRole: user?.role,
    isAdmin: user?.role === 'super_admin',
    isAccountant: user?.role === 'accountant',
    isTeacher: user?.role === 'teacher',
    isOfficeStaff: user?.role === 'office_staff'
  };
};

export default RoleBasedAccess;
