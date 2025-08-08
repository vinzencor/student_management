import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, BookOpen, Trophy, Plus, Search, Filter } from 'lucide-react';
import { DataService } from '../services/dataService';
import type { Student } from '../lib/supabase';
import AddStudentModal from './modals/AddStudentModal';

const StudentProfile: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

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
              <button className="flex-1 bg-primary-100 hover:bg-primary-200 text-primary-700 py-2 rounded-lg transition-colors text-sm font-medium">
                View Profile
              </button>
              <button className="flex-1 bg-success-100 hover:bg-success-200 text-success-700 py-2 rounded-lg transition-colors text-sm font-medium">
                Message
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
        onStudentAdded={fetchStudents}
      />
    </div>
  );
};

export default StudentProfile;