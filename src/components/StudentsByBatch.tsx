import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Users, Calendar, GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BatchPeriod {
  label: string;
  startMonth: number;
  endMonth: number;
  students: any[];
}

interface YearData {
  year: string;
  batches: BatchPeriod[];
}

const StudentsByBatch: React.FC = () => {
  const [yearData, setYearData] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedYears, setExpandedYears] = useState<string[]>(['2025']);
  const [expandedBatches, setExpandedBatches] = useState<string[]>([]);

  useEffect(() => {
    loadStudentsByBatch();
  }, []);

  const getBatchPeriods = (year: string): BatchPeriod[] => {
    const yearNum = parseInt(year);
    return [
      {
        label: `Aug ${year} - Feb ${yearNum + 1} (6 Months)`,
        startMonth: 8, // August
        endMonth: 2,   // February next year
        students: []
      },
      {
        label: `Aug ${year} - Aug ${yearNum + 1} (1 Year)`,
        startMonth: 8,
        endMonth: 8,
        students: []
      },
      {
        label: `Aug ${year} - Aug ${yearNum + 2} (2 Years)`,
        startMonth: 8,
        endMonth: 8,
        students: []
      },
      {
        label: `Aug ${year} - Aug ${yearNum + 3} (3 Years)`,
        startMonth: 8,
        endMonth: 8,
        students: []
      },
      {
        label: `Aug ${year} - Aug ${yearNum + 4} (4 Years)`,
        startMonth: 8,
        endMonth: 8,
        students: []
      }
    ];
  };

  const loadStudentsByBatch = async () => {
    try {
      setLoading(true);
      
      // Fetch all students with course and batch info
      const { data: students, error } = await supabase
        .from('students')
        .select(`
          *,
          course:courses(name, price, description),
          parent:parents(first_name, last_name, phone)
        `)
        .eq('status', 'active')
        .order('batch_start_date', { ascending: false });

      if (error) throw error;

      // Organize students by year and batch
      const years = ['2025', '2026', '2027', '2028'];
      const organizedData: YearData[] = years.map(year => {
        const batches = getBatchPeriods(year);
        
        // Filter students for each batch period
        batches.forEach(batch => {
          batch.students = (students || []).filter(student => {
            if (!student.batch_start_date || !student.batch_duration) return false;
            
            const startDate = new Date(student.batch_start_date);
            const startYear = startDate.getFullYear().toString();
            
            // Check if student's batch starts in this year and matches duration
            if (startYear !== year) return false;
            
            const durationMatch = 
              (student.batch_duration === '6_months' && batch.label.includes('6 Months')) ||
              (student.batch_duration === '1_year' && batch.label.includes('1 Year')) ||
              (student.batch_duration === '2_years' && batch.label.includes('2 Years')) ||
              (student.batch_duration === '3_years' && batch.label.includes('3 Years')) ||
              (student.batch_duration === '4_years' && batch.label.includes('4 Years'));
            
            return durationMatch;
          });
        });

        return { year, batches };
      });

      setYearData(organizedData);
    } catch (error) {
      console.error('Error loading students by batch:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleYear = (year: string) => {
    setExpandedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const toggleBatch = (batchKey: string) => {
    setExpandedBatches(prev =>
      prev.includes(batchKey)
        ? prev.filter(b => b !== batchKey)
        : [...prev, batchKey]
    );
  };

  const formatBatchDuration = (duration: string) => {
    switch (duration) {
      case '6_months': return '6 Months';
      case '1_year': return '1 Year';
      case '2_years': return '2 Years';
      case '3_years': return '3 Years';
      case '4_years': return '4 Years';
      default: return duration;
    }
  };

  const isCurrentBatch = (student: any) => {
    if (!student.batch_start_date || !student.batch_end_date) return false;
    const now = new Date();
    const start = new Date(student.batch_start_date);
    const end = new Date(student.batch_end_date);
    return now >= start && now <= end;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary-200 rounded w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-secondary-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-4 lg:p-6 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-secondary-800">Students by Batch</h2>
          <p className="text-sm text-secondary-600 mt-1">View students organized by academic year and batch duration</p>
        </div>
        <button
          onClick={loadStudentsByBatch}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {yearData.map((yearInfo) => (
          <div key={yearInfo.year} className="border border-secondary-200 rounded-lg overflow-hidden">
            {/* Year Header */}
            <button
              onClick={() => toggleYear(yearInfo.year)}
              className="w-full flex items-center justify-between p-4 bg-secondary-50 hover:bg-secondary-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {expandedYears.includes(yearInfo.year) ? (
                  <ChevronDown className="w-5 h-5 text-secondary-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-secondary-600" />
                )}
                <Calendar className="w-5 h-5 text-primary-600" />
                <span className="text-lg font-semibold text-secondary-800">Academic Year {yearInfo.year}</span>
              </div>
              <div className="text-sm text-secondary-600">
                {yearInfo.batches.reduce((total, batch) => total + batch.students.length, 0)} students
              </div>
            </button>

            {/* Year Content */}
            {expandedYears.includes(yearInfo.year) && (
              <div className="border-t border-secondary-200">
                {yearInfo.batches.map((batch, batchIndex) => {
                  const batchKey = `${yearInfo.year}-${batchIndex}`;
                  const hasStudents = batch.students.length > 0;
                  
                  return (
                    <div key={batchKey} className="border-b border-secondary-100 last:border-b-0">
                      {/* Batch Header */}
                      <button
                        onClick={() => hasStudents && toggleBatch(batchKey)}
                        className={`w-full flex items-center justify-between p-3 pl-8 ${
                          hasStudents ? 'hover:bg-secondary-50 cursor-pointer' : 'cursor-default'
                        } transition-colors`}
                        disabled={!hasStudents}
                      >
                        <div className="flex items-center space-x-3">
                          {hasStudents && (
                            expandedBatches.includes(batchKey) ? (
                              <ChevronDown className="w-4 h-4 text-secondary-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-secondary-600" />
                            )
                          )}
                          <GraduationCap className="w-4 h-4 text-secondary-600" />
                          <span className="font-medium text-secondary-700">{batch.label}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            hasStudents ? 'bg-primary-100 text-primary-800' : 'bg-secondary-100 text-secondary-600'
                          }`}>
                            {batch.students.length} students
                          </span>
                        </div>
                      </button>

                      {/* Batch Students */}
                      {expandedBatches.includes(batchKey) && hasStudents && (
                        <div className="bg-secondary-25 p-4 pl-12">
                          <div className="grid gap-3">
                            {batch.students.map((student) => (
                              <div key={student.id} className="bg-white p-3 rounded-lg border border-secondary-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-secondary-800">
                                      {student.first_name} {student.last_name}
                                    </div>
                                    <div className="text-sm text-secondary-600">
                                      {student.course?.name} • Grade {student.grade_level}
                                    </div>
                                    <div className="text-xs text-secondary-500">
                                      {formatBatchDuration(student.batch_duration)} • 
                                      {new Date(student.batch_start_date).toLocaleDateString()} - 
                                      {new Date(student.batch_end_date).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      isCurrentBatch(student) 
                                        ? 'bg-success-100 text-success-800' 
                                        : 'bg-secondary-100 text-secondary-600'
                                    }`}>
                                      {isCurrentBatch(student) ? 'Active' : 'Inactive'}
                                    </div>
                                    <div className="text-sm text-secondary-600 mt-1">
                                      ₹{student.course?.price?.toLocaleString() || '0'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentsByBatch;
