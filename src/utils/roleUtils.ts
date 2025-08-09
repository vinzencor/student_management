import { User } from '@supabase/supabase-js';
import { Staff, RolePermission } from '../lib/supabase';

export type UserRole = 'teacher' | 'office_staff' | 'accountant' | 'super_admin';

export interface UserWithRole extends User {
  staff_profile?: Staff;
  role?: UserRole;
  permissions?: string[];
}

// Default permissions for each role
export const DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: [
    'view_dashboard',
    'manage_staff',
    'manage_students',
    'manage_leads',
    'manage_classes',
    'manage_courses',
    'manage_fees',
    'manage_accounts',
    'manage_attendance',
    'view_reports',
    'export_data',
    'manage_settings',
    'view_all_reports',
    'manage_salaries',
    'manage_receipts',
    'view_batches'
  ],
  teacher: [
    'view_dashboard',
    'view_students',
    'manage_students',
    'view_student_details',
    'mark_attendance',
    'view_attendance',
    'manage_attendance',
    'view_classes',
    'manage_classes',
    'view_courses',
    'manage_courses',
    'view_schedule',
    'manage_schedule',
    'view_batches',
    'manage_batches',
    'view_reports',
    'view_student_reports',
    'view_fees',
    'view_student_fees',
    'export_data',
    'manage_communications',
    'view_performance',
    'add_performance',
    'view_all_reports'
  ],
  office_staff: [
    'view_dashboard',
    'manage_students',
    'manage_leads',
    'view_reports',
    'manage_communications',
    'view_batches',
    'view_courses',
    'mark_attendance'
  ],
  accountant: [
    'view_dashboard',
    'manage_fees',
    'view_fees',
    'manage_accounts',
    'view_accounts',
    'manage_receipts',
    'view_receipts',
    'view_financial_reports',
    'manage_salaries',
    'view_money_flow',
    'export_financial_data',
    'view_reports',
    'manage_staff',
    'view_staff',
    'manage_leads',
    'view_leads',
    'view_students',
    'view_student_fees',
    'export_data'
  ]
};

// Navigation items for each role - Updated based on your requirements
export const ROLE_NAVIGATION: Record<UserRole, string[]> = {
  // Super Admin: Full access to all features
  super_admin: ['dashboard', 'staff', 'students', 'batches', 'leads', 'courses', 'schedule', 'attendance', 'fees', 'accounts', 'receipts', 'reports', 'settings'],

  // Teacher: Students, attendance, courses, class scheduling, batches, reports, fees (view only) - NO LEADS
  teacher: ['dashboard', 'students', 'batches', 'courses', 'schedule', 'attendance', 'fees', 'reports'],

  // Office Staff: Students, leads, basic operations
  office_staff: ['dashboard', 'students', 'batches', 'leads', 'courses', 'attendance', 'reports'],

  // Accountant: All account-related features including staff management for salaries, leads for revenue tracking
  accountant: ['dashboard', 'staff', 'leads', 'fees', 'accounts', 'receipts', 'reports']
};

// Check if user has a specific permission
export const hasPermission = (user: UserWithRole | null, permission: string): boolean => {
  if (!user || !user.role) return false;
  
  if (user.permissions) {
    return user.permissions.includes(permission);
  }
  
  return DEFAULT_PERMISSIONS[user.role]?.includes(permission) || false;
};

// Check if user has any of the specified permissions
export const hasAnyPermission = (user: UserWithRole | null, permissions: string[]): boolean => {
  return permissions.some(permission => hasPermission(user, permission));
};

// Check if user has all of the specified permissions
export const hasAllPermissions = (user: UserWithRole | null, permissions: string[]): boolean => {
  return permissions.every(permission => hasPermission(user, permission));
};

// Check if user can access a specific navigation item
export const canAccessNavItem = (user: UserWithRole | null, navItem: string): boolean => {
  if (!user || !user.role) return false;
  return ROLE_NAVIGATION[user.role]?.includes(navItem) || false;
};

// Get filtered navigation items for user
export const getFilteredNavigation = (user: UserWithRole | null): string[] => {
  if (!user || !user.role) return [];
  return ROLE_NAVIGATION[user.role] || [];
};

// Role hierarchy for permission inheritance
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 4,
  accountant: 3,
  office_staff: 2,
  teacher: 1
};

// Check if user has higher or equal role level
export const hasRoleLevel = (user: UserWithRole | null, requiredRole: UserRole): boolean => {
  if (!user || !user.role) return false;
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
};

// Get user display name
export const getUserDisplayName = (user: UserWithRole | null): string => {
  if (!user) return 'Unknown User';
  
  if (user.staff_profile) {
    return `${user.staff_profile.first_name} ${user.staff_profile.last_name}`;
  }
  
  if (user.user_metadata?.first_name && user.user_metadata?.last_name) {
    return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
  }
  
  return user.email || 'Unknown User';
};

// Get role display name
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    accountant: 'Accountant',
    office_staff: 'Office Staff',
    teacher: 'Teacher'
  };
  
  return roleNames[role] || role;
};

// Check if user can manage another user based on role hierarchy
export const canManageUser = (currentUser: UserWithRole | null, targetRole: UserRole): boolean => {
  if (!currentUser || !currentUser.role) return false;
  
  // Super admin can manage everyone
  if (currentUser.role === 'super_admin') return true;
  
  // Others can only manage users with lower role level
  return ROLE_HIERARCHY[currentUser.role] > ROLE_HIERARCHY[targetRole];
};

// Validate role permissions
export const validateRolePermissions = (role: UserRole, permissions: string[]): boolean => {
  const defaultPerms = DEFAULT_PERMISSIONS[role];
  return permissions.every(perm => defaultPerms.includes(perm));
};
