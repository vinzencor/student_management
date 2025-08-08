import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  MapPin,
  Clock,
  TrendingUp,
  UserPlus,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { DataService } from '../services/dataService';
import type { Lead } from '../lib/supabase';
import AddLeadModal from './modals/AddLeadModal';

const LeadManagement: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await DataService.getLeads();
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <UserPlus className="w-4 h-4" />;
      case 'contacted': return <Phone className="w-4 h-4" />;
      case 'interested': return <TrendingUp className="w-4 h-4" />;
      case 'converted': return <CheckCircle className="w-4 h-4" />;
      case 'lost': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-primary-100 text-primary-700 border-primary-200';
      case 'contacted': return 'bg-warning-100 text-warning-700 border-warning-200';
      case 'interested': return 'bg-success-100 text-success-700 border-success-200';
      case 'converted': return 'bg-success-100 text-success-700 border-success-200';
      case 'lost': return 'bg-danger-100 text-danger-700 border-danger-200';
      default: return 'bg-secondary-100 text-secondary-700 border-secondary-200';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'website': return '🌐';
      case 'referral': return '👥';
      case 'social_media': return '📱';
      case 'walk_in': return '🚶';
      default: return '📞';
    }
  };

  const leadStats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    interested: leads.filter(l => l.status === 'interested').length,
    converted: leads.filter(l => l.status === 'converted').length,
    lost: leads.filter(l => l.status === 'lost').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="w-48 h-8 bg-secondary-200 rounded animate-pulse"></div>
          <div className="w-32 h-10 bg-secondary-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white p-4 rounded-xl border border-secondary-200 animate-pulse">
              <div className="w-full h-16 bg-secondary-200 rounded"></div>
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-xl border border-secondary-200 p-6 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-full h-16 bg-secondary-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800">Lead Management</h1>
          <p className="text-secondary-600 mt-1">Track and manage your student inquiries</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-soft hover:shadow-medium"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add New Lead</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Total Leads</p>
              <p className="text-2xl font-bold text-secondary-800">{leadStats.total}</p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">New</p>
              <p className="text-2xl font-bold text-primary-600">{leadStats.new}</p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Contacted</p>
              <p className="text-2xl font-bold text-warning-600">{leadStats.contacted}</p>
            </div>
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Interested</p>
              <p className="text-2xl font-bold text-success-600">{leadStats.interested}</p>
            </div>
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">Converted</p>
              <p className="text-2xl font-bold text-success-600">{leadStats.converted}</p>
            </div>
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-soft">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              placeholder="Search leads by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 border-b border-secondary-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Lead</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Contact</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Source</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Counselor</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Follow-up</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-secondary-50 transition-colors">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-semibold text-secondary-800">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <p className="text-sm text-secondary-600">{lead.grade_level}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-secondary-400" />
                        <span className="text-sm text-secondary-700">{lead.phone}</span>
                      </div>
                      {lead.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-secondary-400" />
                          <span className="text-sm text-secondary-700">{lead.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getSourceIcon(lead.source)}</span>
                      <span className="text-sm text-secondary-700 capitalize">{lead.source.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(lead.status)}`}>
                      {getStatusIcon(lead.status)}
                      <span className="capitalize">{lead.status}</span>
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-secondary-700">{lead.assigned_counselor || 'Unassigned'}</span>
                  </td>
                  <td className="py-4 px-6">
                    {lead.follow_up_date ? (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-secondary-400" />
                        <span className="text-sm text-secondary-700">
                          {new Date(lead.follow_up_date).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-secondary-500">No follow-up</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-600 mb-2">No leads found</h3>
            <p className="text-secondary-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onLeadAdded={fetchLeads}
      />
    </div>
  );
};

export default LeadManagement;
