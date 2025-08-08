import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Course {
  id?: string;
  name: string;
  description: string;
  price: number;
  duration_months?: number;
  status: 'active' | 'inactive';
}

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCourse = async () => {
    if (!editing) return;
    
    try {
      setLoading(true);
      const payload = {
        name: editing.name,
        description: editing.description,
        price: editing.price,
        duration_months: editing.duration_months || 12,
        status: editing.status
      };

      let result;
      if (editing.id) {
        result = await supabase
          .from('courses')
          .update(payload)
          .eq('id', editing.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('courses')
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      
      setEditing(null);
      await loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-4 lg:p-6 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-secondary-800">Course Management</h2>
          <p className="text-sm text-secondary-600 mt-1">Manage courses and their pricing</p>
        </div>
        <button
          onClick={() => setEditing({ name: '', description: '', price: 0, status: 'active' })}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Add New Course
        </button>
      </div>

      {loading && !editing ? (
        <div className="text-center py-8">Loading courses...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left border-b border-secondary-200">
                <th className="py-3 pr-4 font-medium text-secondary-700">Course Name</th>
                <th className="py-3 pr-4 font-medium text-secondary-700">Description</th>
                <th className="py-3 pr-4 font-medium text-secondary-700">Price (₹)</th>
                <th className="py-3 pr-4 font-medium text-secondary-700">Duration</th>
                <th className="py-3 pr-4 font-medium text-secondary-700">Status</th>
                <th className="py-3 pr-4 font-medium text-secondary-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                  <td className="py-3 pr-4 font-medium">{course.name}</td>
                  <td className="py-3 pr-4 text-secondary-600">{course.description}</td>
                  <td className="py-3 pr-4">₹ {course.price.toLocaleString()}</td>
                  <td className="py-3 pr-4">{course.duration_months} months</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      course.status === 'active' 
                        ? 'bg-success-100 text-success-800' 
                        : 'bg-secondary-100 text-secondary-800'
                    }`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 space-x-2">
                    <button
                      onClick={() => setEditing(course)}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCourse(course.id!)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Course Edit/Create Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editing.id ? 'Edit Course' : 'Add New Course'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={editing.name}
                  onChange={(e) => setEditing({...editing, name: e.target.value})}
                  placeholder="e.g., Mathematics Foundation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Course Description</label>
                <textarea
                  rows={3}
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={editing.description}
                  onChange={(e) => setEditing({...editing, description: e.target.value})}
                  placeholder="Brief description of the course content and objectives"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Course Price (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={editing.price}
                  onChange={(e) => setEditing({...editing, price: Number(e.target.value)})}
                  placeholder="15000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Duration (Months)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={editing.duration_months || 12}
                  onChange={(e) => setEditing({...editing, duration_months: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
                <select
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={editing.status}
                  onChange={(e) => setEditing({...editing, status: e.target.value as 'active' | 'inactive'})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50"
              >
                Cancel
              </button>
              <button
                onClick={saveCourse}
                disabled={loading || !editing.name || editing.price <= 0}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : editing.id ? 'Update Course' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
