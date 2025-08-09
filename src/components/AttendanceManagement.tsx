import React, { useEffect, useState } from 'react';
import { Calendar, Search, Users, UserCheck, Save, ChevronLeft, ChevronRight, FileText, Download, Eye, X } from 'lucide-react';
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
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [batches, setBatches] = useState<string[]>([]);
  const [showIndividualReport, setShowIndividualReport] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [individualReportData, setIndividualReportData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [view, selectedDate, selectedBatch]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (view === 'students') {
        // Load students with batch information
        const { data: studentsData } = await supabase
          .from('students')
          .select('*, course:courses(name)')
          .eq('status', 'active')
          .order('grade_level, first_name');

        const students = studentsData || [];
        setStudents(students);

        // Extract unique batches/grade levels
        const uniqueBatches = [...new Set(students.map(s => s.grade_level).filter(Boolean))];
        setBatches(uniqueBatches);

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

  const handleViewIndividualReport = async (person: any) => {
    try {
      setLoading(true);
      setSelectedPerson(person);

      // Get attendance data for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const { data: reportData } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .eq(view === 'students' ? 'student_id' : 'staff_id', person.id)
        .order('date', { ascending: false });

      setIndividualReportData(reportData || []);
      setShowIndividualReport(true);
    } catch (error) {
      console.error('Error loading individual report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadAttendanceReport = async () => {
    try {
      setLoading(true);

      // Get date range for the report (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      // Get attendance data for the date range
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      // Get all working days in the range (excluding weekends)
      const workingDays = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday (0) and Saturday (6)
          workingDays.push(new Date(currentDate).toISOString().split('T')[0]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Process data for each person
      const reportData = filteredData.map((person, index) => {
        const personAttendance = attendanceData?.filter(a =>
          view === 'students' ? a.student_id === person.id : a.staff_id === person.id
        ) || [];

        const presentDays = personAttendance.filter(a => a.status === 'P').length;
        const absentDays = personAttendance.filter(a => a.status === 'A').length;
        const totalWorkingDays = workingDays.length;

        // Calculate late arrivals (for now, we'll use 0 as we don't have time tracking)
        const lateArrivals = 0;

        // Generate remarks based on attendance
        let remarks = '';
        const attendancePercentage = totalWorkingDays > 0 ? (presentDays / totalWorkingDays) * 100 : 0;
        if (attendancePercentage >= 95) remarks = 'Excellent';
        else if (attendancePercentage >= 85) remarks = 'Good';
        else if (attendancePercentage >= 75) remarks = 'Average';
        else remarks = 'Needs Improvement';

        return {
          slNo: index + 1,
          name: `${person.first_name} ${person.last_name}`,
          idNo: person.id.substring(0, 8).toUpperCase(),
          totalWorkingDays,
          daysPresent: presentDays,
          daysAbsent: absentDays,
          lateArrivals,
          remarks
        };
      });

      // Generate HTML for PDF
      const htmlContent = generateAttendanceReportHTML(reportData, startDate, endDate);

      // Create and download PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }

    } catch (error) {
      console.error('Error generating attendance report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAttendanceReportHTML = (data: any[], startDate: Date, endDate: Date) => {
    const batchName = selectedBatch === 'all' ? 'All Batches' : `Batch ${selectedBatch}`;
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const dateRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #2563eb;
          }
          .header-info {
            margin-top: 10px;
            font-size: 14px;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
          }
          th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ATTENDANCE REPORT</h1>
          <div class="header-info">
            <div><strong>Report Type:</strong> ${view === 'students' ? 'Student' : 'Staff'} Attendance</div>
            <div><strong>Batch:</strong> ${batchName}</div>
            <div><strong>Period:</strong> ${dateRange}</div>
            <div><strong>Generated On:</strong> ${reportDate}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Sl.No</th>
              <th>${view === 'students' ? 'Student' : 'Employee'} Name</th>
              <th>ID No.</th>
              <th>Total Working Days</th>
              <th>Days Present</th>
              <th>Days Absent</th>
              <th>Late Arrivals</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                <td>${row.slNo}</td>
                <td style="text-align: left;">${row.name}</td>
                <td>${row.idNo}</td>
                <td>${row.totalWorkingDays}</td>
                <td>${row.daysPresent}</td>
                <td>${row.daysAbsent}</td>
                <td>${row.lateArrivals}</td>
                <td>${row.remarks}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>This report was generated automatically by the Student Management System</p>
          <p>Total Records: ${data.length} | Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
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
    ? students.filter(student => {
        const matchesSearch = `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.course?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBatch = selectedBatch === 'all' || student.grade_level === selectedBatch;
        return matchesSearch && matchesBatch;
      })
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
              <button
                onClick={downloadAttendanceReport}
                disabled={loading}
                className="flex items-center space-x-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{loading ? 'Downloading...' : 'Download Report'}</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                <input
                  type="text"
                  placeholder={`Search ${view}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Batch Filter for Students */}
              {view === 'students' && batches.length > 0 && (
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="border border-secondary-300 rounded-lg px-3 py-2 min-w-[150px]"
                >
                  <option value="all">All Batches</option>
                  {batches.map(batch => (
                    <option key={batch} value={batch}>Batch {batch}</option>
                  ))}
                </select>
              )}
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
                    <th className="py-3 pr-4 font-medium text-secondary-700">Actions</th>
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
                        <td className="py-3 pr-4">
                          <button
                            onClick={() => handleViewIndividualReport(person)}
                            className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Report</span>
                          </button>
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

      {/* Individual Report Modal */}
      {showIndividualReport && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <div>
                <h2 className="text-2xl font-bold text-secondary-800">
                  Attendance Report - {selectedPerson.first_name} {selectedPerson.last_name}
                </h2>
                <p className="text-secondary-600 mt-1">Last 30 days attendance record</p>
              </div>
              <button
                onClick={() => setShowIndividualReport(false)}
                className="p-2 hover:bg-secondary-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-secondary-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-success-50 border border-success-200 rounded-xl p-4">
                  <h3 className="text-2xl font-bold text-success-700">
                    {individualReportData.filter(r => r.status === 'P').length}
                  </h3>
                  <p className="text-sm text-success-600">Days Present</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h3 className="text-2xl font-bold text-red-700">
                    {individualReportData.filter(r => r.status === 'A').length}
                  </h3>
                  <p className="text-sm text-red-600">Days Absent</p>
                </div>
                <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
                  <h3 className="text-2xl font-bold text-warning-700">
                    {individualReportData.filter(r => r.status === 'H').length}
                  </h3>
                  <p className="text-sm text-warning-600">Holidays</p>
                </div>
              </div>

              {/* Attendance Records */}
              <div className="bg-secondary-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-secondary-800 mb-4">Daily Records</h3>
                {individualReportData.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {individualReportData.map((record) => (
                      <div key={record.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                        <div>
                          <p className="font-medium text-secondary-800">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          {record.notes && (
                            <p className="text-sm text-secondary-600 mt-1">{record.notes}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          record.status === 'P' ? 'bg-success-100 text-success-800' :
                          record.status === 'A' ? 'bg-red-100 text-red-800' :
                          'bg-warning-100 text-warning-800'
                        }`}>
                          {getStatusLabel(record.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-secondary-600 mb-2">No Records Found</h3>
                    <p className="text-secondary-500">No attendance records found for the last 30 days</p>
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

export default AttendanceManagement;