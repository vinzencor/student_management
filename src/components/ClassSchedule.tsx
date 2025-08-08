import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Users, MapPin, Plus, Filter, Search, Edit, Eye, X, Save, UserPlus, Trash2 } from 'lucide-react';
import { DataService } from '../services/dataService';
import type { Class } from '../lib/supabase';
import AddClassModal from './modals/AddClassModal';

const ClassSchedule: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewStudentsModal, setShowViewStudentsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [editFormData, setEditFormData] = useState<any>({});
  const [modalLoading, setModalLoading] = useState(false);
  const [showAddStudentSection, setShowAddStudentSection] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudentsToAdd, setSelectedStudentsToAdd] = useState<string[]>([]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await DataService.getClasses();
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudents = async (classItem: Class) => {
    try {
      setModalLoading(true);
      setSelectedClass(classItem);
      const students = await DataService.getClassEnrollments(classItem.id);
      setEnrolledStudents(students);
      setShowViewStudentsModal(true);

      // Load available students for adding
      await loadAvailableStudents(classItem.id);
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const loadAvailableStudents = async (classId: string) => {
    try {
      const allStudents = await DataService.getStudents();
      const enrollments = await DataService.getClassEnrollments(classId);
      const enrolledStudentIds = enrollments.map(e => e.student_id);

      // Filter out already enrolled students
      const available = allStudents.filter(student =>
        !enrolledStudentIds.includes(student.id) && student.status === 'active'
      );

      setAvailableStudents(available);
    } catch (error) {
      console.error('Error loading available students:', error);
    }
  };

  const handleAddStudents = async () => {
    if (!selectedClass || selectedStudentsToAdd.length === 0) return;

    try {
      setModalLoading(true);

      // Enroll selected students
      await Promise.all(
        selectedStudentsToAdd.map(studentId =>
          DataService.enrollStudentInClass(studentId, selectedClass.id)
        )
      );

      // Refresh enrolled students list
      const updatedStudents = await DataService.getClassEnrollments(selectedClass.id);
      setEnrolledStudents(updatedStudents);

      // Refresh available students
      await loadAvailableStudents(selectedClass.id);

      // Reset selection
      setSelectedStudentsToAdd([]);
      setShowAddStudentSection(false);
      setStudentSearchTerm('');

    } catch (error) {
      console.error('Error adding students:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleRemoveStudent = async (enrollmentId: string) => {
    if (!selectedClass) return;

    try {
      setModalLoading(true);

      await DataService.removeStudentFromClass(enrollmentId);

      // Refresh enrolled students list
      const updatedStudents = await DataService.getClassEnrollments(selectedClass.id);
      setEnrolledStudents(updatedStudents);

      // Refresh available students
      await loadAvailableStudents(selectedClass.id);

    } catch (error) {
      console.error('Error removing student:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentsToAdd(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleEditClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setEditFormData({
      subject: classItem.subject,
      room: classItem.room,
      day_of_week: classItem.day_of_week,
      start_time: classItem.start_time,
      end_time: classItem.end_time,
      max_students: classItem.max_students,
      grade_level: classItem.grade_level,
      fee_per_month: classItem.fee_per_month,
      description: classItem.description || '',
      teacher_id: classItem.teacher_id || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    try {
      setModalLoading(true);
      await DataService.updateClass(selectedClass.id, editFormData);
      await fetchClasses();
      setShowEditModal(false);
      setSelectedClass(null);
    } catch (error) {
      console.error('Error updating class:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch =
      classItem.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.room.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDay = dayFilter === 'all' || classItem.day_of_week === dayFilter;

    return matchesSearch && matchesDay;
  });

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="w-48 h-8 bg-secondary-200 rounded animate-pulse"></div>
          <div className="w-32 h-10 bg-secondary-200 rounded animate-pulse"></div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-full h-20 bg-secondary-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800">Class Schedule</h1>
          <p className="text-secondary-600 mt-1">Manage class schedules and student enrollment</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-soft hover:shadow-medium"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add New Class</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-secondary-200 p-4 shadow-soft">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Search classes by subject or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-secondary-500" />
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
              <option value="all">All Days</option>
              {daysOfWeek.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Classes List */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-soft">
        <div className="p-6 border-b border-secondary-200">
          <h2 className="text-xl font-bold text-secondary-800">Class Schedule</h2>
          <p className="text-secondary-600 mt-1">
            {filteredClasses.length} {filteredClasses.length === 1 ? 'class' : 'classes'} found
          </p>
        </div>

        <div className="p-6">
          {filteredClasses.length > 0 ? (
            <div className="space-y-4">
              {filteredClasses.map((classItem) => (
                <div key={classItem.id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-16 bg-primary-500 rounded-full"></div>
                    <div>
                      <h3 className="font-semibold text-secondary-800">{classItem.subject}</h3>
                      <p className="text-sm text-secondary-600">{classItem.day_of_week}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center text-xs text-secondary-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
                        </div>
                        <div className="flex items-center text-xs text-secondary-500">
                          <Users className="w-3 h-3 mr-1" />
                          {classItem.max_students} max students
                        </div>
                        <div className="flex items-center text-xs text-secondary-500">
                          <MapPin className="w-3 h-3 mr-1" />
                          {classItem.room}
                        </div>
                      </div>
                      {classItem.description && (
                        <p className="text-xs text-secondary-500 mt-1">{classItem.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewStudents(classItem)}
                      className="flex items-center space-x-1 bg-success-100 hover:bg-success-200 text-success-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Students</span>
                    </button>
                    <button
                      onClick={() => handleEditClass(classItem)}
                      className="flex items-center space-x-1 bg-primary-100 hover:bg-primary-200 text-primary-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-600 mb-2">No classes found</h3>
              <p className="text-secondary-500">Try adjusting your search or filters, or add a new class</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Class Modal */}
      <AddClassModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onClassAdded={fetchClasses}
      />

      {/* View Students Modal */}
      {showViewStudentsModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <div>
                <h2 className="text-2xl font-bold text-secondary-800">Class Details & Students</h2>
                <p className="text-secondary-600 mt-1">{selectedClass.subject} - {selectedClass.day_of_week}</p>
              </div>
              <button
                onClick={() => setShowViewStudentsModal(false)}
                className="p-2 hover:bg-secondary-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-secondary-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Class Information */}
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-primary-800 mb-4">Class Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-primary-600 font-medium">Subject</p>
                    <p className="text-primary-800 font-semibold">{selectedClass.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-primary-600 font-medium">Room</p>
                    <p className="text-primary-800 font-semibold">{selectedClass.room}</p>
                  </div>
                  <div>
                    <p className="text-sm text-primary-600 font-medium">Day</p>
                    <p className="text-primary-800 font-semibold">{selectedClass.day_of_week}</p>
                  </div>
                  <div>
                    <p className="text-sm text-primary-600 font-medium">Time</p>
                    <p className="text-primary-800 font-semibold">
                      {formatTime(selectedClass.start_time)} - {formatTime(selectedClass.end_time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-primary-600 font-medium">Max Students</p>
                    <p className="text-primary-800 font-semibold">{selectedClass.max_students}</p>
                  </div>
                  <div>
                    <p className="text-sm text-primary-600 font-medium">Fee/Month</p>
                    <p className="text-primary-800 font-semibold">₹{selectedClass.fee_per_month}</p>
                  </div>
                </div>
                {selectedClass.description && (
                  <div className="mt-4">
                    <p className="text-sm text-primary-600 font-medium">Description</p>
                    <p className="text-primary-800">{selectedClass.description}</p>
                  </div>
                )}
              </div>

              {/* Enrolled Students */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-secondary-800">
                    Enrolled Students ({enrolledStudents.length}/{selectedClass.max_students})
                  </h3>
                  <button
                    onClick={() => setShowAddStudentSection(!showAddStudentSection)}
                    className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Students</span>
                  </button>
                </div>

                {/* Add Students Section */}
                {showAddStudentSection && (
                  <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
                    <h4 className="font-semibold text-primary-800 mb-3">Add New Students</h4>

                    {/* Search Available Students */}
                    <div className="relative mb-4">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                      <input
                        type="text"
                        placeholder="Search available students..."
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      />
                    </div>

                    {/* Available Students List */}
                    <div className="max-h-48 overflow-y-auto border border-secondary-200 rounded-xl p-2 bg-white">
                      {availableStudents
                        .filter(student => {
                          const searchLower = studentSearchTerm.toLowerCase();
                          return (
                            student.first_name.toLowerCase().includes(searchLower) ||
                            student.last_name.toLowerCase().includes(searchLower) ||
                            student.email.toLowerCase().includes(searchLower) ||
                            (student.grade_level && student.grade_level.toLowerCase().includes(searchLower))
                          );
                        })
                        .map(student => (
                          <label key={student.id} className="flex items-center space-x-3 p-2 hover:bg-secondary-50 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedStudentsToAdd.includes(student.id)}
                              onChange={() => toggleStudentSelection(student.id)}
                              className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                            />
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-xs">
                                  {student.first_name[0]}{student.last_name[0]}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-secondary-800">
                                  {student.first_name} {student.last_name}
                                </p>
                                <p className="text-xs text-secondary-600">{student.email}</p>
                              </div>
                            </div>
                          </label>
                        ))}
                    </div>

                    {/* Add Students Actions */}
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-sm text-primary-700">
                        {selectedStudentsToAdd.length} student{selectedStudentsToAdd.length !== 1 ? 's' : ''} selected
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setShowAddStudentSection(false);
                            setSelectedStudentsToAdd([]);
                            setStudentSearchTerm('');
                          }}
                          className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-xl hover:bg-secondary-50 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddStudents}
                          disabled={selectedStudentsToAdd.length === 0 || modalLoading}
                          className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add {selectedStudentsToAdd.length} Student{selectedStudentsToAdd.length !== 1 ? 's' : ''}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {modalLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : enrolledStudents.length > 0 ? (
                  <div className="grid gap-4">
                    {enrolledStudents.map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {enrollment.student?.first_name?.[0]}{enrollment.student?.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-secondary-800">
                              {enrollment.student?.first_name} {enrollment.student?.last_name}
                            </p>
                            <p className="text-sm text-secondary-600">{enrollment.student?.email}</p>
                            <p className="text-xs text-secondary-500">Grade: {enrollment.student?.grade_level}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-secondary-600">Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              enrollment.status === 'active'
                                ? 'bg-success-100 text-success-800'
                                : 'bg-warning-100 text-warning-800'
                            }`}>
                              {enrollment.status}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveStudent(enrollment.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove student from class"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-secondary-600 mb-2">No students enrolled</h3>
                    <p className="text-secondary-500">This class doesn't have any enrolled students yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <h2 className="text-2xl font-bold text-secondary-800">Edit Class</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-secondary-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-secondary-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateClass} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={editFormData.subject || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Room *</label>
                    <input
                      type="text"
                      name="room"
                      value={editFormData.room || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Day *</label>
                    <select
                      name="day_of_week"
                      value={editFormData.day_of_week || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    >
                      <option value="">Select Day</option>
                      {daysOfWeek.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Start Time *</label>
                    <input
                      type="time"
                      name="start_time"
                      value={editFormData.start_time || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">End Time *</label>
                    <input
                      type="time"
                      name="end_time"
                      value={editFormData.end_time || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Max Students *</label>
                    <input
                      type="number"
                      name="max_students"
                      value={editFormData.max_students || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Grade Level *</label>
                    <input
                      type="text"
                      name="grade_level"
                      value={editFormData.grade_level || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Fee/Month (₹) *</label>
                    <input
                      type="number"
                      name="fee_per_month"
                      value={editFormData.fee_per_month || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={editFormData.description || ''}
                    onChange={handleEditInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Optional class description..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-secondary-200 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 border border-secondary-300 text-secondary-700 rounded-xl hover:bg-secondary-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{modalLoading ? 'Updating...' : 'Update Class'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassSchedule;