import React, { useState, useEffect } from 'react';
import { Gift, Bell, ChevronLeft, ChevronRight, Calendar, Mail, Loader } from 'lucide-react';
import { DataService } from '../../services/dataService';
import { EmailService } from '../../services/emailService';

const TaskAutomation: React.FC = () => {
  const [currentBirthdayIndex, setCurrentBirthdayIndex] = useState(0);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingWishes, setSendingWishes] = useState<string | null>(null);

  const feeAlerts = [
    { name: 'John Doe', amount: '$150', dueDate: 'Dec 25', status: 'overdue' },
    { name: 'Sarah Kim', amount: '$200', dueDate: 'Dec 27', status: 'due-soon' },
    { name: 'Alex Brown', amount: '$150', dueDate: 'Jan 2', status: 'upcoming' }
  ];

  useEffect(() => {
    fetchUpcomingBirthdays();
  }, []);

  useEffect(() => {
    if (upcomingBirthdays.length > 0) {
      const interval = setInterval(() => {
        setCurrentBirthdayIndex((prev) =>
          prev === upcomingBirthdays.length - 1 ? 0 : prev + 1
        );
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [upcomingBirthdays.length]);

  const fetchUpcomingBirthdays = async () => {
    try {
      setLoading(true);
      const students = await DataService.getStudents();

      if (students) {
        const birthdaysWithDates = students
          .filter(student => student.date_of_birth)
          .map(student => {
            const birthDate = new Date(student.date_of_birth!);
            const today = new Date();
            const currentYear = today.getFullYear();

            // Set birthday to current year
            const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());

            // If birthday has passed this year, set to next year
            if (thisYearBirthday < today) {
              thisYearBirthday.setFullYear(currentYear + 1);
            }

            const daysUntilBirthday = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const age = currentYear - birthDate.getFullYear() + (thisYearBirthday.getFullYear() > currentYear ? 1 : 0);

            return {
              id: student.id,
              name: `${student.first_name} ${student.last_name}`,
              email: student.email,
              parentEmail: student.parent?.email,
              date: daysUntilBirthday === 0 ? 'Today' :
                    daysUntilBirthday === 1 ? 'Tomorrow' :
                    thisYearBirthday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              age,
              class: student.grade_level,
              daysUntil: daysUntilBirthday,
              birthDate: thisYearBirthday
            };
          })
          .filter(student => student.daysUntil <= 30) // Show birthdays within next 30 days
          .sort((a, b) => a.daysUntil - b.daysUntil);

        setUpcomingBirthdays(birthdaysWithDates);
      }
    } catch (error) {
      console.error('Error fetching birthdays:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendBirthdayWishes = async (student: any) => {
    try {
      setSendingWishes(student.id);

      const result = await EmailService.sendBirthdayWishes(student);

      if (result.success) {
        alert(`Birthday wishes sent successfully to ${student.name}!`);
      } else {
        alert('Failed to send birthday wishes. Please try again.');
      }
    } catch (error) {
      console.error('Error sending birthday wishes:', error);
      alert('Failed to send birthday wishes. Please try again.');
    } finally {
      setSendingWishes(null);
    }
  };

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
      case 'overdue': return 'bg-danger-100 text-danger-800 border-danger-200';
      case 'due-soon': return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'upcoming': return 'bg-primary-100 text-primary-800 border-primary-200';
      default: return 'bg-secondary-100 text-secondary-800 border-secondary-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-100 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-48 h-6 bg-pink-200 rounded"></div>
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-pink-200 rounded-full"></div>
              <div className="w-8 h-8 bg-pink-200 rounded-full"></div>
            </div>
          </div>
          <div className="w-full h-24 bg-pink-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Birthday Card */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-100 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Gift className="w-6 h-6 text-pink-600" />
            <h3 className="text-lg font-bold text-secondary-800">Upcoming Birthdays</h3>
            {upcomingBirthdays.length > 0 && (
              <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded-full text-xs font-medium">
                {upcomingBirthdays.length} upcoming
              </span>
            )}
          </div>
          {upcomingBirthdays.length > 1 && (
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
          )}
        </div>

        {upcomingBirthdays.length > 0 ? (
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentBirthdayIndex * 100}%)` }}
            >
              {upcomingBirthdays.map((student) => (
                <div key={student.id} className="w-full flex-shrink-0">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-pink-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-secondary-800">{student.name}</h4>
                        <p className="text-sm text-secondary-600">{student.class}</p>
                        <p className="text-xs text-pink-600 mt-1">Turning {student.age}</p>
                        {student.email || student.parentEmail ? (
                          <p className="text-xs text-secondary-500 mt-1">
                            📧 {student.parentEmail || student.email}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium mb-2">
                          {student.date}
                        </div>
                        <button
                          onClick={() => sendBirthdayWishes(student)}
                          disabled={sendingWishes === student.id}
                          className="flex items-center space-x-1 text-xs text-pink-600 hover:text-pink-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendingWishes === student.id ? (
                            <>
                              <Loader className="w-3 h-3 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-3 h-3" />
                              <span>Send Wishes</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center border border-pink-100">
            <Gift className="w-12 h-12 text-pink-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-secondary-600 mb-2">No Upcoming Birthdays</h4>
            <p className="text-secondary-500">No student birthdays in the next 30 days</p>
          </div>
        )}

        {upcomingBirthdays.length > 1 && (
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
        )}
      </div>

      {/* Fee Reminder Alerts */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-secondary-200">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="w-6 h-6 text-warning-600" />
          <h3 className="text-lg font-bold text-secondary-800">Fee Reminder Alerts</h3>
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

        <button className="w-full mt-4 bg-warning-100 hover:bg-warning-200 text-warning-800 py-3 rounded-xl transition-colors font-medium">
          Send All Reminders
        </button>
      </div>
    </div>
  );
};

export default TaskAutomation;