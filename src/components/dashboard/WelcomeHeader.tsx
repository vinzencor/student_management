import React from 'react';
import { Sun, Cloud } from 'lucide-react';

const WelcomeHeader: React.FC = () => {
  const currentDate = new Date();
  const greeting = currentDate.getHours() < 12 ? 'Good Morning' : 
                  currentDate.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
  
  const dateString = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const motivationalLines = [
    "Ready to inspire young minds today?",
    "Let's make learning magical!",
    "Every student's success starts with you!",
    "Today is full of possibilities!",
    "Making education better, one student at a time!"
  ];

  const randomMotivation = motivationalLines[Math.floor(Math.random() * motivationalLines.length)];

  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 opacity-20">
        <Sun className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16" />
      </div>
      <div className="absolute bottom-2 sm:bottom-4 right-4 sm:right-8 opacity-10">
        <Cloud className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 animate-slideInLeft">
              {greeting} 👋
            </h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-lg mb-2 sm:mb-4 animate-slideInLeft animation-delay-200">
              {dateString}
            </p>
            <p className="text-blue-50 text-sm sm:text-base font-medium animate-slideInLeft animation-delay-400">
              {randomMotivation}
            </p>
          </div>
          
          {/* <div className="mt-6 md:mt-0 md:text-right">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 animate-slideInRight">
              <p className="text-sm text-blue-100 mb-1">Weather</p>
              <div className="flex items-center space-x-2">
                <Sun className="w-5 h-5" />
                <span className="text-lg font-semibold">22°C</span>
              </div>
              <p className="text-xs text-blue-100 mt-1">Perfect day for learning!</p>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;