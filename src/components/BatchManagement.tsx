import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Users, BookOpen, Edit, Trash2, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Batch {
  id: string;
  name: string;
  academic_year: string;
  course_id?: string;
  start_date: string;
  end_date: string;
  max_students: number;
  current_students: number;
  status: 'active' | 'inactive' | 'completed';
  description?: string;
  course_name?: string;
  course_price?: number;
}

interface Course {
  id: string;
  name: string;
  price: number;
}

const BatchManagement: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    academic_year: '',
    course_id: '',
    start_date: '',
    end_date: '',
    max_students: 30,
    description: ''
  });

  useEffect(() => {
    fetchBatches();
    fetchCourses();
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

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, price')
        .eq('status', 'active');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBatch) {
        const { error } = await supabase
          .from('batches')
          .update(formData)
          .eq('id', editingBatch.id);

        if (error) throw error;
        alert('Batch updated successfully!');
      } else {
        const { error } = await supabase
          .from('batches')
          .insert([formData]);

        if (error) throw error;
        alert('Batch created successfully!');
      }

      setShowAddModal(false);
      setEditingBatch(null);
      setFormData({
        name: '',
        academic_year: '',
        course_id: '',
        start_date: '',
        end_date: '',
        max_students: 30,
        description: ''
      });
      fetchBatches();
    } catch (error) {
      console.error('Error saving batch:', error);
      alert('Failed to save batch. Please try again.');
    }
  };

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      academic_year: batch.academic_year,
      course_id: batch.course_id || '',
      start_date: batch.start_date,
      end_date: batch.end_date,
      max_students: batch.max_students,
      description: batch.description || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (batchId: string) => {
    if (window.confirm('Are you sure you want to delete this batch? This will also remove all student assignments.')) {
      try {
        const { error } = await supabase
          .from('batches')
          .delete()
          .eq('id', batchId);

        if (error) throw error;
        alert('Batch deleted successfully!');
        fetchBatches();
      } catch (error) {
        console.error('Error deleting batch:', error);
        alert('Failed to delete batch. Please try again.');
      }
    }
  };

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.academic_year.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    const matchesYear = academicYearFilter === 'all' || batch.academic_year === academicYearFilter;
    
    return matchesSearch && matchesStatus && matchesYear;
  });

  const uniqueAcademicYears = [...new Set(batches.map(batch => batch.academic_year))];

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
          <h1 className="text-3xl font-bold text-secondary-800">Batch Management</h1>
          <p className="text-secondary-600 mt-1">Create and manage student batches</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-soft hover:shadow-medium"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Create New Batch</span>
        </button>
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

          <div className="relative">
            <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <select
              value={academicYearFilter}
              onChange={(e) => setAcademicYearFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-[160px]"
            >
              <option value="all">All Years</option>
              {uniqueAcademicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatches.map((batch) => (
          <div key={batch.id} className="bg-white rounded-xl border border-secondary-200 shadow-soft hover:shadow-medium transition-all duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-1">{batch.name}</h3>
                  <p className="text-sm text-secondary-600">{batch.academic_year}</p>
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
                  <span>{batch.current_students || 0} / {batch.max_students} students</span>
                </div>

                {batch.course_name && (
                  <div className="flex items-center text-sm text-secondary-600">
                    <BookOpen className="w-4 h-4 mr-2" />
                    <span>{batch.course_name}</span>
                  </div>
                )}
              </div>

              {batch.description && (
                <p className="text-sm text-secondary-600 mb-4 line-clamp-2">{batch.description}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(batch)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit Batch"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(batch.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="w-full bg-secondary-200 rounded-full h-2 ml-4">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((batch.current_students || 0) / batch.max_students * 100, 100)}%` }}
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
          <p className="text-secondary-500">Create your first batch to get started</p>
        </div>
      )}

      {/* Add/Edit Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-secondary-200">
              <h2 className="text-xl font-bold text-secondary-800">
                {editingBatch ? 'Edit Batch' : 'Create New Batch'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Batch Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., 6th Batch A"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    value={formData.academic_year}
                    onChange={(e) => setFormData(prev => ({ ...prev, academic_year: e.target.value }))}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., 2025-2026"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Course (Optional)
                </label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, course_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} - QAR{course.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Maximum Students
                </label>
                <input
                  type="number"
                  value={formData.max_students}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_students: parseInt(e.target.value) || 30 }))}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Optional description for this batch"
                />
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingBatch(null);
                    setFormData({
                      name: '',
                      academic_year: '',
                      course_id: '',
                      start_date: '',
                      end_date: '',
                      max_students: 30,
                      description: ''
                    });
                  }}
                  className="px-4 py-2 text-secondary-600 hover:text-secondary-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  <span>{editingBatch ? 'Update Batch' : 'Create Batch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchManagement;
