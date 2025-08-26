import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Users, Calendar, GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BatchData {
  id: string;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  course_name?: string;
  current_students: number;
  max_students: number;
  students: any[];
}

interface YearData {
  year: string;
  batches: BatchData[];
}

const StudentsByBatch: React.FC = () => {
  const [yearData, setYearData] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedYears, setExpandedYears] = useState<string[]>(['2025']);
  const [expandedBatches, setExpandedBatches] = useState<string[]>([]);

  useEffect(() => {
    loadStudentsByBatch();
  }, []);



  const loadStudentsByBatch = async () => {
    try {
      setLoading(true);

      // Fetch all batches with their students
      const { data: batches, error: batchError } = await supabase
        .from('batch_details')
        .select('*')
        .eq('status', 'active')
        .order('academic_year', { ascending: false });

      if (batchError) throw batchError;

      // Fetch students for each batch
      const batchesWithStudents = await Promise.all(
        (batches || []).map(async (batch) => {
          const { data: studentBatches, error: studentError } = await supabase
            .from('student_batches')
            .select(`
              *,
              student:students(
                *,
                course:courses(name, price, description),
                parent:parents(first_name, last_name, phone)
              )
            `)
            .eq('batch_id', batch.id)
            .eq('status', 'active');

          if (studentError) {
            console.error('Error fetching students for batch:', batch.id, studentError);
            return { ...batch, students: [] };
          }

          return {
            ...batch,
            students: (studentBatches || []).map(sb => sb.student).filter(Boolean)
          };
        })
      );

      // Group batches by academic year
      const yearMap = new Map<string, BatchData[]>();

      batchesWithStudents.forEach(batch => {
        const year = batch.academic_year;
        if (!yearMap.has(year)) {
          yearMap.set(year, []);
        }
        yearMap.get(year)!.push(batch);
      });

      // Convert to YearData array
      const organizedData: YearData[] = Array.from(yearMap.entries()).map(([year, batches]) => ({
        year,
        batches: batches.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
      })).sort((a, b) => b.year.localeCompare(a.year));

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
                  const batchKey = `${yearInfo.year}-${batch.id}`;
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
                          <div className="flex flex-col items-start">
                            <span className="font-medium text-secondary-700">{batch.name}</span>
                            {batch.course_name && (
                              <span className="text-xs text-secondary-500">{batch.course_name}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-secondary-500">
                            {new Date(batch.start_date).toLocaleDateString()} - {new Date(batch.end_date).toLocaleDateString()}
                          </span>
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
                                      Enrolled: {new Date().toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                                      Active
                                    </div>
                                    <div className="text-sm text-secondary-600 mt-1">
                                      QAR{student.course?.price?.toLocaleString() || '0'}
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
