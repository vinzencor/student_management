import React, { useState, useEffect } from 'react';
import { Gift, Bell, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const TaskAutomation: React.FC = () => {
  const [currentBirthdayIndex, setCurrentBirthdayIndex] = useState(0);

  const upcomingBirthdays = [
    { name: 'Emma Thompson', date: 'Today', age: 16, class: 'Grade 11A' },
    { name: 'Michael Chen', date: 'Tomorrow', age: 17, class: 'Grade 12B' },
    { name: 'Sofia Rodriguez', date: 'Dec 28', age: 15, class: 'Grade 10C' },
    { name: 'James Wilson', date: 'Dec 30', age: 16, class: 'Grade 11B' }
  ];

  const feeAlerts = [
    { name: 'John Doe', amount: '$150', dueDate: 'Dec 25', status: 'overdue' },
    { name: 'Sarah Kim', amount: '$200', dueDate: 'Dec 27', status: 'due-soon' },
    { name: 'Alex Brown', amount: '$150', dueDate: 'Jan 2', status: 'upcoming' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBirthdayIndex((prev) => 
        prev === upcomingBirthdays.length - 1 ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [upcomingBirthdays.length]);

  const nextBirthday = () => {
    setCurrentBirthdayIndex((prev) => 
      prev === upcomingBirthdays.length - 1 ? 0 : prev + 1
    );
  };

  const prevBirthday = () => {
    setCurrentBirthdayIndex((prev) => 
      prev === 0 ? upcomingBirthdays.length - 1 : prev - 1
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'due-soon': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Birthday Card */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Gift className="w-6 h-6 text-pink-600" />
            <h3 className="text-lg font-bold text-gray-800">Upcoming Birthdays</h3>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={prevBirthday}
              className="p-2 rounded-full hover:bg-pink-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-pink-600" />
            </button>
            <button 
              onClick={nextBirthday}
              className="p-2 rounded-full hover:bg-pink-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-pink-600" />
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentBirthdayIndex * 100}%)` }}
          >
            {upcomingBirthdays.map((student, index) => (
              <div key={index} className="w-full flex-shrink-0">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-pink-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">{student.name}</h4>
                      <p className="text-sm text-gray-600">{student.class}</p>
                      <p className="text-xs text-pink-600 mt-1">Turning {student.age}</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {student.date}
                      </div>
                      <button className="text-xs text-pink-600 hover:text-pink-700 mt-2 underline">
                        Send Wishes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center space-x-2 mt-4">
          {upcomingBirthdays.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBirthdayIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentBirthdayIndex ? 'bg-pink-500' : 'bg-pink-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Fee Reminder Alerts */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-800">Fee Reminder Alerts</h3>
        </div>

        <div className="space-y-3">
          {feeAlerts.map((alert, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-xl border-2 ${getStatusColor(alert.status)} transition-all hover:shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{alert.name}</h4>
                  <p className="text-sm opacity-75">Due: {alert.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{alert.amount}</p>
                  <button className="text-xs underline opacity-75 hover:opacity-100">
                    Send Reminder
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full mt-4 bg-orange-100 hover:bg-orange-200 text-orange-800 py-3 rounded-xl transition-colors font-medium">
          Send All Reminders
        </button>
      </div>
    </div>
  );
};

export default TaskAutomation;