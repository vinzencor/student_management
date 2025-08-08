import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, BarChart3, TrendingUp, User, Mail, Phone, GraduationCap } from 'lucide-react';
import { DataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/roleUtils';
import type { Student, Attendance, Performance, Fee } from '../lib/supabase';

interface StudentReportGeneratorProps {
  studentId?: string;
  onClose?: () => void;
}

const StudentReportGenerator: React.FC<StudentReportGeneratorProps> = ({ studentId, onClose }) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || '');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentReport(selectedStudentId);
    }
  }, [selectedStudentId]);

  const fetchStudents = async () => {
    try {
      const data = await DataService.getStudents({ status: 'active' });
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchStudentReport = async (studentId: string) => {
    try {
      setLoading(true);
      const report = await DataService.getStudentReport(studentId);
      setReportData(report);
    } catch (error) {
      console.error('Error fetching student report:', error);
    } finally {
      setLoading(false);
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

  const generatePDFReport = async () => {
    if (!reportData || !reportData.student) return;

    setGenerating(true);
    try {
      const student = reportData.student;
      const attendancePercentage = calculateAttendancePercentage(reportData.attendance);
      const averageGrade = calculateAverageGrade(reportData.performance);

      // Create a comprehensive report object
      const report = {
        generatedAt: new Date().toISOString(),
        student: {
          name: `${student.first_name} ${student.last_name}`,
          email: student.email,
          phone: student.phone,
          grade: student.grade_level,
          enrollmentDate: student.enrollment_date,
          status: student.status,
          subjects: student.subjects
        },
        summary: {
          attendancePercentage,
          averageGrade,
          totalTests: reportData.performance?.length || 0,
          totalFees: reportData.fees?.reduce((sum: number, f: Fee) => sum + f.amount, 0) || 0,
          paidFees: reportData.fees?.filter((f: Fee) => f.status === 'paid').reduce((sum: number, f: Fee) => sum + f.amount, 0) || 0
        },
        attendance: reportData.attendance?.map((att: Attendance) => ({
          date: att.date,
          status: att.status,
          notes: att.notes
        })) || [],
        performance: reportData.performance?.map((perf: Performance) => ({
          testName: perf.test_name,
          testDate: perf.test_date,
          marksObtained: perf.marks_obtained,
          totalMarks: perf.total_marks,
          percentage: Math.round((perf.marks_obtained / perf.total_marks) * 100),
          grade: perf.grade,
          feedback: perf.feedback
        })) || [],
        fees: reportData.fees?.map((fee: Fee) => ({
          amount: fee.amount,
          dueDate: fee.due_date,
          paidDate: fee.paid_date,
          status: fee.status,
          paymentMethod: fee.payment_method,
          receiptNumber: fee.receipt_number
        })) || []
      };

      // Create and download JSON report (in a real app, you'd generate a PDF)
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student-report-${student.first_name}-${student.last_name}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (!hasPermission(user, 'view_student_reports')) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-secondary-600">Access Denied</h2>
        <p className="text-secondary-500 mt-2">You don't have permission to view student reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary-800">Student Report Generator</h2>
          <p className="text-secondary-600 mt-1">Generate comprehensive student reports</p>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 text-secondary-600 hover:text-secondary-800 transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* Student Selection */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Select Student
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
              <option value="">Choose a student...</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} - {student.grade_level}
                </option>
              ))}
            </select>
          </div>
          
          {selectedStudentId && reportData && (
            <button
              onClick={generatePDFReport}
              disabled={generating}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-medium"
            >
              <Download className="w-5 h-5" />
              <span className="font-medium">
                {generating ? 'Generating...' : 'Download Report'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Report Preview */}
      {selectedStudentId && reportData && !loading && (
        <div className="space-y-6">
          {/* Student Information */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-secondary-800">Student Information</h3>
              <User className="w-6 h-6 text-primary-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h4 className="font-semibold text-secondary-800 mb-3">Personal Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-secondary-500" />
                    <span className="text-secondary-600">
                      {reportData.student.first_name} {reportData.student.last_name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-secondary-500" />
                    <span className="text-secondary-600">{reportData.student.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-secondary-500" />
                    <span className="text-secondary-600">{reportData.student.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-secondary-800 mb-3">Academic Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-secondary-500" />
                    <span className="text-secondary-600">Grade: {reportData.student.grade_level}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-secondary-500" />
                    <span className="text-secondary-600">
                      Enrolled: {new Date(reportData.student.enrollment_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${reportData.student.status === 'active' ? 'success' : 'warning'}-100 text-${reportData.student.status === 'active' ? 'success' : 'warning'}-700`}>
                      {reportData.student.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-secondary-800 mb-3">Performance Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Attendance:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${calculateAttendancePercentage(reportData.attendance) >= 80 ? 'success' : 'warning'}-100 text-${calculateAttendancePercentage(reportData.attendance) >= 80 ? 'success' : 'warning'}-700`}>
                      {calculateAttendancePercentage(reportData.attendance)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Average Grade:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${getGradeColor(calculateAverageGrade(reportData.performance))}-100 text-${getGradeColor(calculateAverageGrade(reportData.performance))}-700`}>
                      {calculateAverageGrade(reportData.performance)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Tests Taken:</span>
                    <span className="text-secondary-800 font-medium">{reportData.performance?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-secondary-800 mb-3">Fee Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Total Fees:</span>
                    <span className="text-secondary-800 font-medium">
                      ${reportData.fees?.reduce((sum: number, f: Fee) => sum + f.amount, 0).toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Paid:</span>
                    <span className="text-success-600 font-medium">
                      ${reportData.fees?.filter((f: Fee) => f.status === 'paid').reduce((sum: number, f: Fee) => sum + f.amount, 0).toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Pending:</span>
                    <span className="text-warning-600 font-medium">
                      ${reportData.fees?.filter((f: Fee) => f.status === 'pending').reduce((sum: number, f: Fee) => sum + f.amount, 0).toFixed(2) || '0.00'}
                    </span>
                  </div>
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

            {reportData.performance && reportData.performance.length > 0 ? (
              <div className="space-y-4">
                {reportData.performance.map((perf: Performance, index: number) => {
                  const percentage = Math.round((perf.marks_obtained / perf.total_marks) * 100);
                  return (
                    <div key={perf.id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-secondary-800">{perf.test_name}</h4>
                        <p className="text-sm text-secondary-600">{new Date(perf.test_date).toLocaleDateString()}</p>
                        {perf.feedback && (
                          <p className="text-xs text-secondary-500 mt-1">{perf.feedback}</p>
                        )}
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
              <h3 className="text-lg font-bold text-secondary-800">Attendance Record</h3>
              <Calendar className="w-6 h-6 text-success-600" />
            </div>

            {reportData.attendance && reportData.attendance.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {reportData.attendance.slice(0, 12).map((att: Attendance) => (
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
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary-600 font-medium">Loading student report...</p>
        </div>
      )}

      {!selectedStudentId && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-secondary-600 mb-2">Select a Student</h3>
          <p className="text-secondary-500">Choose a student from the dropdown to generate their comprehensive report.</p>
        </div>
      )}
    </div>
  );
};

export default StudentReportGenerator;
