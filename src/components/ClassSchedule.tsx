import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Users, MapPin, Plus, Filter, Search } from 'lucide-react';
import { DataService } from '../services/dataService';
import type { Class } from '../lib/supabase';
import AddClassModal from './modals/AddClassModal';

const ClassSchedule: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

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
                    <button className="bg-success-100 hover:bg-success-200 text-success-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                      View Students
                    </button>
                    <button className="bg-primary-100 hover:bg-primary-200 text-primary-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                      Edit
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
    </div>
  );
};

export default ClassSchedule;