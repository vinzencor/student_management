import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { supabase } from '../lib/supabase';

interface StudentAdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadData: any;
  onComplete: (studentId: string, parentId: string, courseId: string, coursePrice: number) => void;
}

const StudentAdmissionModal: React.FC<StudentAdmissionModalProps> = ({
  isOpen,
  onClose,
  leadData,
  onComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  
  // Student form data
  const [studentForm, setStudentForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    grade_level: leadData?.grade_level || '',
    address: '',
    religion: '',
    nationality: 'Indian',
    blood_group: '',
    medical_conditions: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    previous_school: '',
    course_id: '',
    batch_duration: '',
    batch_start_date: new Date().toISOString().slice(0, 10),
    subjects: leadData?.subjects_interested || [],
    photo_url: '',
    enrollment_date: new Date().toISOString().slice(0, 10),
    status: 'active'
  });

  // Parent form data
  const [parentForm, setParentForm] = useState({
    first_name: leadData?.first_name || '',
    last_name: leadData?.last_name || '',
    email: leadData?.email || '',
    phone: leadData?.phone || '',
    address: '',
    occupation: '',
    company_name: '',
    annual_income: '',
    education_qualification: '',
    relationship_to_student: 'Father'
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadCourses();
    }
  }, [isOpen]);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleCourseChange = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    setSelectedCourse(course);
    setStudentForm({...studentForm, course_id: courseId});
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // 1. Create/update parent
      let parentId;
      const existingParent = parentForm.email ? await DataService.findParentByEmail(parentForm.email) : null;
      if (existingParent) {
        const updatedParent = await DataService.updateParent(existingParent.id, parentForm);
        parentId = updatedParent.id;
      } else {
        const createdParent = await DataService.createParent(parentForm);
        parentId = createdParent.id;
      }

      // 2. Upload image if provided (simplified - in real app you'd use Supabase Storage)
      let photoUrl = '';
      if (imageFile) {
        // For now, we'll use a placeholder. In production, upload to Supabase Storage
        photoUrl = 'placeholder-photo-url';
      }

      // 3. Create student
      const studentData = {
        ...studentForm,
        parent_id: parentId,
        photo_url: photoUrl
      };
      const createdStudent = await DataService.createStudent(studentData);

      onComplete(createdStudent.id, parentId, selectedCourse?.id || '', selectedCourse?.price || 0);
      onClose();
    } catch (error) {
      console.error('Error creating student admission:', error);
      alert('Failed to complete admission: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-secondary-800">Student Admission Form</h2>
            <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center mb-8">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-primary-600' : 'text-secondary-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-secondary-200'}`}>1</div>
              <span className="ml-2">Student Details</span>
            </div>
            <div className="flex-1 h-px bg-secondary-200 mx-4"></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-primary-600' : 'text-secondary-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-secondary-200'}`}>2</div>
              <span className="ml-2">Parent Details</span>
            </div>
          </div>

          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Student Information</h3>
              
              {/* Photo Upload */}
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 border-2 border-dashed border-secondary-300 rounded-lg flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Student" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-secondary-400 text-sm">Photo</span>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700">
                    Upload Photo
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={studentForm.first_name}
                    onChange={(e) => setStudentForm({...studentForm, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={studentForm.last_name}
                    onChange={(e) => setStudentForm({...studentForm, last_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={studentForm.date_of_birth}
                    onChange={(e) => setStudentForm({...studentForm, date_of_birth: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Gender *</label>
                  <select
                    required
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({...studentForm, gender: e.target.value})}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Grade Level *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={studentForm.grade_level}
                    onChange={(e) => setStudentForm({...studentForm, grade_level: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Course *</label>
                  <select
                    required
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={studentForm.course_id}
                    onChange={(e) => handleCourseChange(e.target.value)}
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name} - ₹{course.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {selectedCourse && (
                    <p className="text-sm text-secondary-600 mt-1">
                      Course Fee: ₹{selectedCourse.price.toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Religion</label>
                  <input
                    type="text"
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={studentForm.religion}
                    onChange={(e) => setStudentForm({...studentForm, religion: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Batch Duration *</label>
                  <select
                    required
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={studentForm.batch_duration}
                    onChange={(e) => setStudentForm({...studentForm, batch_duration: e.target.value})}
                  >
                    <option value="">Select Batch Duration</option>
                    <option value="6_months">6 Months</option>
                    <option value="1_year">1 Year</option>
                    <option value="2_years">2 Years</option>
                    <option value="3_years">3 Years</option>
                    <option value="4_years">4 Years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Batch Start Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={studentForm.batch_start_date}
                    onChange={(e) => setStudentForm({...studentForm, batch_start_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Blood Group</label>
                  <select
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={studentForm.blood_group}
                    onChange={(e) => setStudentForm({...studentForm, blood_group: e.target.value})}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Nationality</label>
                  <input
                    type="text"
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={studentForm.nationality}
                    onChange={(e) => setStudentForm({...studentForm, nationality: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Address *</label>
                <textarea
                  required
                  rows={3}
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={studentForm.address}
                  onChange={(e) => setStudentForm({...studentForm, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={studentForm.emergency_contact_name}
                    onChange={(e) => setStudentForm({...studentForm, emergency_contact_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={studentForm.emergency_contact_phone}
                    onChange={(e) => setStudentForm({...studentForm, emergency_contact_phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Medical Conditions</label>
                <textarea
                  rows={2}
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={studentForm.medical_conditions}
                  onChange={(e) => setStudentForm({...studentForm, medical_conditions: e.target.value})}
                  placeholder="Any allergies, medical conditions, or special requirements"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Previous School</label>
                <input
                  type="text"
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={studentForm.previous_school}
                  onChange={(e) => setStudentForm({...studentForm, previous_school: e.target.value})}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  disabled={!studentForm.first_name || !studentForm.last_name || !studentForm.date_of_birth || !studentForm.gender || !studentForm.address || !studentForm.course_id || !studentForm.batch_duration || !studentForm.batch_start_date}
                >
                  Next: Parent Details
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Parent/Guardian Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={parentForm.first_name}
                    onChange={(e) => setParentForm({...parentForm, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={parentForm.last_name}
                    onChange={(e) => setParentForm({...parentForm, last_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={parentForm.email}
                    onChange={(e) => setParentForm({...parentForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={parentForm.phone}
                    onChange={(e) => setParentForm({...parentForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Relationship to Student</label>
                  <select
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={parentForm.relationship_to_student}
                    onChange={(e) => setParentForm({...parentForm, relationship_to_student: e.target.value})}
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={parentForm.occupation}
                    onChange={(e) => setParentForm({...parentForm, occupation: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={parentForm.company_name}
                    onChange={(e) => setParentForm({...parentForm, company_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Annual Income</label>
                  <input
                    type="text"
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={parentForm.annual_income}
                    onChange={(e) => setParentForm({...parentForm, annual_income: e.target.value})}
                    placeholder="e.g., 5,00,000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Education Qualification</label>
                  <input
                    type="text"
                    className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={parentForm.education_qualification}
                    onChange={(e) => setParentForm({...parentForm, education_qualification: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Address *</label>
                <textarea
                  required
                  rows={3}
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={parentForm.address}
                  onChange={(e) => setParentForm({...parentForm, address: e.target.value})}
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !parentForm.first_name || !parentForm.last_name || !parentForm.email || !parentForm.phone || !parentForm.address}
                  className="px-6 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Admission...' : 'Complete Admission'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAdmissionModal;
