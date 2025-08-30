import React, { useState, useEffect, useRef } from 'react';
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
  XCircle,
  Download,
  CalendarRange,
  Trash2,
  Users,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { DataService } from '../services/dataService';
import type { Lead } from '../lib/supabase';
import AddLeadModal from './modals/AddLeadModal';
import LeadDetailsModal from './modals/LeadDetailsModal';

const LeadManagement: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLeads();
    fetchStaff();
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

  const fetchStaff = async () => {
    try {
      const data = await DataService.getStaff();
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const downloadLeadReport = async () => {
    try {
      setDownloading(true);

      // Filter leads based on date range and other filters
      const filteredData = filteredLeads.filter(lead => {
        if (!startDate && !endDate) return true;

        const leadDate = new Date(lead.created_at);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && leadDate < start) return false;
        if (end && leadDate > end) return false;

        return true;
      });

      // Create CSV content
      const headers = ['Name', 'Phone', 'Email', 'Status', 'Source', 'Subjects Interested', 'Created Date', 'Notes'];
      const csvContent = [
        headers.join(','),
        ...filteredData.map(lead => [
          `"${lead.first_name} ${lead.last_name}"`,
          `"${lead.phone}"`,
          `"${lead.email || ''}"`,
          `"${lead.status}"`,
          `"${lead.source || ''}"`,
          `"${Array.isArray(lead.subjects_interested) ? lead.subjects_interested.join('; ') : ''}"`,
          `"${new Date(lead.created_at).toLocaleDateString()}"`,
          `"${lead.notes || ''}"`
        ].join(','))
      ].join('\n');

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `lead-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error downloading report:', error);
    } finally {
      setDownloading(false);
    }
  };

  const mapSourceValue = (source: string): 'website' | 'referral' | 'social_media' | 'walk_in' | 'other' => {
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('website') || lowerSource.includes('online')) return 'website';
    if (lowerSource.includes('referral') || lowerSource.includes('refer')) return 'referral';
    if (lowerSource.includes('social') || lowerSource.includes('facebook') || lowerSource.includes('instagram')) return 'social_media';
    if (lowerSource.includes('walk') || lowerSource.includes('visit')) return 'walk_in';
    return 'other';
  };

  const mapStatusValue = (status: string): 'new' | 'contacted' | 'interested' | 'converted' | 'lost' => {
    // For imported leads, we want them all to start as 'new' so they appear in new enquiry section
    // Only map to other statuses if explicitly specified
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'contacted') return 'contacted';
    if (lowerStatus === 'converted') return 'converted';
    if (lowerStatus === 'lost') return 'lost';
    // Default all imported leads to 'new' status (including 'interested', 'hot', 'cold', etc.)
    return 'new';
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      alert('Please upload a CSV or Excel file');
      return;
    }

    try {
      setImporting(true);
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        alert('File must contain at least a header row and one data row');
        return;
      }

      // Parse CSV with better handling of quoted values
      const parseCSVLine = (line: string): string[] => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]);
      const dataRows = lines.slice(1);

      const importedLeads = [];

      for (const row of dataRows) {
        const values = parseCSVLine(row);

        if (values.length < 2) continue; // Skip rows with less than 2 values (need at least first_name, last_name)

        const leadData: any = {};
        headers.forEach((header, index) => {
          leadData[header] = values[index] || '';
        });

        // Validate required fields
        if (!leadData.first_name || !leadData.last_name || !leadData.first_name.trim() || !leadData.last_name.trim()) {
          console.warn('Skipping row - missing or empty first_name or last_name:', leadData);
          continue;
        }

        // Map the data to our lead structure (only fields that exist in database)
        const lead = {
          first_name: leadData.first_name.trim(),
          last_name: leadData.last_name.trim(),
          email: leadData.email ? leadData.email.trim() : undefined,
          phone: leadData.phone ? leadData.phone.trim() : '',
          grade_level: leadData.grade_level ? leadData.grade_level.trim() : undefined,
          subjects_interested: leadData.subjects_interested ?
            leadData.subjects_interested.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean) : [],
          source: mapSourceValue(leadData.source || 'other'),
          status: mapStatusValue(leadData.status || 'new'),
          notes: [
            leadData.remarks || '',
            leadData.parent_name ? `Parent: ${leadData.parent_name}` : '',
            leadData.parent_phone ? `Parent Phone: ${leadData.parent_phone}` : '',
            leadData.parent_email ? `Parent Email: ${leadData.parent_email}` : '',
            leadData.address ? `Address: ${leadData.address}` : ''
          ].filter(Boolean).join(' | '),
          priority: 'cold' as const,
          tags: [],
          assigned_staff_id: undefined,
          assigned_counselor: undefined,
          follow_up_date: undefined
        };

        importedLeads.push(lead);
      }

      if (importedLeads.length === 0) {
        alert('No valid lead data found in the file');
        return;
      }

      // Save leads to database
      for (const lead of importedLeads) {
        await DataService.createLead(lead);
      }

      alert(`Successfully imported ${importedLeads.length} leads!`);
      await fetchLeads(); // Refresh the leads list

    } catch (error) {
      console.error('Error importing leads:', error);
      alert('Error importing leads. Please check the file format.');
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      'first_name,last_name,email,phone,grade_level,subjects_interested,source,status,remarks,parent_name,parent_phone,parent_email,address',
      'Ahmed,Ali,ahmed.ali@email.com,+974-1234-5678,Grade 10,Mathematics;Physics;Chemistry,website,new,Interested in science subjects,Mohammed Ali,+974-9876-5432,mohammed.ali@email.com,Doha Qatar',
      'Sara,Khan,sara.khan@email.com,+974-2345-6789,Grade 9,English;Arabic;History,social_media,new,Looking for language courses,Fatima Khan,+974-8765-4321,fatima.khan@email.com,Al Rayyan Qatar',
      'Omar,Hassan,omar.hassan@email.com,+974-3456-7890,Grade 11,Computer Science;Mathematics,referral,new,Wants to pursue engineering,Hassan Omar,+974-7654-3210,hassan.omar@email.com,Al Wakrah Qatar'
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample-leads-import-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
      lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesStaff = staffFilter === 'all' || lead.assigned_staff_id === staffFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

    // Date range filtering
    let matchesDateRange = true;
    if (startDate || endDate) {
      const leadDate = new Date(lead.created_at);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && leadDate < start) matchesDateRange = false;
      if (end && leadDate > end) matchesDateRange = false;
    }

    return matchesSearch && matchesStatus && matchesStaff && matchesSource && matchesDateRange;
  });

  // Bulk assignment and delete functions
  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  const handleBulkAssignStaff = async (staffId: string) => {
    try {
      await Promise.all(
        selectedLeads.map(leadId =>
          DataService.updateLead(leadId, { assigned_staff_id: staffId })
        )
      );
      setSelectedLeads([]);
      setShowBulkAssign(false);
      fetchLeads();
      alert(`Successfully assigned ${selectedLeads.length} leads to staff member.`);
    } catch (error) {
      console.error('Error assigning leads:', error);
      alert('Failed to assign leads. Please try again.');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await DataService.deleteLead(leadId);
        fetchLeads();
        alert('Lead deleted successfully.');
      } catch (error) {
        console.error('Error deleting lead:', error);
        alert('Failed to delete lead. Please try again.');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedLeads.length} selected leads?`)) {
      try {
        await Promise.all(
          selectedLeads.map(leadId => DataService.deleteLead(leadId))
        );
        setSelectedLeads([]);
        fetchLeads();
        alert(`Successfully deleted ${selectedLeads.length} leads.`);
      } catch (error) {
        console.error('Error deleting leads:', error);
        alert('Failed to delete leads. Please try again.');
      }
    }
  };

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
        <div className="flex items-center space-x-3">
          {/* Import Buttons */}
          <button
            onClick={downloadSampleTemplate}
            className="flex items-center space-x-2 bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-soft hover:shadow-medium"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="font-medium">Download Template</span>
          </button>

          <button
            onClick={handleImportClick}
            disabled={importing}
            className="flex items-center space-x-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-soft hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-5 h-5" />
            <span className="font-medium">
              {importing ? 'Importing...' : 'Import Leads'}
            </span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-soft hover:shadow-medium"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add New Lead</span>
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
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
        <div className="flex flex-col gap-4">
          {/* First Row - Search, Status, Staff, and Source */}
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
                className="pl-10 pr-8 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div className="relative">
              <Users className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-[140px]"
              >
                <option value="all">All Staff</option>
                {staff.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <MapPin className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white min-w-[140px]"
              >
                <option value="all">All Sources</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social_media">Social Media</option>
                <option value="walk_in">Walk-in</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Second Row - Date Range and Download */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-secondary-700 mb-1">Start Date</label>
                <div className="relative">
                  <CalendarRange className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-secondary-700 mb-1">End Date</label>
                <div className="relative">
                  <CalendarRange className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={downloadLeadReport}
              disabled={downloading}
              className="flex items-center space-x-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              <span>{downloading ? 'Downloading...' : 'Download Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedLeads.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-primary-700">
                {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setShowBulkAssign(!showBulkAssign)}
                className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Assign to Staff</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected</span>
              </button>
            </div>
            <button
              onClick={() => setSelectedLeads([])}
              className="text-secondary-600 hover:text-secondary-800 text-sm"
            >
              Clear Selection
            </button>
          </div>

          {showBulkAssign && (
            <div className="mt-3 pt-3 border-t border-primary-200">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-primary-700">Assign to:</span>
                <select
                  onChange={(e) => e.target.value && handleBulkAssignStaff(e.target.value)}
                  className="px-3 py-1.5 border border-primary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  defaultValue=""
                >
                  <option value="">Select Staff Member</option>
                  {staff.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-secondary-200 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 border-b border-secondary-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                  />
                </th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Lead</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Contact</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Source</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Assigned Staff</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Follow-up</th>
                <th className="text-left py-4 px-6 font-semibold text-secondary-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-secondary-50 transition-colors">
                  <td className="py-4 px-6">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => handleSelectLead(lead.id)}
                      className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                    />
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-secondary-800">
                          {lead.first_name} {lead.last_name}
                        </p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          lead.priority === 'hot' ? 'bg-red-100 text-red-700' :
                          lead.priority === 'cold' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {lead.priority?.toUpperCase() || 'COLD'}
                        </span>
                      </div>
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
                    <span className="text-sm text-secondary-700">
                      {lead.assigned_staff_id
                        ? staff.find(s => s.id === lead.assigned_staff_id)?.first_name + ' ' + staff.find(s => s.id === lead.assigned_staff_id)?.last_name
                        : 'Unassigned'
                      }
                    </span>
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
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowDetailsModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-red-600 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

      {/* Lead Details Modal */}
      {selectedLead && (
        <LeadDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onLeadUpdated={fetchLeads}
        />
      )}
    </div>
  );
};

export default LeadManagement;
