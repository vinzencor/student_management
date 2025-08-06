import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';

const AttendanceHeatmap: React.FC = () => {
  // Generate sample data for the last 30 days
  const generateHeatmapData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const attendance = Math.floor(Math.random() * 40) + 60; // 60-100%
      data.push({
        date: date.toISOString().split('T')[0],
        attendance,
        day: date.getDate(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return data;
  };

  const heatmapData = generateHeatmapData();

  const getColorIntensity = (attendance: number) => {
    if (attendance >= 95) return 'bg-green-600';
    if (attendance >= 85) return 'bg-green-500';
    if (attendance >= 75) return 'bg-green-400';
    if (attendance >= 65) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const getTextColor = (attendance: number) => {
    if (attendance >= 75) return 'text-white';
    return 'text-gray-700';
  };

  const averageAttendance = Math.round(
    heatmapData.reduce((sum, day) => sum + day.attendance, 0) / heatmapData.length
  );

  const trend = heatmapData.slice(-7).reduce((sum, day) => sum + day.attendance, 0) / 7 >
               heatmapData.slice(-14, -7).reduce((sum, day) => sum + day.attendance, 0) / 7;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Attendance Overview</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <TrendingUp className={`w-4 h-4 ${trend ? 'text-green-600' : 'text-red-600'}`} />
          <span className={trend ? 'text-green-600' : 'text-red-600'}>
            {trend ? 'Trending up' : 'Needs attention'}
          </span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <h4 className="text-2xl font-bold text-blue-700">{averageAttendance}%</h4>
          <p className="text-sm text-blue-600">30-day Average</p>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <h4 className="text-2xl font-bold text-green-700">{heatmapData[heatmapData.length - 1].attendance}%</h4>
          <p className="text-sm text-green-600">Today's Attendance</p>
        </div>
      </div>

      {/* Heatmap Calendar */}
      <div className="grid grid-cols-10 gap-1 mb-4">
        {heatmapData.map((day, index) => (
          <div
            key={day.date}
            className={`
              aspect-square rounded-lg flex items-center justify-center text-xs font-medium
              hover:scale-110 transition-all duration-200 cursor-pointer
              ${getColorIntensity(day.attendance)} ${getTextColor(day.attendance)}
            `}
            title={`${day.date}: ${day.attendance}% attendance`}
          >
            {day.day}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Less</span>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-400 rounded"></div>
          <div className="w-3 h-3 bg-yellow-400 rounded"></div>
          <div className="w-3 h-3 bg-green-400 rounded"></div>
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <div className="w-3 h-3 bg-green-600 rounded"></div>
        </div>
        <span>More</span>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <button className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-4 rounded-lg transition-colors text-sm font-medium">
            View Details
          </button>
          <button className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 px-4 rounded-lg transition-colors text-sm font-medium">
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeatmap;