import React, { useState, useEffect } from 'react';
import { Users, UserPlus, AlertTriangle, TrendingUp } from 'lucide-react';
import { DataService } from '../../services/dataService';

const KPICards: React.FC = () => {
  const [counters, setCounters] = useState({
    totalStudents: 0,
    activeLeads: 0,
    pendingFees: 0,
    attendance: 0
  });

  const [targetValues, setTargetValues] = useState({
    totalStudents: 247,
    activeLeads: 32,
    pendingFees: 8,
    attendance: 94
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        setLoading(true);
        const kpiData = await DataService.getDashboardKPIs();

        const newTargetValues = {
          totalStudents: kpiData.totalStudents,
          activeLeads: kpiData.activeLeads,
          pendingFees: kpiData.pendingFees,
          attendance: kpiData.attendancePercentage
        };

        setTargetValues(newTargetValues);

        // Animate counters
        const animateCounters = () => {
          const duration = 2000; // 2 seconds
          const steps = 60;
          const stepTime = duration / steps;

          let step = 0;
          const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            setCounters({
              totalStudents: Math.floor(newTargetValues.totalStudents * easeOutQuart),
              activeLeads: Math.floor(newTargetValues.activeLeads * easeOutQuart),
              pendingFees: Math.floor(newTargetValues.pendingFees * easeOutQuart),
              attendance: Math.floor(newTargetValues.attendance * easeOutQuart)
            });

            if (step >= steps) {
              clearInterval(timer);
              setCounters(newTargetValues);
            }
          }, stepTime);
        };

        setTimeout(animateCounters, 500);
      } catch (error) {
        console.error('Error fetching KPI data:', error);
        // Use fallback values and animate
        const animateCounters = () => {
          const duration = 2000;
          const steps = 60;
          const stepTime = duration / steps;

          let step = 0;
          const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            setCounters({
              totalStudents: Math.floor(targetValues.totalStudents * easeOutQuart),
              activeLeads: Math.floor(targetValues.activeLeads * easeOutQuart),
              pendingFees: Math.floor(targetValues.pendingFees * easeOutQuart),
              attendance: Math.floor(targetValues.attendance * easeOutQuart)
            });

            if (step >= steps) {
              clearInterval(timer);
              setCounters(targetValues);
            }
          }, stepTime);
        };

        setTimeout(animateCounters, 500);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIData();
  }, []);

  const kpiData = [
    {
      title: 'Total Students',
      value: counters.totalStudents,
      icon: Users,
      color: 'primary',
      change: '+12%',
      changeType: 'positive',
      bgGradient: 'from-primary-50 to-primary-100',
      iconBg: 'from-primary-500 to-primary-600',
      borderColor: 'border-primary-200'
    },
    {
      title: 'Active Leads',
      value: counters.activeLeads,
      icon: UserPlus,
      color: 'success',
      change: '68% conversion',
      changeType: 'positive',
      bgGradient: 'from-success-50 to-success-100',
      iconBg: 'from-success-500 to-success-600',
      borderColor: 'border-success-200'
    },
    {
      title: 'Pending Fees',
      value: counters.pendingFees,
      icon: AlertTriangle,
      color: 'warning',
      change: '-3 this week',
      changeType: 'positive',
      bgGradient: 'from-warning-50 to-warning-100',
      iconBg: 'from-warning-500 to-warning-600',
      borderColor: 'border-warning-200'
    },
    {
      title: 'Attendance Today',
      value: `${counters.attendance}%`,
      icon: TrendingUp,
      color: 'success',
      change: '+5% vs yesterday',
      changeType: 'positive',
      bgGradient: 'from-success-50 to-success-100',
      iconBg: 'from-success-500 to-success-600',
      borderColor: 'border-success-200'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="bg-white border border-secondary-200 rounded-2xl p-6 animate-pulse shadow-soft"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-secondary-200 rounded-xl"></div>
              <div className="w-20 h-6 bg-secondary-200 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="w-16 h-8 bg-secondary-200 rounded"></div>
              <div className="w-24 h-4 bg-secondary-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.title}
            className={`
              bg-gradient-to-br ${kpi.bgGradient} border ${kpi.borderColor} rounded-xl p-5
              hover:shadow-medium hover:scale-[1.02] transition-all duration-300 cursor-pointer
              animate-slideInUp shadow-soft
            `}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 bg-gradient-to-r ${kpi.iconBg} rounded-lg flex items-center justify-center shadow-soft`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
                kpi.changeType === 'positive'
                  ? 'text-success-700 bg-success-100 border border-success-200'
                  : 'text-danger-700 bg-danger-100 border border-danger-200'
              }`}>
                {kpi.change}
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-secondary-800 mb-1">
                {kpi.value}
              </h3>
              <p className="text-secondary-600 text-sm font-medium">{kpi.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;