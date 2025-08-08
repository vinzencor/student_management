import React, { useEffect, useState } from 'react';
import { Calendar, Search, Users, UserCheck, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { DataService } from '../services/dataService';
import { supabase } from '../lib/supabase';

type AttendanceStatus = 'P' | 'A' | 'H'; // Present, Absent, Holiday

interface AttendanceRecord {
  id?: string;
  date: string;
  student_id?: string;
  staff_id?: string;
  status: AttendanceStatus;
  notes?: string;
}

const AttendanceManagement: React.FC = () => {
  const [view, setView] = useState<'students' | 'staff'>('students');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadData();
  }, [view, selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (view === 'students') {
        // Load students
        const { data: studentsData } = await supabase
          .from('students')
          .select('*, course:courses(name)')
          .eq('status', 'active')
          .order('first_name');
        setStudents(studentsData || []);

        // Load student attendance for selected date
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('*')
          .eq('date', selectedDate)
          .not('student_id', 'is', null);

        // Create attendance records for all students (default to Present)
        const attendanceMap = new Map();
        (attendanceData || []).forEach(record => {
          attendanceMap.set(record.student_id, record);
        });

        const allAttendance = (studentsData || []).map(student => {
          const existing = attendanceMap.get(student.id);
          return existing || {
            date: selectedDate,
            student_id: student.id,
            status: 'P' as AttendanceStatus,
            notes: ''
          };
        });

        setAttendance(allAttendance);
      } else {
        // Load staff
        const { data: staffData } = await supabase
          .from('staff')
          .select('*')
          .eq('status', 'active')
          .order('first_name');
        setStaff(staffData || []);

        // Load staff attendance for selected date
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('*')
          .eq('date', selectedDate)
          .not('staff_id', 'is', null);

        // Create attendance records for all staff (default to Present)
        const attendanceMap = new Map();
        (attendanceData || []).forEach(record => {
          attendanceMap.set(record.staff_id, record);
        });

        const allAttendance = (staffData || []).map(staffMember => {
          const existing = attendanceMap.get(staffMember.id);
          return existing || {
            date: selectedDate,
            staff_id: staffMember.id,
            status: 'P' as AttendanceStatus,
            notes: ''
          };
        });

        setAttendance(allAttendance);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = (index: number, field: keyof AttendanceRecord, value: any) => {
    const updated = [...attendance];
    updated[index] = { ...updated[index], [field]: value };
    setAttendance(updated);
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);

      for (const record of attendance) {
        if (record.id) {
          // Update existing record
          await supabase
            .from('attendance')
            .update({
              status: record.status,
              notes: record.notes || null
            })
            .eq('id', record.id);
        } else {
          // Insert new record
          await supabase
            .from('attendance')
            .insert({
              date: record.date,
              student_id: record.student_id || null,
              staff_id: record.staff_id || null,
              status: record.status,
              notes: record.notes || null
            });
        }
      }

      alert('Attendance saved successfully!');
      await loadData(); // Reload to get updated IDs
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'P': return 'bg-success-100 text-success-800 border-success-200';
      case 'A': return 'bg-danger-100 text-danger-800 border-danger-200';
      case 'H': return 'bg-warning-100 text-warning-800 border-warning-200';
      default: return 'bg-secondary-100 text-secondary-800 border-secondary-200';
    }
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case 'P': return 'Present';
      case 'A': return 'Absent';
      case 'H': return 'Holiday';
      default: return 'Unknown';
    }
  };

  const filteredData = view === 'students'
    ? students.filter(student =>
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.course?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : staff.filter(staffMember =>
        `${staffMember.first_name} ${staffMember.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staffMember.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isSelectedDate = (date: Date) => {
    return date.toISOString().split('T')[0] === selectedDate;
  };

  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-4 lg:p-6 shadow-soft">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Section */}
        <div className="lg:w-1/3">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-secondary-800 mb-2">Select Date</h3>
            <div className="bg-secondary-50 rounded-lg p-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-1 hover:bg-secondary-200 rounded"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h4 className="font-semibold">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h4>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-1 hover:bg-secondary-200 rounded"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 font-medium text-secondary-600">{day}</div>
                ))}
                {generateCalendarDays().map((date, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date.toISOString().split('T')[0])}
                    className={`p-2 rounded hover:bg-secondary-200 transition-colors ${
                      isSelectedDate(date)
                        ? 'bg-primary-600 text-white'
                        : isToday(date)
                        ? 'bg-primary-100 text-primary-800'
                        : isCurrentMonth(date)
                        ? 'text-secondary-800'
                        : 'text-secondary-400'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Section */}
        <div className="lg:w-2/3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-secondary-800">
                Attendance - {new Date(selectedDate).toLocaleDateString()}
              </h2>
              <p className="text-sm text-secondary-600 mt-1">Mark attendance for {view}</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={view}
                onChange={(e) => setView(e.target.value as any)}
                className="border border-secondary-300 rounded-lg px-3 py-2"
              >
                <option value="students">Student Attendance</option>
                <option value="staff">Staff Attendance</option>
              </select>
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                placeholder={`Search ${view}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left border-b border-secondary-200">
                    <th className="py-3 pr-4 font-medium text-secondary-700">
                      {view === 'students' ? 'Student' : 'Staff Member'}
                    </th>
                    <th className="py-3 pr-4 font-medium text-secondary-700">
                      {view === 'students' ? 'Course' : 'Role'}
                    </th>
                    <th className="py-3 pr-4 font-medium text-secondary-700">Status</th>
                    <th className="py-3 pr-4 font-medium text-secondary-700">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((person, index) => {
                    const attendanceIndex = attendance.findIndex(a =>
                      view === 'students' ? a.student_id === person.id : a.staff_id === person.id
                    );
                    const record = attendance[attendanceIndex];

                    return (
                      <tr key={person.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                        <td className="py-3 pr-4">
                          <div className="font-medium text-secondary-800">
                            {person.first_name} {person.last_name}
                          </div>
                          <div className="text-sm text-secondary-600">{person.email}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="text-secondary-700">
                            {view === 'students' ? person.course?.name || 'No Course' : person.role || 'Staff'}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            value={record?.status || 'P'}
                            onChange={(e) => updateAttendance(attendanceIndex, 'status', e.target.value as AttendanceStatus)}
                            className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(record?.status || 'P')}`}
                          >
                            <option value="P">P - Present</option>
                            <option value="A">A - Absent</option>
                            <option value="H">H - Holiday</option>
                          </select>
                        </td>
                        <td className="py-3 pr-4">
                          <input
                            type="text"
                            value={record?.notes || ''}
                            onChange={(e) => updateAttendance(attendanceIndex, 'notes', e.target.value)}
                            placeholder="Add notes..."
                            className="w-full px-2 py-1 border border-secondary-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;

