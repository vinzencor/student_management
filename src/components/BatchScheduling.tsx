import React, { useState, useEffect } from 'react';
import { Users, Calendar, Plus, Search, Filter, UserPlus, Trash2, BookOpen, Clock, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Batch {
  id: string;
  name: string;
  academic_year: string;
  course_name?: string;
  start_date: string;
  end_date: string;
  max_students: number;
  current_students: number;
  status: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  grade_level: string;
  course?: {
    name: string;
    price: number;
  };
  parent?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
}

const BatchScheduling: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [batchStudents, setBatchStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetchBatches();
    fetchAvailableStudents();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('batch_details')
        .select('*')
        .order('academic_year', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          course:courses(name, price),
          parent:parents(first_name, last_name, phone)
        `)
        .eq('status', 'active');

      if (error) throw error;
      setAvailableStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchBatchStudents = async (batchId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_batches')
        .select(`
          *,
          student:students(
            *,
            course:courses(name, price),
            parent:parents(first_name, last_name, phone)
          )
        `)
        .eq('batch_id', batchId)
        .eq('status', 'active');

      if (error) throw error;
      setBatchStudents((data || []).map(sb => sb.student).filter(Boolean));
    } catch (error) {
      console.error('Error fetching batch students:', error);
    }
  };

  const handleAssignStudents = async () => {
    if (!selectedBatch || selectedStudents.length === 0) return;

    try {
      const assignments = selectedStudents.map(studentId => ({
        student_id: studentId,
        batch_id: selectedBatch.id,
        status: 'active'
      }));

      const { error } = await supabase
        .from('student_batches')
        .insert(assignments);

      if (error) throw error;

      alert(`Successfully assigned ${selectedStudents.length} students to ${selectedBatch.name}`);
      setSelectedStudents([]);
      setShowAssignModal(false);
      fetchBatches();
      if (selectedBatch) {
        fetchBatchStudents(selectedBatch.id);
      }
    } catch (error) {
      console.error('Error assigning students:', error);
      alert('Failed to assign students. Please try again.');
    }
  };

  const handleRemoveStudent = async (studentId: string, batchId: string) => {
    if (window.confirm('Are you sure you want to remove this student from the batch?')) {
      try {
        const { error } = await supabase
          .from('student_batches')
          .delete()
          .eq('student_id', studentId)
          .eq('batch_id', batchId);

        if (error) throw error;

        alert('Student removed from batch successfully');
        fetchBatches();
        fetchBatchStudents(batchId);
      } catch (error) {
        console.error('Error removing student:', error);
        alert('Failed to remove student. Please try again.');
      }
    }
  };

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.academic_year.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getUnassignedStudents = () => {
    return availableStudents.filter(student => 
      !batchStudents.some(bs => bs.id === student.id)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success-100 text-success-800 border-success-200';
      case 'inactive': return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'completed': return 'bg-secondary-100 text-secondary-800 border-secondary-200';
      default: return 'bg-secondary-100 text-secondary-800 border-secondary-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800">Batch Scheduling</h1>
          <p className="text-secondary-600 mt-1">Assign students to batches and manage enrollments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-soft">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Search batches by name or academic year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBatches.map((batch) => (
          <div key={batch.id} className="bg-white rounded-xl border border-secondary-200 shadow-soft">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-1">{batch.name}</h3>
                  <p className="text-sm text-secondary-600">{batch.academic_year}</p>
                  {batch.course_name && (
                    <p className="text-sm text-primary-600 font-medium">{batch.course_name}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(batch.status)}`}>
                  {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-secondary-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{new Date(batch.start_date).toLocaleDateString()} - {new Date(batch.end_date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center text-sm text-secondary-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{batch.current_students} / {batch.max_students} students</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
                <button
                  onClick={() => {
                    setSelectedBatch(batch);
                    fetchBatchStudents(batch.id);
                    setShowAssignModal(true);
                  }}
                  className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Manage Students</span>
                </button>
                
                <div className="w-32 bg-secondary-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((batch.current_students / batch.max_students) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBatches.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-600 mb-2">No batches found</h3>
          <p className="text-secondary-500">Create batches in Batch Management to get started</p>
        </div>
      )}

      {/* Student Assignment Modal */}
      {showAssignModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-secondary-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-secondary-800">Manage Students - {selectedBatch.name}</h2>
                  <p className="text-secondary-600">{selectedBatch.academic_year}</p>
                </div>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedBatch(null);
                    setSelectedStudents([]);
                    setBatchStudents([]);
                  }}
                  className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-secondary-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Students */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">
                    Current Students ({batchStudents.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {batchStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                        <div>
                          <div className="font-medium text-secondary-800">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-sm text-secondary-600">
                            Grade {student.grade_level} • {student.course?.name}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(student.id, selectedBatch.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove from batch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {batchStudents.length === 0 && (
                      <div className="text-center py-8 text-secondary-500">
                        No students assigned to this batch yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Available Students */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">
                    Available Students ({getUnassignedStudents().length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getUnassignedStudents().map((student) => (
                      <div key={student.id} className="flex items-center space-x-3 p-3 bg-secondary-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents(prev => [...prev, student.id]);
                            } else {
                              setSelectedStudents(prev => prev.filter(id => id !== student.id));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-secondary-800">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-sm text-secondary-600">
                            Grade {student.grade_level} • {student.course?.name}
                          </div>
                        </div>
                      </div>
                    ))}
                    {getUnassignedStudents().length === 0 && (
                      <div className="text-center py-8 text-secondary-500">
                        All students are already assigned to batches
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedStudents.length > 0 && (
                <div className="mt-6 pt-6 border-t border-secondary-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600">
                      {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={handleAssignStudents}
                      className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Assign to Batch</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchScheduling;
