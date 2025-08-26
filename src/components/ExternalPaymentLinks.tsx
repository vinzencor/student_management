import React, { useState, useEffect } from 'react';
import { Link, Copy, Eye, Clock, CheckCircle, XCircle, Search, Filter, Calendar, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PaymentLink {
  id: string;
  lead_id: string;
  link_token: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  student_name: string;
  student_class: string;
  course_name?: string;
  course_fee?: number;
  status: 'active' | 'used' | 'expired';
  expires_at: string;
  created_at: string;
  lead_first_name?: string;
  lead_last_name?: string;
  lead_email?: string;
  lead_phone?: string;
}

const ExternalPaymentLinks: React.FC = () => {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLink, setSelectedLink] = useState<PaymentLink | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchPaymentLinks();
  }, []);

  const fetchPaymentLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('active_payment_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching payment links:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = 
      link.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.parent_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.link_token.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || link.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Payment link copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy link. Please copy manually.');
    });
  };

  const getPaymentUrl = (token: string) => {
    // Update this with your actual domain
    return `${window.location.origin}/external-payment/${token}`;
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (isExpired && status === 'active') {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Expired</span>;
    }

    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium bg-success-100 text-success-800 rounded-full">Active</span>;
      case 'used':
        return <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">Used</span>;
      case 'expired':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Expired</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-secondary-100 text-secondary-800 rounded-full">{status}</span>;
    }
  };

  const handleViewDetails = (link: PaymentLink) => {
    setSelectedLink(link);
    setShowDetailsModal(true);
  };

  const regenerateLink = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('create_payment_link_for_lead', {
          p_lead_id: leadId,
          p_course_name: null,
          p_course_fee: null
        });

      if (error) throw error;

      if (data && data.length > 0) {
        const paymentUrl = data[0].payment_url;
        alert(`New payment link generated!\n\n${paymentUrl}`);
        fetchPaymentLinks(); // Refresh the list
      }
    } catch (error) {
      console.error('Error regenerating link:', error);
      alert('Failed to regenerate payment link. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-4 lg:p-6 shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-secondary-800">External Payment Links</h2>
          <p className="text-sm text-secondary-600 mt-1">Manage payment links for converted leads</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
          <input
            type="text"
            placeholder="Search by student name, parent name, email, or token..."
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
            className="pl-10 pr-8 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-600 font-medium">Total Links</p>
              <p className="text-2xl font-bold text-primary-800">{links.length}</p>
            </div>
            <Link className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-success-600 font-medium">Active</p>
              <p className="text-2xl font-bold text-success-800">
                {links.filter(l => l.status === 'active' && new Date(l.expires_at) > new Date()).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-success-600" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Used</p>
              <p className="text-2xl font-bold text-blue-800">
                {links.filter(l => l.status === 'used').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Expired</p>
              <p className="text-2xl font-bold text-red-800">
                {links.filter(l => l.status === 'expired' || (l.status === 'active' && new Date(l.expires_at) < new Date())).length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Links Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-secondary-200">
              <th className="text-left py-3 px-4 font-medium text-secondary-700">Student</th>
              <th className="text-left py-3 px-4 font-medium text-secondary-700">Parent</th>
              <th className="text-left py-3 px-4 font-medium text-secondary-700">Course</th>
              <th className="text-left py-3 px-4 font-medium text-secondary-700">Status</th>
              <th className="text-left py-3 px-4 font-medium text-secondary-700">Expires</th>
              <th className="text-left py-3 px-4 font-medium text-secondary-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLinks.map((link) => (
              <tr key={link.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                <td className="py-4 px-4">
                  <div>
                    <p className="font-medium text-secondary-800">{link.student_name}</p>
                    <p className="text-sm text-secondary-600">{link.student_class}</p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div>
                    <p className="font-medium text-secondary-800">{link.parent_name}</p>
                    <p className="text-sm text-secondary-600">{link.parent_email}</p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div>
                    <p className="font-medium text-secondary-800">{link.course_name || 'Not specified'}</p>
                    {link.course_fee && (
                      <p className="text-sm text-primary-600">QAR {link.course_fee.toLocaleString()}</p>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4">
                  {getStatusBadge(link.status, link.expires_at)}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-secondary-400" />
                    <span className="text-sm text-secondary-600">
                      {new Date(link.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDetails(link)}
                      className="text-primary-600 hover:text-primary-700 p-1 rounded-lg hover:bg-primary-50 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(getPaymentUrl(link.link_token))}
                      className="text-secondary-600 hover:text-secondary-700 p-1 rounded-lg hover:bg-secondary-50 transition-colors"
                      title="Copy Link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {(link.status === 'expired' || (link.status === 'active' && new Date(link.expires_at) < new Date())) && (
                      <button
                        onClick={() => regenerateLink(link.lead_id)}
                        className="text-success-600 hover:text-success-700 p-1 rounded-lg hover:bg-success-50 transition-colors"
                        title="Regenerate Link"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLinks.length === 0 && (
          <div className="text-center py-12">
            <Link className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-800 mb-2">No Payment Links Found</h3>
            <p className="text-secondary-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'No links match your current filters.' 
                : 'Payment links will appear here when leads are converted.'}
            </p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-large max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <h3 className="text-xl font-bold text-secondary-800">Payment Link Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-secondary-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-secondary-800 mb-3">Student Information</h4>
                  <div className="space-y-2">
                    <p><span className="text-secondary-600">Name:</span> {selectedLink.student_name}</p>
                    <p><span className="text-secondary-600">Class:</span> {selectedLink.student_class}</p>
                    {selectedLink.course_name && (
                      <p><span className="text-secondary-600">Course:</span> {selectedLink.course_name}</p>
                    )}
                    {selectedLink.course_fee && (
                      <p><span className="text-secondary-600">Fee:</span> QAR {selectedLink.course_fee.toLocaleString()}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-secondary-800 mb-3">Parent Information</h4>
                  <div className="space-y-2">
                    <p><span className="text-secondary-600">Name:</span> {selectedLink.parent_name}</p>
                    <p><span className="text-secondary-600">Email:</span> {selectedLink.parent_email}</p>
                    <p><span className="text-secondary-600">Phone:</span> {selectedLink.parent_phone}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-secondary-800 mb-3">Link Information</h4>
                <div className="space-y-2">
                  <p><span className="text-secondary-600">Status:</span> {getStatusBadge(selectedLink.status, selectedLink.expires_at)}</p>
                  <p><span className="text-secondary-600">Created:</span> {new Date(selectedLink.created_at).toLocaleString()}</p>
                  <p><span className="text-secondary-600">Expires:</span> {new Date(selectedLink.expires_at).toLocaleString()}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-secondary-600">Payment URL:</span>
                    <code className="bg-secondary-100 px-2 py-1 rounded text-sm flex-1">
                      {getPaymentUrl(selectedLink.link_token)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(getPaymentUrl(selectedLink.link_token))}
                      className="text-primary-600 hover:text-primary-700 p-1 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalPaymentLinks;
