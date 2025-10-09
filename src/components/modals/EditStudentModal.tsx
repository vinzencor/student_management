import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, BookOpen, AlertCircle, Users } from 'lucide-react';
import { DataService } from '../../services/dataService';
import { supabase } from '../../lib/supabase';
import type { Student, Parent } from '../../lib/supabase';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onStudentUpdated: () => void;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ 
  isOpen, 
  onClose, 
  student, 
  onStudentUpdated 
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    grade_level: '',
    date_of_birth: '',
    address: '',
    enrollment_date: '',
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
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<any[]>([]);

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 
    'History', 'Geography', 'Computer Science', 'Economics', 'Art',
    'Music', 'Physical Education', 'Literature', 'Psychology', 'Philosophy'
  ];

  useEffect(() => {
    if (isOpen && student) {
      loadStudentData();
      loadCourses();
    }
  }, [isOpen, student]);

  const loadStudentData = async () => {
    try {
      // Load student data
      setFormData({
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        email: student.email || '',
        phone: student.phone || '',
        grade_level: student.grade_level || '',
        date_of_birth: student.date_of_birth || '',
        address: student.address || '',
        enrollment_date: student.enrollment_date || '',
        status: student.status || 'active',
        subjects: student.subjects || []
      });

      // Load parent data if exists
      if (student.parent_id) {
        const { data: parentInfo } = await supabase
          .from('parents')
          .select('*')
          .eq('id', student.parent_id)
          .single();
        
        if (parentInfo) {
          setParentData({
            first_name: parentInfo.first_name || '',
            last_name: parentInfo.last_name || '',
            email: parentInfo.email || '',
            phone: parentInfo.phone || '',
            address: parentInfo.address || '',
            occupation: parentInfo.occupation || ''
          });
        }
      }

      // Load enrolled courses
      const { data: enrolledCourses } = await supabase
        .from('student_courses')
        .select('*, courses(*)')
        .eq('student_id', student.id)
        .eq('status', 'active');
      
      if (enrolledCourses) {
        setSelectedCourses(enrolledCourses.map(ec => ec.courses));
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    }
  };

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

  const syncFeeRecordsWithCourses = async (studentId: string, removedCourseIds: string[], addedCourseIds: string[], allSelectedCourses: any[]) => {
    try {
      console.log('🔄 Syncing fee records with course changes...');

      // Handle removed courses - remove or mark as inactive fee records for removed courses
      if (removedCourseIds.length > 0) {
        console.log('❌ Removing fee records for courses:', removedCourseIds);

        // Get fee records for removed courses that haven't been paid
        const { data: unpaidFees } = await supabase
          .from('fees')
          .select('*')
          .eq('student_id', studentId)
          .in('course_id', removedCourseIds)
          .in('status', ['pending', 'partial']);

        // Delete unpaid fee records for removed courses
        if (unpaidFees && unpaidFees.length > 0) {
          await supabase
            .from('fees')
            .delete()
            .eq('student_id', studentId)
            .in('course_id', removedCourseIds)
            .in('status', ['pending', 'partial']);

          console.log(`✅ Removed ${unpaidFees.length} unpaid fee records for removed courses`);
        }

        // For paid fees, we keep them but mark them as completed/historical
        const { data: paidFees } = await supabase
          .from('fees')
          .select('*')
          .eq('student_id', studentId)
          .in('course_id', removedCourseIds)
          .eq('status', 'paid');

        if (paidFees && paidFees.length > 0) {
          console.log(`ℹ️ Keeping ${paidFees.length} paid fee records for removed courses (historical data)`);
        }
      }

      // Handle added courses - create fee records for new courses
      if (addedCourseIds.length > 0) {
        console.log('➕ Creating fee records for new courses:', addedCourseIds);

        const newFeeRecords = [];
        for (const courseId of addedCourseIds) {
          const course = allSelectedCourses.find(c => c.id === courseId);
          if (course) {
            newFeeRecords.push({
              student_id: studentId,
              course_id: courseId,
              amount: course.price,
              paid_amount: 0,
              status: 'pending',
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
              fee_type: 'tuition',
              description: `Course fee for ${course.name}`,
              created_at: new Date().toISOString()
            });
          }
        }

        if (newFeeRecords.length > 0) {
          await supabase
            .from('fees')
            .insert(newFeeRecords);

          console.log(`✅ Created ${newFeeRecords.length} fee records for new courses`);
        }
      }

      console.log('✅ Fee records synchronized with course changes');
    } catch (error) {
      console.error('❌ Error syncing fee records:', error);
      // Don't throw error to avoid breaking the student update
    }
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
      // Update student first
      await DataService.updateStudent(student.id, formData);

      // Update parent if exists and has data
      if (student.parent_id && (parentData.first_name || parentData.last_name || parentData.email || parentData.phone)) {
        try {
          await DataService.updateParent(student.parent_id, parentData);
        } catch (parentError: any) {
          // Handle parent-specific errors
          if (parentError.message.includes('already associated with another parent')) {
            setError(`Parent email conflict: ${parentError.message}`);
            return;
          }
          throw parentError;
        }
      }

      // Update course enrollments and sync fee records
      try {
        // Get current enrolled courses before making changes
        const { data: currentEnrollments } = await supabase
          .from('student_courses')
          .select('course_id, courses(id, name, price)')
          .eq('student_id', student.id)
          .eq('status', 'active');

        const currentCourseIds = currentEnrollments?.map(e => e.course_id) || [];
        const newCourseIds = selectedCourses.map(c => c.id);

        // Find courses that are being removed
        const removedCourseIds = currentCourseIds.filter(id => !newCourseIds.includes(id));

        // Find courses that are being added
        const addedCourseIds = newCourseIds.filter(id => !currentCourseIds.includes(id));

        console.log('🔄 Course changes:', {
          current: currentCourseIds,
          new: newCourseIds,
          removed: removedCourseIds,
          added: addedCourseIds
        });

        // First, remove all existing enrollments
        await supabase
          .from('student_courses')
          .delete()
          .eq('student_id', student.id);

        // Then add new enrollments
        for (const course of selectedCourses) {
          await supabase
            .from('student_courses')
            .insert([{
              student_id: student.id,
              course_id: course.id,
              enrollment_date: formData.enrollment_date,
              status: 'active'
            }]);
        }

        // Sync fee records with course changes
        await syncFeeRecordsWithCourses(student.id, removedCourseIds, addedCourseIds, selectedCourses);

      } catch (courseError: any) {
        console.warn('Error updating course enrollments:', courseError);
        // Don't fail the entire update for course enrollment issues
      }

      onStudentUpdated();
      onClose();

    } catch (error: any) {
      console.error('Error updating student:', error);

      // Provide specific error messages
      if (error.code === '23505') {
        if (error.message.includes('students_email_key')) {
          setError('This email is already associated with another student');
        } else if (error.message.includes('parents_email_key')) {
          setError('This parent email is already associated with another parent');
        } else {
          setError('A record with this information already exists');
        }
      } else {
        setError(error.message || 'Failed to update student');
      }
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
            <h2 className="text-2xl font-bold text-secondary-800">Edit Student</h2>
            <p className="text-secondary-600 mt-1">Update student profile information</p>
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
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Grade Level
                    </label>
                    <input
                      type="text"
                      name="grade_level"
                      value={formData.grade_level}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="graduated">Graduated</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Enrollment Date
                  </label>
                  <input
                    type="date"
                    name="enrollment_date"
                    value={formData.enrollment_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-secondary-800 flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Parent/Guardian Information</span>
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={parentData.first_name}
                      onChange={handleParentInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={parentData.last_name}
                      onChange={handleParentInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={parentData.email}
                    onChange={handleParentInputChange}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={parentData.phone}
                      onChange={handleParentInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
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
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={parentData.address}
                    onChange={handleParentInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-3">
              Select Courses (Multiple courses allowed)
            </label>
            <div className="space-y-3 max-h-48 overflow-y-auto border border-secondary-300 rounded-xl p-4">
              {courses.map((course) => {
                const isSelected = selectedCourses.some(c => c.id === course.id);
                return (
                  <div key={course.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={`edit-course-${course.id}`}
                      checked={isSelected}
                      onChange={() => handleCourseToggle(course.id)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <label htmlFor={`edit-course-${course.id}`} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-secondary-800">{course.name}</p>
                          <p className="text-xs text-secondary-600">{course.description}</p>
                        </div>
                        <span className="font-semibold text-primary-600">QAR{course.price.toLocaleString()}</span>
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
                      <span className="font-semibold text-primary-800">QAR{course.price.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-primary-300 pt-2 mt-2">
                    <div className="flex justify-between items-center font-bold text-primary-900">
                      <span>Total Course Fees:</span>
                      <span>QAR{getTotalFees().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Subjects */}
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

          {/* Submit Buttons */}
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
              disabled={loading}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStudentModal;
