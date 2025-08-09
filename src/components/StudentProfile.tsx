import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, BookOpen, Trophy, Plus, Search, Filter, Eye, X, Edit } from 'lucide-react';
import { DataService } from '../services/dataService';
import { supabase } from '../lib/supabase';
import type { Student } from '../lib/supabase';
import AddStudentModal from './modals/AddStudentModal';
import EditStudentModal from './modals/EditStudentModal';

interface StudentProfileProps {
  onNavigateToFeeReceipts?: (studentId: string) => void;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ onNavigateToFeeReceipts }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentCourses, setStudentCourses] = useState<any[]>([]);
  const [studentFees, setStudentFees] = useState<any[]>([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await DataService.getStudents();
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = async (student: Student) => {
    try {
      setSelectedStudent(student);

      // Load student's enrolled courses
      const { data: coursesData } = await supabase
        .from('student_courses')
        .select('*, courses(*)')
        .eq('student_id', student.id)
        .eq('status', 'active');

      setStudentCourses(coursesData || []);

      // Load student's fee records
      const { data: feesData } = await supabase
        .from('fees')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      setStudentFees(feesData || []);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error loading student details:', error);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.phone && student.phone.includes(searchTerm));

    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success-100 text-success-700 border-success-200';
      case 'inactive': return 'bg-warning-100 text-warning-700 border-warning-200';
      case 'graduated': return 'bg-primary-100 text-primary-700 border-primary-200';
      default: return 'bg-secondary-100 text-secondary-700 border-secondary-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="w-48 h-8 bg-secondary-200 rounded animate-pulse"></div>
          <div className="w-32 h-10 bg-secondary-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-secondary-200 animate-pulse">
              <div className="w-full h-32 bg-secondary-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800">Student Management</h1>
          <p className="text-secondary-600 mt-1">Manage student profiles and academic records</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-soft hover:shadow-medium"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add New Student</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-secondary-200 p-4 shadow-soft">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Search students by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-secondary-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <div key={student.id} className="bg-white rounded-2xl p-6 shadow-soft border border-secondary-200 hover:shadow-medium transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-soft">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-secondary-800">{student.first_name} {student.last_name}</h3>
                <p className="text-secondary-600 text-sm">{student.grade_level}</p>
                <div className="flex items-center mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusColor(student.status)}`}>
                    {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {student.email && (
                <div className="flex items-center text-sm text-secondary-600">
                  <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{student.email}</span>
                </div>
              )}
              {student.phone && (
                <div className="flex items-center text-sm text-secondary-600">
                  <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{student.phone}</span>
                </div>
              )}
              <div className="flex items-center text-sm text-secondary-600">
                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>Enrolled: {new Date(student.enrollment_date).toLocaleDateString()}</span>
              </div>
              {student.subjects && student.subjects.length > 0 && (
                <div className="flex items-start text-sm text-secondary-600">
                  <BookOpen className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {student.subjects.slice(0, 3).map((subject, index) => (
                      <span key={index} className="bg-secondary-100 text-secondary-700 px-2 py-0.5 rounded text-xs">
                        {subject}
                      </span>
                    ))}
                    {student.subjects.length > 3 && (
                      <span className="text-secondary-500 text-xs">+{student.subjects.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleViewStudent(student)}
                className="flex-1 bg-primary-100 hover:bg-primary-200 text-primary-700 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
              <button
                onClick={() => {
                  setSelectedStudent(student);
                  setShowEditModal(true);
                }}
                className="flex-1 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-1"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-600 mb-2">No students found</h3>
          <p className="text-secondary-500">Try adjusting your search or filters, or add a new student</p>
        </div>
      )}

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onStudentAdded={(studentId, totalFees) => {
          fetchStudents();
          if (studentId && onNavigateToFeeReceipts) {
            // Show success message and redirect to Fee Receipts
            alert(`Student created successfully! Please go to Fee Receipts section to set up fees and payments for the selected courses (Total: ₹${totalFees?.toLocaleString()}).`);
            onNavigateToFeeReceipts(studentId);
          }
        }}
      />

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <EditStudentModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          onStudentUpdated={() => {
            fetchStudents();
            setShowEditModal(false);
            setSelectedStudent(null);
          }}
        />
      )}

      {/* View Student Modal */}
      {showViewModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <div>
                <h2 className="text-2xl font-bold text-secondary-800">Student Details</h2>
                <p className="text-secondary-600 mt-1">{selectedStudent.first_name} {selectedStudent.last_name}</p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-secondary-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-secondary-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-secondary-800">Personal Information</h3>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-secondary-600" />
                      <div>
                        <p className="text-sm text-secondary-600">Full Name</p>
                        <p className="font-medium text-secondary-800">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-secondary-600" />
                      <div>
                        <p className="text-sm text-secondary-600">Date of Birth</p>
                        <p className="font-medium text-secondary-800">
                          {selectedStudent.date_of_birth ? new Date(selectedStudent.date_of_birth).toLocaleDateString() : 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-secondary-600" />
                      <div>
                        <p className="text-sm text-secondary-600">Email</p>
                        <p className="font-medium text-secondary-800">{selectedStudent.email || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-secondary-600" />
                      <div>
                        <p className="text-sm text-secondary-600">Phone</p>
                        <p className="font-medium text-secondary-800">{selectedStudent.phone || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-secondary-600" />
                      <div>
                        <p className="text-sm text-secondary-600">Address</p>
                        <p className="font-medium text-secondary-800">{selectedStudent.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-secondary-800">Academic Information</h3>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-secondary-600">Grade Level</p>
                      <p className="font-medium text-secondary-800">{selectedStudent.grade_level || 'Not assigned'}</p>
                    </div>

                    <div>
                      <p className="text-sm text-secondary-600">Enrollment Date</p>
                      <p className="font-medium text-secondary-800">
                        {selectedStudent.enrollment_date ? new Date(selectedStudent.enrollment_date).toLocaleDateString() : 'Not provided'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-secondary-600">Status</p>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        selectedStudent.status === 'active'
                          ? 'bg-success-100 text-success-800'
                          : 'bg-warning-100 text-warning-800'
                      }`}>
                        {selectedStudent.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enrolled Courses */}
              <div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Enrolled Courses</h3>
                {studentCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studentCourses.map((enrollment) => (
                      <div key={enrollment.id} className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                        <h4 className="font-semibold text-primary-800">{enrollment.courses.name}</h4>
                        <p className="text-sm text-primary-600">{enrollment.courses.description}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-secondary-600">
                            Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                          </span>
                          <span className="font-semibold text-primary-700">₹{enrollment.courses.price.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-secondary-50 rounded-lg">
                    <BookOpen className="w-8 h-8 text-secondary-400 mx-auto mb-2" />
                    <p className="text-secondary-600">No courses enrolled</p>
                  </div>
                )}
              </div>

              {/* Fee Information */}
              <div>
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Fee Information</h3>
                {studentFees.length > 0 ? (
                  <div className="space-y-3">
                    {studentFees.map((fee) => (
                      <div key={fee.id} className="bg-white border border-secondary-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-secondary-800">{fee.description}</p>
                            <p className="text-sm text-secondary-600">Due: {new Date(fee.due_date).toLocaleDateString()}</p>
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                              fee.status === 'paid'
                                ? 'bg-success-100 text-success-800'
                                : fee.status === 'partial'
                                ? 'bg-warning-100 text-warning-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {fee.status}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-secondary-800">₹{fee.amount.toLocaleString()}</p>
                            <p className="text-sm text-success-600">Paid: ₹{(fee.paid_amount || 0).toLocaleString()}</p>
                            <p className="text-sm text-red-600">Remaining: ₹{fee.remaining_amount.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-secondary-50 rounded-lg">
                    <Trophy className="w-8 h-8 text-secondary-400 mx-auto mb-2" />
                    <p className="text-secondary-600">No fee records found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;