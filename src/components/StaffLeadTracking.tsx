import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Phone, Mail, Calendar, User, CheckCircle, XCircle, AlertCircle, UserPlus, Search, Filter } from 'lucide-react';
import { DataService } from '../services/dataService';

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  status: 'new' | 'contacted' | 'interested' | 'converted' | 'lost';
  priority: 'hot' | 'cold' | 'lost';
  assigned_staff_id?: string;
  created_at: string;
  follow_up_date?: string;
}

interface StaffMetrics {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  interestedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  conversionRate: number;
}

const StaffLeadTracking: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [staffLeads, setStaffLeads] = useState<Lead[]>([]);
  const [staffMetrics, setStaffMetrics] = useState<StaffMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchStaff();
    fetchLeads();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await DataService.getStaff();
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const data = await DataService.getLeads();
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const calculateStaffMetrics = (staffId: string): StaffMetrics => {
    const staffLeads = leads.filter(lead => lead.assigned_staff_id === staffId);
    const totalLeads = staffLeads.length;
    
    const metrics = {
      totalLeads,
      newLeads: staffLeads.filter(lead => lead.status === 'new').length,
      contactedLeads: staffLeads.filter(lead => lead.status === 'contacted').length,
      interestedLeads: staffLeads.filter(lead => lead.status === 'interested').length,
      convertedLeads: staffLeads.filter(lead => lead.status === 'converted').length,
      lostLeads: staffLeads.filter(lead => lead.status === 'lost').length,
      conversionRate: totalLeads > 0 ? (staffLeads.filter(lead => lead.status === 'converted').length / totalLeads) * 100 : 0
    };

    return metrics;
  };

  const handleStaffClick = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    const assignedLeads = leads.filter(lead => lead.assigned_staff_id === staffMember.id);
    setStaffLeads(assignedLeads);
    setStaffMetrics(calculateStaffMetrics(staffMember.id));
  };

  const filteredStaffLeads = staffLeads.filter(lead => {
    const matchesSearch = lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.phone.includes(searchTerm);
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
      case 'new': return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'contacted': return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'interested': return 'bg-secondary-100 text-secondary-800 border-secondary-200';
      case 'converted': return 'bg-success-100 text-success-800 border-success-200';
      case 'lost': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-secondary-100 text-secondary-800 border-secondary-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800">Staff Lead Tracking</h1>
          <p className="text-secondary-600 mt-1">Monitor staff performance and lead assignments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-secondary-200 shadow-soft">
            <div className="p-4 border-b border-secondary-200">
              <h2 className="text-lg font-semibold text-secondary-800">Staff Members</h2>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {staff.map((staffMember) => {
                const metrics = calculateStaffMetrics(staffMember.id);
                return (
                  <div
                    key={staffMember.id}
                    onClick={() => handleStaffClick(staffMember)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-medium ${
                      selectedStaff?.id === staffMember.id
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-secondary-200 hover:border-secondary-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-secondary-800">
                          {staffMember.first_name} {staffMember.last_name}
                        </h3>
                        <p className="text-sm text-secondary-600 capitalize">{staffMember.role.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary-600">{metrics.totalLeads}</div>
                        <div className="text-xs text-secondary-500">Total Leads</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="text-success-600">
                          <span className="font-medium">{metrics.convertedLeads}</span> converted
                        </div>
                        <div className="text-red-600">
                          <span className="font-medium">{metrics.lostLeads}</span> lost
                        </div>
                      </div>
                      <div className="text-primary-600 font-medium">
                        {metrics.conversionRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {staff.length === 0 && (
                <div className="text-center py-8 text-secondary-500">
                  No staff members found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Staff Details and Leads */}
        <div className="lg:col-span-2">
          {selectedStaff ? (
            <div className="space-y-6">
              {/* Staff Metrics */}
              <div className="bg-white rounded-xl border border-secondary-200 shadow-soft p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-secondary-800">
                      {selectedStaff.first_name} {selectedStaff.last_name}
                    </h2>
                    <p className="text-secondary-600 capitalize">{selectedStaff.role.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">{staffMetrics?.conversionRate.toFixed(1)}%</div>
                    <div className="text-sm text-secondary-600">Conversion Rate</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-primary-50 rounded-lg">
                    <div className="text-lg font-bold text-primary-600">{staffMetrics?.newLeads}</div>
                    <div className="text-xs text-secondary-600">New</div>
                  </div>
                  <div className="text-center p-3 bg-warning-50 rounded-lg">
                    <div className="text-lg font-bold text-warning-600">{staffMetrics?.contactedLeads}</div>
                    <div className="text-xs text-secondary-600">Contacted</div>
                  </div>
                  <div className="text-center p-3 bg-secondary-50 rounded-lg">
                    <div className="text-lg font-bold text-secondary-600">{staffMetrics?.interestedLeads}</div>
                    <div className="text-xs text-secondary-600">Interested</div>
                  </div>
                  <div className="text-center p-3 bg-success-50 rounded-lg">
                    <div className="text-lg font-bold text-success-600">{staffMetrics?.convertedLeads}</div>
                    <div className="text-xs text-secondary-600">Converted</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">{staffMetrics?.lostLeads}</div>
                    <div className="text-xs text-secondary-600">Lost</div>
                  </div>
                </div>
              </div>

              {/* Assigned Leads */}
              <div className="bg-white rounded-xl border border-secondary-200 shadow-soft">
                <div className="p-4 border-b border-secondary-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-lg font-semibold text-secondary-800">
                      Assigned Leads ({staffLeads.length})
                    </h3>
                    
                    <div className="flex gap-3">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                        <input
                          type="text"
                          placeholder="Search leads..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 pr-4 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

                <div className="p-4">
                  {filteredStaffLeads.length > 0 ? (
                    <div className="space-y-3">
                      {filteredStaffLeads.map((lead) => (
                        <div key={lead.id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div>
                              <div className="font-semibold text-secondary-800">
                                {lead.first_name} {lead.last_name}
                              </div>
                              <div className="text-sm text-secondary-600">
                                {lead.phone} {lead.email && `• ${lead.email}`}
                              </div>
                              <div className="text-xs text-secondary-500">
                                Created: {new Date(lead.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              lead.priority === 'hot' ? 'bg-red-100 text-red-700' :
                              lead.priority === 'cold' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {lead.priority?.toUpperCase()}
                            </span>
                            
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(lead.status)}`}>
                              {getStatusIcon(lead.status)}
                              <span className="capitalize">{lead.status}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-secondary-500">
                      {staffLeads.length === 0 ? 'No leads assigned to this staff member' : 'No leads match the current filters'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-secondary-200 shadow-soft p-12 text-center">
              <Users className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-600 mb-2">Select a Staff Member</h3>
              <p className="text-secondary-500">Choose a staff member from the list to view their lead assignments and performance metrics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffLeadTracking;
