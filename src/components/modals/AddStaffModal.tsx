import React, { useState } from 'react';
import { X, User, Mail, Phone, Calendar, DollarSign, GraduationCap, Briefcase } from 'lucide-react';
import type { Staff } from '../../lib/supabase';

interface AddStaffModalProps {
  onClose: () => void;
  onSubmit: (staff: Omit<Staff, 'id' | 'created_at' | 'updated_at'>) => void;
}

const AddStaffModal: React.FC<AddStaffModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'teacher' as Staff['role'],
    subjects: [] as string[],
    qualification: '',
    experience_years: 0,
    salary: '',
    hire_date: new Date().toISOString().split('T')[0],
    status: 'active' as Staff['status']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const subjectOptions = [
    'Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Computer Science', 'Art', 'Music', 'Physical Education'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experience_years' ? parseInt(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubjectChange = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.hire_date) newErrors.hire_date = 'Hire date is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Role-specific validation
    if (formData.role === 'teacher' && formData.subjects.length === 0) {
      newErrors.subjects = 'Teachers must have at least one subject';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const staffData: Omit<Staff, 'id' | 'created_at' | 'updated_at'> = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        role: formData.role,
        subjects: formData.role === 'teacher' ? formData.subjects : undefined,
        qualification: formData.qualification.trim() || undefined,
        experience_years: formData.experience_years,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        hire_date: formData.hire_date,
        status: formData.status
      };

      await onSubmit(staffData);
    } catch (error) {
      console.error('Error creating staff:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-large w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <h2 className="text-2xl font-bold text-secondary-800">Add New Staff Member</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-secondary-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-secondary-800 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                    errors.first_name ? 'border-danger-300' : 'border-secondary-300'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <p className="text-danger-600 text-sm mt-1">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                    errors.last_name ? 'border-danger-300' : 'border-secondary-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.last_name && (
                  <p className="text-danger-600 text-sm mt-1">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                    errors.email ? 'border-danger-300' : 'border-secondary-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-danger-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                    errors.phone ? 'border-danger-300' : 'border-secondary-300'
                  }`}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="text-danger-600 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Role and Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-secondary-800 flex items-center space-x-2">
              <Briefcase className="w-5 h-5" />
              <span>Professional Information</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                >
                  <option value="teacher">Teacher</option>
                  <option value="office_staff">Office Staff</option>
                  <option value="accountant">Accountant</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  name="experience_years"
                  value={formData.experience_years}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  className="w-full px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>

            {formData.role === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Subjects *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {subjectOptions.map((subject) => (
                    <label key={subject} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={() => handleSubjectChange(subject)}
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-secondary-700">{subject}</span>
                    </label>
                  ))}
                </div>
                {errors.subjects && (
                  <p className="text-danger-600 text-sm mt-1">{errors.subjects}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                <GraduationCap className="w-4 h-4 inline mr-1" />
                Qualification
              </label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                placeholder="e.g., B.Ed, M.A., Ph.D"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Monthly Salary
                </label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Hire Date *
                </label>
                <input
                  type="date"
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                    errors.hire_date ? 'border-danger-300' : 'border-secondary-300'
                  }`}
                />
                {errors.hire_date && (
                  <p className="text-danger-600 text-sm mt-1">{errors.hire_date}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-secondary-300 text-secondary-700 rounded-xl hover:bg-secondary-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaffModal;
