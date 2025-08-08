import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Users, MapPin, BookOpen, AlertCircle, User, Search } from 'lucide-react';
import { DataService } from '../../services/dataService';
import type { Class, Teacher, Student } from '../../lib/supabase';

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassAdded: () => void;
}

const AddClassModal: React.FC<AddClassModalProps> = ({ isOpen, onClose, onClassAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    grade_level: '',
    teacher_id: '',
    room: '',
    start_time: '',
    end_time: '',
    day_of_week: '',
    max_students: 30,
    fee_per_month: 0,
    description: ''
  });

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 
    'History', 'Geography', 'Computer Science', 'Economics', 'Art',
    'Music', 'Physical Education', 'Literature', 'Psychology', 'Philosophy'
  ];

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchTeachersAndStudents();
    }
  }, [isOpen]);

  const fetchTeachersAndStudents = async () => {
    try {
      const [teachersData, studentsData] = await Promise.all([
        DataService.getTeachers(),
        DataService.getStudents()
      ]);
      setTeachers(teachersData || []);
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'max_students' ? parseInt(value) || 0 : value 
    }));
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    const searchLower = studentSearchTerm.toLowerCase();
    return (
      student.first_name.toLowerCase().includes(searchLower) ||
      student.last_name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      (student.grade_level && student.grade_level.toLowerCase().includes(searchLower))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create the class
      const classData = {
        ...formData,
        teacher_id: formData.teacher_id || null
      };

      const newClass = await DataService.createClass(classData);

      // Enroll selected students
      if (selectedStudents.length > 0) {
        await Promise.all(
          selectedStudents.map(studentId =>
            DataService.enrollStudentInClass(studentId, newClass.id)
          )
        );
      }

      onClassAdded();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        subject: '',
        grade_level: '',
        teacher_id: '',
        room: '',
        start_time: '',
        end_time: '',
        day_of_week: '',
        max_students: 30,
        fee_per_month: 0,
        description: ''
      });
      setSelectedStudents([]);
    } catch (error: any) {
      setError(error.message || 'Failed to create class');
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
            <h2 className="text-2xl font-bold text-secondary-800">Add New Class</h2>
            <p className="text-secondary-600 mt-1">Create a new class schedule</p>
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
            {/* Class Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-secondary-800 flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Class Information</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="e.g., Advanced Mathematics 10th"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Subject *
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Grade Level *
                  </label>
                  <input
                    type="text"
                    name="grade_level"
                    value={formData.grade_level}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="e.g., 10th, 11th, 12th"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Fee Per Month (₹) *
                  </label>
                  <input
                    type="number"
                    name="fee_per_month"
                    value={formData.fee_per_month}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="3000"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Teacher
                  </label>
                  <select
                    name="teacher_id"
                    value={formData.teacher_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Room *
                  </label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                    <input
                      type="text"
                      name="room"
                      value={formData.room}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Room 101"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Day of Week *
                  </label>
                  <select
                    name="day_of_week"
                    value={formData.day_of_week}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                  >
                    <option value="">Select Day</option>
                    {daysOfWeek.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Start Time *
                    </label>
                    <div className="relative">
                      <Clock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                      <input
                        type="time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      End Time *
                    </label>
                    <div className="relative">
                      <Clock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                      <input
                        type="time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Maximum Students
                  </label>
                  <div className="relative">
                    <Users className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                    <input
                      type="number"
                      name="max_students"
                      value={formData.max_students}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                      className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                    placeholder="Class description or additional notes..."
                  />
                </div>
              </div>
            </div>

            {/* Student Enrollment */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-secondary-800 flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Enroll Students ({selectedStudents.length})</span>
              </h3>

              {/* Student Search */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search students by name, email, or grade..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>

              <div className="border border-secondary-200 rounded-xl p-4 max-h-96 overflow-y-auto">
                {filteredStudents.length > 0 ? (
                  <div className="space-y-2">
                    {filteredStudents.map(student => (
                      <label key={student.id} className="flex items-center space-x-3 p-2 hover:bg-secondary-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleStudentToggle(student.id)}
                          className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                        />
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-secondary-800">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-xs text-secondary-600">{student.grade_level}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-secondary-400 mx-auto mb-2" />
                    <p className="text-secondary-500 text-sm">
                      {studentSearchTerm ? 'No students found matching your search' : 'No students available'}
                    </p>
                    {studentSearchTerm && (
                      <button
                        onClick={() => setStudentSearchTerm('')}
                        className="text-primary-600 hover:text-primary-700 text-sm mt-2 underline"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Students Summary */}
              {selectedStudents.length > 0 && (
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                  <p className="text-sm text-primary-800 font-medium">
                    {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected for enrollment
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedStudents.map(studentId => {
                      const student = students.find(s => s.id === studentId);
                      return student ? (
                        <span key={studentId} className="bg-primary-100 text-primary-800 px-2 py-1 rounded-lg text-xs">
                          {student.first_name} {student.last_name}
                        </span>
                      ) : null;
                    })}
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
              disabled={loading}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClassModal;
