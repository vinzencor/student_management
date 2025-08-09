import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, Edit, Trash2, UserCheck, UserX, Mail, Phone, Calendar, DollarSign } from 'lucide-react';
import { DataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission, getRoleDisplayName } from '../utils/roleUtils';
import type { Staff } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import AddStaffModal from './modals/AddStaffModal';
import EditStaffModal from './modals/EditStaffModal';

const StaffManagement: React.FC = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  useEffect(() => {
    fetchStaff();
  }, [roleFilter, statusFilter]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (roleFilter) filters.role = roleFilter;
      if (statusFilter) filters.status = statusFilter;
      
      const data = await DataService.getStaff(filters);
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (staffData: Omit<Staff, 'id' | 'created_at' | 'updated_at'>, password: string) => {
    try {
      await DataService.createStaffWithAuth(staffData, password);
      setShowAddModal(false);
      fetchStaff();
      alert(`Staff member ${staffData.first_name} ${staffData.last_name} created successfully!\nEmail: ${staffData.email}\nPassword: ${password}`);
    } catch (error) {
      console.error('Error adding staff:', error);
      alert('Failed to create staff member. Please try again.');
    }
  };

  const handleEditStaff = async (id: string, updates: Partial<Staff>) => {
    try {
      await DataService.updateStaff(id, updates);
      setShowEditModal(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (error) {
      console.error('Error updating staff:', error);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await DataService.deleteStaff(id);
        fetchStaff();
      } catch (error) {
        console.error('Error deleting staff:', error);
      }
    }
  };

  const handleStatusToggle = async (staffMember: Staff) => {
    const newStatus = staffMember.status === 'active' ? 'inactive' : 'active';
    await handleEditStaff(staffMember.id, { status: newStatus });
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = searchTerm === '' || 
      `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'terminated': return 'danger';
      default: return 'secondary';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'primary';
      case 'accountant': return 'success';
      case 'office_staff': return 'warning';
      case 'teacher': return 'secondary';
      default: return 'secondary';
    }
  };

  if (!hasPermission(user, 'manage_staff')) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-secondary-600">Access Denied</h2>
        <p className="text-secondary-500 mt-2">You don't have permission to manage staff.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="w-48 h-8 bg-secondary-200 rounded animate-pulse"></div>
          <div className="w-32 h-10 bg-secondary-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl border border-secondary-200 animate-pulse">
              <div className="w-full h-32 bg-secondary-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-800">Staff Management</h1>
          <p className="text-secondary-600 mt-1">Manage your team members and their roles</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-soft hover:shadow-medium"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Staff</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="accountant">Accountant</option>
            <option value="office_staff">Office Staff</option>
            <option value="teacher">Teacher</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </select>

          <div className="flex items-center space-x-2 text-sm text-secondary-600">
            <Users className="w-4 h-4" />
            <span>{filteredStaff.length} staff members</span>
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <div key={member.id} className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft hover:shadow-medium transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {member.first_name[0]}{member.last_name[0]}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-800">
                    {member.first_name} {member.last_name}
                  </h3>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full bg-${getRoleColor(member.role)}-100 text-${getRoleColor(member.role)}-700`}>
                    {getRoleDisplayName(member.role)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleStatusToggle(member)}
                  className={`p-2 rounded-lg transition-colors ${
                    member.status === 'active' 
                      ? 'text-success-600 hover:bg-success-50' 
                      : 'text-warning-600 hover:bg-warning-50'
                  }`}
                  title={member.status === 'active' ? 'Deactivate' : 'Activate'}
                >
                  {member.status === 'active' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={() => {
                    setSelectedStaff(member);
                    setShowEditModal(true);
                  }}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDeleteStaff(member.id)}
                  className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-secondary-600">
                <Mail className="w-4 h-4" />
                <span>{member.email}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-secondary-600">
                <Phone className="w-4 h-4" />
                <span>{member.phone}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-secondary-600">
                <Calendar className="w-4 h-4" />
                <span>Hired: {new Date(member.hire_date).toLocaleDateString()}</span>
              </div>
              
              {member.salary && (
                <div className="flex items-center space-x-2 text-sm text-secondary-600">
                  <DollarSign className="w-4 h-4" />
                  <span>${member.salary.toLocaleString()}/month</span>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${getStatusColor(member.status)}-100 text-${getStatusColor(member.status)}-700`}>
                  {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                </span>
                
                <span className="text-xs text-secondary-500">
                  {member.experience_years} years exp.
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-secondary-600 mb-2">No Staff Found</h3>
          <p className="text-secondary-500">
            {searchTerm || roleFilter || statusFilter 
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by adding your first staff member.'
            }
          </p>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddStaffModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddStaff}
        />
      )}

      {showEditModal && selectedStaff && (
        <EditStaffModal
          staff={selectedStaff}
          onClose={() => {
            setShowEditModal(false);
            setSelectedStaff(null);
          }}
          onSubmit={(updates) => handleEditStaff(selectedStaff.id, updates)}
        />
      )}
    </div>
  );
};

export default StaffManagement;
