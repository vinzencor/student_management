import React, { useState } from 'react';
import { X, User, Mail, Phone, Calendar, MapPin, BookOpen, UserCheck, FileText, Clock, Edit, Trash2, Save } from 'lucide-react';
import { DataService } from '../../services/dataService';

interface LeadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onLeadUpdated?: () => void;
}

const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ isOpen, onClose, lead, onLeadUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    first_name: lead?.first_name || '',
    last_name: lead?.last_name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    address: lead?.address || '',
    subjects_interested: lead?.subjects_interested || [],
    notes: lead?.notes || '',
    source: lead?.source || 'walk_in'
  });
  if (!isOpen || !lead) return null;

  const handleEdit = () => {
    setEditData({
      first_name: lead.first_name || '',
      last_name: lead.last_name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      address: lead.address || '',
      subjects_interested: lead.subjects_interested || [],
      notes: lead.notes || '',
      source: lead.source || 'walk_in'
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await DataService.updateLead(lead.id, editData);
      setIsEditing(false);
      onLeadUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error updating lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await DataService.deleteLead(lead.id);
      onLeadUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error deleting lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'contacted': return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'interested': return 'bg-secondary-100 text-secondary-800 border-secondary-200';
      case 'converted': return 'bg-success-100 text-success-800 border-success-200';
      case 'lost': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-secondary-100 text-secondary-800 border-secondary-200';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'website': return '🌐';
      case 'referral': return '👥';
      case 'social_media': return '📱';
      case 'walk_in': return '🚶';
      default: return '📋';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-secondary-200 flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1 mr-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg lg:text-xl font-bold text-secondary-800 truncate">
                {lead.first_name} {lead.last_name}
              </h2>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)} mt-1`}>
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center space-x-1 bg-success-600 hover:bg-success-700 text-white px-3 py-2 rounded-xl transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 border border-secondary-300 text-secondary-700 rounded-xl hover:bg-secondary-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="flex items-center space-x-1 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-xl transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary-100 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-secondary-500" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Contact Information */}
          <div className="bg-secondary-50 rounded-xl p-3 lg:p-4">
            <h3 className="text-base lg:text-lg font-semibold text-secondary-800 mb-3 lg:mb-4 flex items-center">
              <Phone className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-primary-600" />
              Contact Information
            </h3>

            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={editData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={editData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs lg:text-sm text-secondary-600">Phone</p>
                    <p className="font-medium text-secondary-800 text-sm lg:text-base break-all">{lead.phone}</p>
                  </div>
                </div>
                {lead.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs lg:text-sm text-secondary-600">Email</p>
                      <p className="font-medium text-secondary-800 text-sm lg:text-base break-all">{lead.email}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lead Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Basic Info */}
            <div className="space-y-3 lg:space-y-4">
              <h3 className="text-base lg:text-lg font-semibold text-secondary-800 flex items-center">
                <User className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-primary-600" />
                Lead Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getSourceIcon(lead.source)}</span>
                  <div>
                    <p className="text-sm text-secondary-600">Source</p>
                    <p className="font-medium text-secondary-800 capitalize">
                      {lead.source.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {lead.grade_level && (
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-4 h-4 text-secondary-500" />
                    <div>
                      <p className="text-sm text-secondary-600">Grade Level</p>
                      <p className="font-medium text-secondary-800">{lead.grade_level}</p>
                    </div>
                  </div>
                )}

                {lead.assigned_counselor && (
                  <div className="flex items-center space-x-3">
                    <UserCheck className="w-4 h-4 text-secondary-500" />
                    <div>
                      <p className="text-sm text-secondary-600">Assigned Counselor</p>
                      <p className="font-medium text-secondary-800">{lead.assigned_counselor}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3 lg:space-y-4">
              <h3 className="text-base lg:text-lg font-semibold text-secondary-800 flex items-center">
                <Clock className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-primary-600" />
                Timeline
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-secondary-500" />
                  <div>
                    <p className="text-sm text-secondary-600">Created</p>
                    <p className="font-medium text-secondary-800">
                      {new Date(lead.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-secondary-500" />
                  <div>
                    <p className="text-sm text-secondary-600">Last Updated</p>
                    <p className="font-medium text-secondary-800">
                      {new Date(lead.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {lead.follow_up_date && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-warning-500" />
                    <div>
                      <p className="text-sm text-secondary-600">Follow-up Date</p>
                      <p className="font-medium text-warning-700">
                        {new Date(lead.follow_up_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subjects Interested */}
          {lead.subjects_interested && lead.subjects_interested.length > 0 && (
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-secondary-800 mb-3 flex items-center">
                <BookOpen className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-primary-600" />
                Subjects of Interest
              </h3>
              <div className="flex flex-wrap gap-2">
                {lead.subjects_interested.map((subject: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 lg:px-3 lg:py-1 bg-primary-100 text-primary-800 rounded-full text-xs lg:text-sm font-medium"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-secondary-800 mb-3 flex items-center">
                <FileText className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-primary-600" />
                Notes
              </h3>
              <div className="bg-secondary-50 rounded-xl p-3 lg:p-4">
                <p className="text-secondary-700 whitespace-pre-wrap text-sm lg:text-base">{lead.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 lg:p-6 border-t border-secondary-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-secondary-600 hover:text-secondary-800 font-medium transition-colors text-sm lg:text-base order-2 sm:order-1"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors text-sm lg:text-base order-1 sm:order-2">
            Edit Lead
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailsModal;
