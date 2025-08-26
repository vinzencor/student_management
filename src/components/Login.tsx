import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Shield, User, DollarSign, UserCog } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showDemoLogin, setShowDemoLogin] = useState(true);

  const { signIn, signUp } = useAuth();

  // Demo accounts for easy role testing
  const demoAccounts = [
    {
      role: 'super_admin',
      email: 'admin@educare.com',
      name: 'Super Admin',
      icon: Shield,
      color: 'from-red-500 to-red-600',
      description: 'Full access to all features'
    },
    {
      role: 'accountant',
      email: 'accountant@educare.com',
      name: 'Accountant',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      description: 'Staff, leads, accounts, fees, receipts, reports'
    },
    {
      role: 'teacher',
      email: 'teacher@educare.com',
      name: 'Teacher',
      icon: User,
      color: 'from-blue-500 to-blue-600',
      description: 'Students, attendance, courses, schedule'
    },
    {
      role: 'office_staff',
      email: 'office@educare.com',
      name: 'Office Staff',
      icon: UserCog,
      color: 'from-yellow-500 to-yellow-600',
      description: 'Students, leads, basic operations'
    }
  ];

  const handleDemoLogin = async (demoAccount: typeof demoAccounts[0]) => {
    setLoading(true);
    setError('');

    try {
      const { error } = await signIn(demoAccount.email, '123456');
      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, {
          first_name: firstName,
          last_name: lastName,
          role: 'admin'
        });
        if (error) throw error;
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-large overflow-hidden">
            <img
              src="/Logo.jpeg"
              alt="School Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to icon if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="w-32 h-32 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center"><svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg></div>';
              }}
            />
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-large border border-secondary-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-secondary-800 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-secondary-600">
              {isSignUp ? 'Set up your admin account' : 'Sign in to your account'}
            </p>
          </div>

          {/* Demo Login Quick Access */}
          {/* <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
            <h3 className="text-sm font-semibold text-primary-800 mb-3">Quick Demo Access</h3>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => {
                const Icon = account.icon;
                return (
                  <button
                    key={account.role}
                    onClick={() => handleDemoLogin(account)}
                    disabled={loading}
                    className="p-2 rounded-lg border border-primary-200 hover:bg-primary-100 transition-colors disabled:opacity-50 text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 bg-gradient-to-r ${account.color} rounded flex items-center justify-center`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-medium text-primary-700">{account.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div> */}

          {error && (
            <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0" />
              <p className="text-danger-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="admin@educare.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                </div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
        </div>

        {/* Demo Access */}
        {/* <div className="mt-6 p-4 bg-secondary-50 rounded-xl border border-secondary-200">
          <h3 className="font-semibold text-secondary-800 mb-3">Quick Demo Access</h3>
          <button
            onClick={() => {
              setEmail('admin@educare.com');
              setPassword('admin123');
            }}
            className="w-full mb-3 px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg transition-colors text-sm font-medium"
          >
            Fill Demo Credentials
          </button>
          <div className="text-xs text-secondary-600 space-y-1">
            <p>Email: admin@educare.com</p>
            <p>Password: admin123</p>
            <p className="text-warning-600 font-medium">Note: Using demo mode due to Supabase auth configuration</p>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Login;
