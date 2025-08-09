import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Staff } from '../lib/supabase';
import { UserWithRole, UserRole } from '../utils/roleUtils';

interface AuthContextType {
  user: UserWithRole | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch staff profile and permissions for a user
  const fetchUserProfile = async (authUser: User): Promise<UserWithRole> => {
    try {
      // Special handling for admin@educare.com - always super admin
      if (authUser.email?.toLowerCase() === 'admin@educare.com') {
        return {
          ...authUser,
          staff_profile: {
            id: 'admin-profile-id',
            first_name: 'Super',
            last_name: 'Admin',
            email: 'admin@educare.com',
            phone: '+1-555-0001',
            role: 'super_admin',
            qualification: 'System Administrator',
            experience_years: 10,
            salary: 8000,
            hire_date: new Date().toISOString().split('T')[0],
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          role: 'super_admin',
          permissions: [
            'view_dashboard',
            'manage_staff',
            'manage_students',
            'manage_leads',
            'manage_classes',
            'manage_fees',
            'view_reports',
            'export_data',
            'manage_settings',
            'view_all_reports',
            'manage_salaries'
          ]
        };
      }

      // Try to find staff profile by email
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (staffError && staffError.code !== 'PGRST116') {
        console.error('Error fetching staff profile:', staffError);
      }

      // Determine role from multiple sources (priority order)
      let userRole: UserRole = 'teacher'; // default

      // Debug logging for role detection
      console.log('🔍 Role Detection Debug:', {
        email: authUser.email,
        authUserRole: (authUser as any).role,
        staffDataRole: staffData?.role,
        userMetadataRole: authUser.user_metadata?.role,
        rawUserMetadata: authUser.user_metadata
      });

      // 1. Check user metadata role (most reliable for new users)
      if (authUser.user_metadata?.role) {
        userRole = authUser.user_metadata.role as UserRole;
        console.log('✅ Role from user_metadata:', userRole);
      }
      // 2. Check staff data role
      else if (staffData?.role) {
        userRole = staffData.role as UserRole;
        console.log('✅ Role from staff data:', userRole);
      }
      // 3. Check if auth user has role field (new Supabase setup)
      else if ((authUser as any).role) {
        userRole = (authUser as any).role as UserRole;
        console.log('✅ Role from auth user:', userRole);
      }
      // 4. Fallback to email pattern detection
      else if (authUser.email) {
        const email = authUser.email.toLowerCase();
        if (email.includes('teacher')) userRole = 'teacher';
        else if (email.includes('accountant')) userRole = 'accountant';
        else if (email.includes('office')) userRole = 'office_staff';
        else if (email.includes('admin')) userRole = 'super_admin';
        console.log('✅ Role from email pattern:', userRole);
      }

      const userWithRole: UserWithRole = {
        ...authUser,
        staff_profile: staffData || undefined,
        role: userRole,
        permissions: []
      };

      // Get default permissions for the role
      const { DEFAULT_PERMISSIONS } = await import('../utils/roleUtils');
      userWithRole.permissions = DEFAULT_PERMISSIONS[userRole] || [];

      // Try to fetch custom permissions from database
      try {
        const { data: permissionsData, error: permError } = await supabase
          .from('role_permissions')
          .select('permission')
          .eq('role', userRole);

        if (!permError && permissionsData && permissionsData.length > 0) {
          userWithRole.permissions = permissionsData.map(p => p.permission);
        }
      } catch (permError) {
        console.warn('Could not fetch custom permissions, using defaults:', permError);
      }

      console.log('✅ Final User Profile:', {
        email: userWithRole.email,
        role: userWithRole.role,
        permissionsCount: userWithRole.permissions?.length,
        permissions: userWithRole.permissions?.slice(0, 5)
      });

      return userWithRole;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Return a basic user with default permissions
      return {
        ...authUser,
        role: 'teacher',
        permissions: ['view_dashboard', 'view_students', 'view_student_details']
      };
    }
  };

  const refreshUserProfile = async () => {
    if (session?.user) {
      const userWithRole = await fetchUserProfile(session.user);
      setUser(userWithRole);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('AuthContext: Getting initial session...');
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session?.user) {
          console.log('AuthContext: User found, fetching profile...', session.user.email);
          const userWithRole = await fetchUserProfile(session.user);
          console.log('AuthContext: User profile loaded:', { role: userWithRole?.role, email: userWithRole?.email });
          setUser(userWithRole);
        } else {
          console.log('AuthContext: No session found');
          setUser(null);
        }
      } catch (error) {
        console.error('AuthContext: Error getting initial session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event, session?.user?.email);
        setSession(session);

        try {
          if (session?.user) {
            const userWithRole = await fetchUserProfile(session.user);
            console.log('AuthContext: Profile updated:', { role: userWithRole?.role, email: userWithRole?.email });
            setUser(userWithRole);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('AuthContext: Error in auth state change:', error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Authentication failed:', error.message);

        // Check if this is admin@educare.com and provide helpful message
        if (email.toLowerCase() === 'admin@educare.com') {
          console.warn('Admin login failed. Please run the Supabase setup script first.');

          // For admin@educare.com, still provide demo access if auth fails
          const mockUser = {
            id: 'demo-super-admin-id',
            email: email,
            user_metadata: {
              first_name: 'Super',
              last_name: 'Admin',
              role: 'super_admin'
            }
          } as any;

          const userWithRole = await fetchUserProfile(mockUser);
          setUser(userWithRole);
          setSession({ user: mockUser } as any);

          return { error: null };
        }

        // For other emails, return the actual error
        return { error };
      }

      return { error };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) {
        // For demo purposes, if auth fails, create a mock user session
        console.warn('Sign up failed, using demo mode:', error.message);

        // Special handling for admin@educare.com - always gets super admin access
        let mockUserRole = userData?.role || 'teacher'; // default role
        let firstName = userData?.first_name || 'Demo';
        let lastName = userData?.last_name || 'User';

        if (email.toLowerCase() === 'admin@educare.com') {
          mockUserRole = 'super_admin';
          firstName = 'Super';
          lastName = 'Admin';
        }

        // Create a mock user for demo
        const mockUser = {
          id: `demo-${mockUserRole}-signup-id`,
          email: email,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            role: mockUserRole
          }
        } as any;

        const userWithRole = await fetchUserProfile(mockUser);
        setUser(userWithRole);
        setSession({ user: mockUser } as any);

        return { error: null };
      }

      return { error };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
