import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, UserCheck, ChevronDown } from 'lucide-react';
import { DataService } from '../../services/dataService';

const AttendanceHeatmap: React.FC = () => {
  const [attendanceType, setAttendanceType] = useState<'students' | 'staff'>('students');
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCount: 0,
    presentToday: 0,
    averageAttendance: 0,
    trend: true
  });

  useEffect(() => {
    fetchAttendanceData();
  }, [attendanceType]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);

      // Get attendance data for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 29);

      const attendanceRecords = await DataService.getAttendance({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });

      // Get total count of students or staff
      let totalPeople = [];
      if (attendanceType === 'students') {
        totalPeople = await DataService.getStudents();
      } else {
        totalPeople = await DataService.getStaff();
      }

      const activePeople = totalPeople.filter(person => person.status === 'active');

      // Process attendance data for heatmap
      const heatmapData = generateHeatmapData(attendanceRecords, activePeople.length);
      setAttendanceData(heatmapData);

      // Calculate statistics
      const todayAttendance = heatmapData[heatmapData.length - 1];
      const averageAttendance = Math.round(
        heatmapData.reduce((sum, day) => sum + day.attendancePercentage, 0) / heatmapData.length
      );

      const lastWeekAvg = heatmapData.slice(-7).reduce((sum, day) => sum + day.attendancePercentage, 0) / 7;
      const prevWeekAvg = heatmapData.slice(-14, -7).reduce((sum, day) => sum + day.attendancePercentage, 0) / 7;

      setStats({
        totalCount: activePeople.length,
        presentToday: todayAttendance?.presentCount || 0,
        averageAttendance,
        trend: lastWeekAvg > prevWeekAvg
      });

    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateHeatmapData = (records: any[], totalCount: number) => {
    const data = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Filter records for this date and type
      const dayRecords = records.filter(record => {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        const isCorrectType = attendanceType === 'students' ? record.student_id : record.staff_id;
        return recordDate === dateStr && isCorrectType && record.status === 'P';
      });

      const presentCount = dayRecords.length;
      const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

      data.push({
        date: dateStr,
        day: date.getDate(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        presentCount,
        totalCount,
        attendancePercentage
      });
    }
    return data;
  };

  const getColorIntensity = (percentage: number) => {
    if (percentage >= 95) return 'bg-green-600';
    if (percentage >= 85) return 'bg-green-500';
    if (percentage >= 75) return 'bg-green-400';
    if (percentage >= 65) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const getTextColor = (percentage: number) => {
    if (percentage >= 75) return 'text-white';
    return 'text-gray-700';
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-primary-600" />
          <h3 className="text-lg font-bold text-secondary-800">Attendance Overview</h3>
        </div>

        {/* Dropdown Selector */}
        <div className="relative">
          <select
            value={attendanceType}
            onChange={(e) => setAttendanceType(e.target.value as 'students' | 'staff')}
            className="appearance-none bg-white border border-secondary-300 rounded-xl px-4 py-2 pr-8 text-sm font-medium text-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="students">Students</option>
            <option value="staff">Staff</option>
          </select>
          <ChevronDown className="w-4 h-4 text-secondary-500 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
              <div className="flex items-center space-x-2 mb-2">
                {attendanceType === 'students' ? (
                  <Users className="w-5 h-5 text-primary-600" />
                ) : (
                  <UserCheck className="w-5 h-5 text-primary-600" />
                )}
                <h4 className="text-2xl font-bold text-primary-700">{stats.totalCount}</h4>
              </div>
              <p className="text-sm text-primary-600">Total {attendanceType === 'students' ? 'Students' : 'Staff'}</p>
            </div>

            <div className="bg-gradient-to-r from-success-50 to-success-100 rounded-xl p-4 border border-success-200">
              <h4 className="text-2xl font-bold text-success-700">{stats.presentToday}</h4>
              <p className="text-sm text-success-600">Present Today</p>
            </div>

            <div className="bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-xl p-4 border border-secondary-200">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className={`w-4 h-4 ${stats.trend ? 'text-success-600' : 'text-red-600'}`} />
                <h4 className="text-2xl font-bold text-secondary-700">{stats.averageAttendance}%</h4>
              </div>
              <p className="text-sm text-secondary-600">30-day Average</p>
            </div>
          </div>

          {/* Heatmap Calendar */}
          <div className="grid grid-cols-10 gap-1 mb-4">
            {attendanceData.map((day, index) => (
              <div
                key={day.date}
                className={`
                  aspect-square rounded-lg flex items-center justify-center text-xs font-medium
                  hover:scale-110 transition-all duration-200 cursor-pointer
                  ${getColorIntensity(day.attendancePercentage)} ${getTextColor(day.attendancePercentage)}
                `}
                title={`${day.date}: ${day.presentCount}/${day.totalCount} (${day.attendancePercentage}%)`}
              >
                {day.day}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-secondary-600">
            <span>Less</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-secondary-200 rounded" title="No data"></div>
              <div className="w-3 h-3 bg-red-400 rounded" title="< 65%"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded" title="65-74%"></div>
              <div className="w-3 h-3 bg-green-400 rounded" title="75-84%"></div>
              <div className="w-3 h-3 bg-green-500 rounded" title="85-94%"></div>
              <div className="w-3 h-3 bg-green-600 rounded" title="95%+"></div>
            </div>
            <span>More</span>
          </div>

          {/* Recent Attendance Summary */}
          <div className="mt-6 pt-4 border-t border-secondary-200">
            <h4 className="text-sm font-semibold text-secondary-800 mb-3">
              Recent {attendanceType === 'students' ? 'Student' : 'Staff'} Attendance
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
              {attendanceData.slice(-7).map((day) => (
                <div key={day.date} className="text-center">
                  <div className="text-xs text-secondary-600 mb-1">{day.dayName}</div>
                  <div className={`text-sm font-semibold ${
                    day.attendancePercentage >= 85 ? 'text-success-600' :
                    day.attendancePercentage >= 75 ? 'text-warning-600' : 'text-red-600'
                  }`}>
                    {day.attendancePercentage}%
                  </div>
                  <div className="text-xs text-secondary-500">
                    {day.presentCount}/{day.totalCount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceHeatmap;