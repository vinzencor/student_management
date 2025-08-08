import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Calendar, TrendingUp, Eye, FileText, BarChart3 } from 'lucide-react';
import { DataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import type { Student, Attendance, Performance, Fee } from '../lib/supabase';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentReport, setStudentReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentReport(selectedStudent.id);
    }
  }, [selectedStudent]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await DataService.getStudents({ status: 'active' });
      setStudents(data || []);
      if (data && data.length > 0) {
        setSelectedStudent(data[0]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentReport = async (studentId: string) => {
    try {
      setReportLoading(true);
      const report = await DataService.getStudentReport(studentId);
      setStudentReport(report);
    } catch (error) {
      console.error('Error fetching student report:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const calculateAttendancePercentage = (attendance: Attendance[]) => {
    if (!attendance || attendance.length === 0) return 0;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    return Math.round((presentCount / attendance.length) * 100);
  };

  const calculateAverageGrade = (performance: Performance[]) => {
    if (!performance || performance.length === 0) return 0;
    const totalPercentage = performance.reduce((sum, p) => {
      return sum + (p.marks_obtained / p.total_marks) * 100;
    }, 0);
    return Math.round(totalPercentage / performance.length);
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 75) return 'primary';
    if (percentage >= 60) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="space-y-6 pt-6">
        <div className="flex justify-between items-center">
          <div className="w-48 h-8 bg-secondary-200 rounded animate-pulse"></div>
          <div className="w-32 h-10 bg-secondary-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl border border-secondary-200 animate-pulse">
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
          <h1 className="text-3xl font-bold text-secondary-800">Teacher Dashboard</h1>
          <p className="text-secondary-600 mt-1">Monitor student progress and performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedStudent?.id || ''}
            onChange={(e) => {
              const student = students.find(s => s.id === e.target.value);
              setSelectedStudent(student || null);
            }}
            className="px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option value="">Select Student</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-primary-600" />
            <span className="text-sm font-medium text-primary-700 bg-primary-100 px-3 py-1 rounded-full border border-primary-200">
              Students
            </span>
          </div>
          <h3 className="text-2xl font-bold text-secondary-800">{students.length}</h3>
          <p className="text-primary-600 text-sm font-medium">Total Students</p>
        </div>

        <div className="bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-success-600" />
            <span className="text-sm font-medium text-success-700 bg-success-100 px-3 py-1 rounded-full border border-success-200">
              Attendance
            </span>
          </div>
          <h3 className="text-2xl font-bold text-secondary-800">
            {studentReport ? calculateAttendancePercentage(studentReport.attendance) : 0}%
          </h3>
          <p className="text-success-600 text-sm font-medium">
            {selectedStudent ? `${selectedStudent.first_name}'s Attendance` : 'Select Student'}
          </p>
        </div>

        <div className="bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-warning-600" />
            <span className="text-sm font-medium text-warning-700 bg-warning-100 px-3 py-1 rounded-full border border-warning-200">
              Performance
            </span>
          </div>
          <h3 className="text-2xl font-bold text-secondary-800">
            {studentReport ? calculateAverageGrade(studentReport.performance) : 0}%
          </h3>
          <p className="text-warning-600 text-sm font-medium">
            {selectedStudent ? `${selectedStudent.first_name}'s Average` : 'Select Student'}
          </p>
        </div>

        <div className="bg-gradient-to-r from-secondary-50 to-secondary-100 border border-secondary-200 rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="w-8 h-8 text-secondary-600" />
            <span className="text-sm font-medium text-secondary-700 bg-secondary-100 px-3 py-1 rounded-full border border-secondary-200">
              Subjects
            </span>
          </div>
          <h3 className="text-2xl font-bold text-secondary-800">
            {selectedStudent?.subjects?.length || 0}
          </h3>
          <p className="text-secondary-600 text-sm font-medium">
            {selectedStudent ? `${selectedStudent.first_name}'s Subjects` : 'Select Student'}
          </p>
        </div>
      </div>

      {selectedStudent && studentReport && !reportLoading && (
        <>
          {/* Student Details */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-secondary-800">Student Details</h3>
              <Eye className="w-6 h-6 text-primary-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h4 className="font-semibold text-secondary-800 mb-2">Personal Information</h4>
                <div className="space-y-2 text-sm text-secondary-600">
                  <p><span className="font-medium">Name:</span> {selectedStudent.first_name} {selectedStudent.last_name}</p>
                  <p><span className="font-medium">Email:</span> {selectedStudent.email || 'N/A'}</p>
                  <p><span className="font-medium">Phone:</span> {selectedStudent.phone || 'N/A'}</p>
                  <p><span className="font-medium">Grade:</span> {selectedStudent.grade_level}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-secondary-800 mb-2">Academic Info</h4>
                <div className="space-y-2 text-sm text-secondary-600">
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full bg-${selectedStudent.status === 'active' ? 'success' : 'warning'}-100 text-${selectedStudent.status === 'active' ? 'success' : 'warning'}-700`}>
                      {selectedStudent.status}
                    </span>
                  </p>
                  <p><span className="font-medium">Enrolled:</span> {new Date(selectedStudent.enrollment_date).toLocaleDateString()}</p>
                  <p><span className="font-medium">Subjects:</span> {selectedStudent.subjects?.length || 0}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-secondary-800 mb-2">Performance Summary</h4>
                <div className="space-y-2 text-sm text-secondary-600">
                  <p><span className="font-medium">Tests Taken:</span> {studentReport.performance?.length || 0}</p>
                  <p><span className="font-medium">Average Score:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full bg-${getGradeColor(calculateAverageGrade(studentReport.performance))}-100 text-${getGradeColor(calculateAverageGrade(studentReport.performance))}-700`}>
                      {calculateAverageGrade(studentReport.performance)}%
                    </span>
                  </p>
                  <p><span className="font-medium">Attendance:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full bg-${calculateAttendancePercentage(studentReport.attendance) >= 80 ? 'success' : 'warning'}-100 text-${calculateAttendancePercentage(studentReport.attendance) >= 80 ? 'success' : 'warning'}-700`}>
                      {calculateAttendancePercentage(studentReport.attendance)}%
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-secondary-800 mb-2">Fee Status</h4>
                <div className="space-y-2 text-sm text-secondary-600">
                  <p><span className="font-medium">Total Fees:</span> ${studentReport.fees?.reduce((sum: number, f: Fee) => sum + f.amount, 0).toFixed(2) || '0.00'}</p>
                  <p><span className="font-medium">Paid:</span> ${studentReport.fees?.filter((f: Fee) => f.status === 'paid').reduce((sum: number, f: Fee) => sum + f.amount, 0).toFixed(2) || '0.00'}</p>
                  <p><span className="font-medium">Pending:</span> ${studentReport.fees?.filter((f: Fee) => f.status === 'pending').reduce((sum: number, f: Fee) => sum + f.amount, 0).toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-secondary-800">Performance Trend</h3>
              <BarChart3 className="w-6 h-6 text-primary-600" />
            </div>

            {studentReport.performance && studentReport.performance.length > 0 ? (
              <div className="space-y-4">
                {studentReport.performance.slice(0, 5).map((perf: Performance, index: number) => {
                  const percentage = Math.round((perf.marks_obtained / perf.total_marks) * 100);
                  return (
                    <div key={perf.id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-secondary-800">{perf.test_name}</h4>
                        <p className="text-sm text-secondary-600">{new Date(perf.test_date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-secondary-600">{perf.marks_obtained}/{perf.total_marks}</span>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full bg-${getGradeColor(percentage)}-100 text-${getGradeColor(percentage)}-700`}>
                            {percentage}%
                          </span>
                        </div>
                        <p className="text-xs text-secondary-500 mt-1">Grade: {perf.grade}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                <p className="text-secondary-500">No performance data available</p>
              </div>
            )}
          </div>

          {/* Attendance Overview */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-secondary-800">Recent Attendance</h3>
              <Calendar className="w-6 h-6 text-success-600" />
            </div>

            {studentReport.attendance && studentReport.attendance.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {studentReport.attendance.slice(0, 8).map((att: Attendance) => (
                  <div key={att.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-secondary-800">{new Date(att.date).toLocaleDateString()}</p>
                      <p className="text-xs text-secondary-600">{att.notes || 'No notes'}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      att.status === 'present' 
                        ? 'bg-success-100 text-success-700' 
                        : att.status === 'absent'
                        ? 'bg-danger-100 text-danger-700'
                        : 'bg-warning-100 text-warning-700'
                    }`}>
                      {att.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                <p className="text-secondary-500">No attendance data available</p>
              </div>
            )}
          </div>
        </>
      )}

      {!selectedStudent && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-secondary-600 mb-2">Select a Student</h3>
          <p className="text-secondary-500">Choose a student from the dropdown to view their detailed report.</p>
        </div>
      )}

      {reportLoading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary-600 font-medium">Loading student report...</p>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
