import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, BookOpen, AlertCircle, Users } from 'lucide-react';
import { DataService } from '../../services/dataService';
import { supabase } from '../../lib/supabase';
import type { Student, Parent } from '../../lib/supabase';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentAdded: (studentId?: string, totalFees?: number) => void;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, onStudentAdded }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    grade_level: '',
    date_of_birth: '',
    address: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    status: 'active' as Student['status'],
    subjects: [] as string[]
  });

  const [parentData, setParentData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    occupation: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createParent, setCreateParent] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<any[]>([]);

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
    'History', 'Geography', 'Computer Science', 'Economics', 'Art',
    'Music', 'Physical Education', 'Literature', 'Psychology', 'Philosophy'
  ];

  useEffect(() => {
    if (isOpen) {
      loadCourses();
    }
  }, [isOpen]);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleCourseToggle = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const isSelected = selectedCourses.some(c => c.id === courseId);

    if (isSelected) {
      setSelectedCourses(selectedCourses.filter(c => c.id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const getTotalFees = () => {
    return selectedCourses.reduce((total, course) => total + course.price, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleParentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setParentData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let parentId = null;

      // Create parent if needed
      if (createParent) {
        // Check if parent already exists by email
        const existingParent = parentData.email ? await DataService.findParentByEmail(parentData.email) : null;
        if (existingParent) {
          // Update existing parent with new information
          const updatedParent = await DataService.updateParent(existingParent.id, parentData);
          parentId = updatedParent.id;
        } else {
          // Create new parent
          const parent = await DataService.createParent(parentData);
          parentId = parent.id;
        }
      }

      // Create student
      const studentData = {
        ...formData,
        parent_id: parentId,
        course_id: selectedCourses[0]?.id || null // Set primary course
      };

      const createdStudent = await DataService.createStudent(studentData);

      // Don't create fee records automatically - let user set them in Fee Receipts
      console.log(`Student created with ${selectedCourses.length} courses. Total fees: ₹${getTotalFees()}`);

      // Create student-course enrollment records
      for (const course of selectedCourses) {
        try {
          await supabase
            .from('student_courses')
            .insert([{
              student_id: createdStudent.id,
              course_id: course.id,
              enrollment_date: formData.enrollment_date,
              status: 'active'
            }]);
        } catch (enrollmentError) {
          console.error(`Error creating enrollment record for course ${course.name}:`, enrollmentError);
        }
      }

      onStudentAdded(createdStudent.id, getTotalFees());
      onClose();
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        grade_level: '',
        date_of_birth: '',
        address: '',
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'active',
        subjects: []
      });
      setParentData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        occupation: ''
      });
      setSelectedCourses([]);
    } catch (error: any) {
      setError(error.message || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-large max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div>
            <h2 className="text-2xl font-bold text-secondary-800">Add New Student</h2>
            <p className="text-secondary-600 mt-1">Create a new student profile</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-secondary-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0" />
              <p className="text-danger-700 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Student Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-secondary-800 flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Student Information</span>
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="John"
                      required
                    />
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
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="+1 234-567-8900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Grade Level *
                    </label>
                    <select
                      name="grade_level"
                      value={formData.grade_level}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    >
                      <option value="">Select Grade</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                        <option key={grade} value={`Grade ${grade}`}>Grade {grade}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 absolute left-3 top-3 text-secondary-400" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                      placeholder="123 Main St, City, State, ZIP"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Enrollment Date *
                  </label>
                  <input
                    type="date"
                    name="enrollment_date"
                    value={formData.enrollment_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                  />
                </div>

                {/* Course Selection */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-3">
                    Select Courses * (Multiple courses allowed)
                  </label>
                  <div className="space-y-3 max-h-48 overflow-y-auto border border-secondary-300 rounded-xl p-4">
                    {courses.map((course) => {
                      const isSelected = selectedCourses.some(c => c.id === course.id);
                      return (
                        <div key={course.id} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id={`course-${course.id}`}
                            checked={isSelected}
                            onChange={() => handleCourseToggle(course.id)}
                            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                          />
                          <label htmlFor={`course-${course.id}`} className="flex-1 cursor-pointer">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-secondary-800">{course.name}</p>
                                <p className="text-xs text-secondary-600">{course.description}</p>
                              </div>
                              <span className="font-semibold text-primary-600">₹{course.price.toLocaleString()}</span>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Courses Summary */}
                  {selectedCourses.length > 0 && (
                    <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                      <h4 className="font-medium text-primary-800 mb-2">Selected Courses ({selectedCourses.length})</h4>
                      <div className="space-y-2">
                        {selectedCourses.map((course) => (
                          <div key={course.id} className="flex justify-between items-center text-sm">
                            <span className="text-primary-700">{course.name}</span>
                            <span className="font-semibold text-primary-800">₹{course.price.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="border-t border-primary-300 pt-2 mt-2">
                          <div className="flex justify-between items-center font-bold text-primary-900">
                            <span>Total Course Fees:</span>
                            <span>₹{getTotalFees().toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCourses.length === 0 && (
                    <p className="text-sm text-red-600 mt-2">Please select at least one course</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Subjects
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-secondary-200 rounded-xl p-3">
                    {subjects.map(subject => (
                      <label key={subject} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.subjects.includes(subject)}
                          onChange={() => handleSubjectToggle(subject)}
                          className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-secondary-700">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-secondary-800 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Parent/Guardian Information</span>
                </h3>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createParent}
                    onChange={(e) => setCreateParent(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-secondary-700">Create parent profile</span>
                </label>
              </div>
              
              {createParent && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={parentData.first_name}
                        onChange={handleParentInputChange}
                        className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Jane"
                        required={createParent}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={parentData.last_name}
                        onChange={handleParentInputChange}
                        className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Doe"
                        required={createParent}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                      <input
                        type="email"
                        name="email"
                        value={parentData.email}
                        onChange={handleParentInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="jane@example.com"
                        required={createParent}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Phone *
                    </label>
                    <div className="relative">
                      <Phone className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={parentData.phone}
                        onChange={handleParentInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="+1 234-567-8900"
                        required={createParent}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Address
                    </label>
                    <div className="relative">
                      <MapPin className="w-5 h-5 absolute left-3 top-3 text-secondary-400" />
                      <textarea
                        name="address"
                        value={parentData.address}
                        onChange={handleParentInputChange}
                        rows={2}
                        className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                        placeholder="123 Main St, City, State, ZIP"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Occupation
                    </label>
                    <input
                      type="text"
                      name="occupation"
                      value={parentData.occupation}
                      onChange={handleParentInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-secondary-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-secondary-300 text-secondary-700 rounded-xl hover:bg-secondary-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedCourses.length === 0}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStudentModal;
