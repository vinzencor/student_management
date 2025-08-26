import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, BookOpen, AlertCircle, Plus, Tag } from 'lucide-react';
import { DataService } from '../../services/dataService';
import { supabase } from '../../lib/supabase';
import type { Lead } from '../../lib/supabase';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: () => void;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onLeadAdded }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    source: 'website' as Lead['source'],
    priority: 'cold' as Lead['priority'],
    grade_level: '',
    subjects_interested: [] as string[],
    assigned_counselor: '',
    notes: '',
    follow_up_date: '',
    tags: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newTag, setNewTag] = useState('');
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const sources = [
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Referral' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'walk_in', label: 'Walk-in' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'hot', label: 'Hot', color: 'text-red-600 bg-red-50' },
    { value: 'cold', label: 'Cold', color: 'text-blue-600 bg-blue-50' },
    { value: 'lost', label: 'Lost', color: 'text-gray-600 bg-gray-50' }
  ];

  // Fetch batches and subjects when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchBatches();
      fetchSubjects();
    }
  }, [isOpen]);

  const fetchBatches = async () => {
    try {
      setBatchesLoading(true);
      const { data, error } = await supabase
        .from('batch_details')
        .select('id, name, academic_year, status')
        .eq('status', 'active')
        .order('academic_year', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setBatchesLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      setSubjectsLoading(true);
      const { data, error } = await supabase
        .from('active_subjects')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects_interested: prev.subjects_interested.includes(subject)
        ? prev.subjects_interested.filter(s => s !== subject)
        : [...prev.subjects_interested, subject]
    }));
  };

  const handleAddCustomSubject = async () => {
    const subjectName = newSubject.trim();
    const allSubjectNames = getAllSubjects();

    if (subjectName && !allSubjectNames.includes(subjectName)) {
      try {
        // Add to database
        const { data, error } = await supabase
          .from('subjects')
          .insert([{
            name: subjectName,
            description: `Custom subject added from lead management`,
            category: 'custom',
            status: 'active'
          }])
          .select()
          .single();

        if (error) throw error;

        // Add to local subjects list
        setSubjects(prev => [...prev, data]);

        // Add to form data
        setFormData(prev => ({
          ...prev,
          subjects_interested: [...prev.subjects_interested, subjectName]
        }));

        setNewSubject('');
        console.log(`Subject "${subjectName}" added successfully`);
      } catch (error) {
        console.error('Error adding subject:', error);
        // Fallback to custom subjects if database fails
        setCustomSubjects(prev => [...prev, subjectName]);
        setFormData(prev => ({
          ...prev,
          subjects_interested: [...prev.subjects_interested, subjectName]
        }));
        setNewSubject('');
      }
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getAllSubjects = () => {
    const dbSubjects = subjects.map(s => s.name);
    return [...dbSubjects, ...customSubjects];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const leadData = {
        ...formData,
        status: 'new' as Lead['status']
      };

      await DataService.createLead(leadData);
      onLeadAdded();
      onClose();
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        source: 'website',
        priority: 'cold',
        grade_level: '',
        subjects_interested: [],
        assigned_counselor: '',
        notes: '',
        follow_up_date: '',
        tags: []
      });
      setNewSubject('');
      setNewTag('');
      setCustomSubjects([]);
    } catch (error: any) {
      setError(error.message || 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-large max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div>
            <h2 className="text-2xl font-bold text-secondary-800">Add New Lead</h2>
            <p className="text-secondary-600 mt-1">Create a new student inquiry</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-secondary-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0" />
              <p className="text-danger-700 text-sm">{error}</p>
            </div>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-secondary-800 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Personal Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="John"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Phone *
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="+1 234-567-8900"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-secondary-800 flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>Academic Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Batch/Grade Level
                </label>
                <select
                  name="grade_level"
                  value={formData.grade_level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  disabled={batchesLoading}
                >
                  <option value="">
                    {batchesLoading ? 'Loading batches...' : 'Select Batch/Grade'}
                  </option>
                  {batches.map(batch => (
                    <option key={batch.id} value={batch.name}>
                      {batch.name} ({batch.academic_year})
                    </option>
                  ))}
                </select>
                {batches.length === 0 && !batchesLoading && (
                  <p className="text-xs text-secondary-500 mt-1">
                    No active batches found. Please create batches in Batch Management.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Source *
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  required
                >
                  {sources.map(source => (
                    <option key={source.value} value={source.value}>{source.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Priority *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  required
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Subjects Interested
              </label>

              {/* Add Custom Subject */}
              <div className="mb-4 p-4 bg-secondary-50 rounded-xl border border-secondary-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Add new subject..."
                    className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSubject()}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add</span>
                  </button>
                </div>
              </div>

              {/* Subject Selection */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {getAllSubjects().map(subject => (
                  <label key={subject} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.subjects_interested.includes(subject)}
                      onChange={() => handleSubjectToggle(subject)}
                      className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                    />
                    <span className={`text-sm ${customSubjects.includes(subject) ? 'text-primary-700 font-medium' : 'text-secondary-700'}`}>
                      {subject}
                      {customSubjects.includes(subject) && <span className="text-xs text-primary-500 ml-1">(Custom)</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags Section */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Tags
              </label>

              {/* Add Tag */}
              <div className="mb-4 p-4 bg-secondary-50 rounded-xl border border-secondary-200">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-secondary-500" />
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag (e.g., VIP, Urgent, Follow-up)..."
                    className="flex-1 px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add</span>
                  </button>
                </div>
              </div>

              {/* Display Tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 border border-primary-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Assigned Counselor
                </label>
                <input
                  type="text"
                  name="assigned_counselor"
                  value={formData.assigned_counselor}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Sarah Johnson"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Follow-up Date
                </label>
                <div className="relative">
                  <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                  <input
                    type="date"
                    name="follow_up_date"
                    value={formData.follow_up_date}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                placeholder="Additional notes about the lead..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-secondary-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-secondary-300 text-secondary-700 rounded-xl hover:bg-secondary-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeadModal;
