import React, { useState, useEffect } from 'react';
import { Plus, User, Phone, Mail } from 'lucide-react';
import { DataService } from '../../services/dataService';
import LeadDetailsModal from '../modals/LeadDetailsModal';
import LeadContactModal from '../modals/LeadContactModal';

interface LeadPipelineProps {
  onAddLead: () => void;
}

const LeadPipeline: React.FC<LeadPipelineProps> = ({ onAddLead }) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [leads, setLeads] = useState<{
    new: any[];
    contacted: any[];
    interested: any[];
    converted: any[];
  }>({
    new: [],
    contacted: [],
    interested: [],
    converted: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const allLeads = await DataService.getLeads();

      // Group leads by status
      const groupedLeads = {
        new: allLeads?.filter(lead => lead.status === 'new') || [],
        contacted: allLeads?.filter(lead => lead.status === 'contacted') || [],
        interested: allLeads?.filter(lead => lead.status === 'interested') || [],
        converted: allLeads?.filter(lead => lead.status === 'converted') || []
      };

      setLeads(groupedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      id: 'new',
      title: 'New Inquiries',
      color: 'blue',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      badgeColor: 'bg-primary-100 text-primary-800'
    },
    {
      id: 'contacted',
      title: 'Contacted',
      color: 'orange',
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      badgeColor: 'bg-warning-100 text-warning-800'
    },
    {
      id: 'interested',
      title: 'Interested',
      color: 'purple',
      bgColor: 'bg-secondary-50',
      borderColor: 'border-secondary-200',
      badgeColor: 'bg-secondary-100 text-secondary-800'
    },
    {
      id: 'converted',
      title: 'Converted',
      color: 'green',
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      badgeColor: 'bg-success-100 text-success-800'
    }
  ];



  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedItem(leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    const sourceColumn = Object.keys(leads).find(col =>
      leads[col as keyof typeof leads].some(lead => lead.id === draggedItem)
    );

    if (sourceColumn && sourceColumn !== targetColumn) {
      const draggedLead = leads[sourceColumn as keyof typeof leads].find(lead => lead.id === draggedItem);
      if (!draggedLead) return;

      try {
        // Update lead status in database
        await DataService.updateLead(draggedItem, { status: targetColumn as any });

        // When moved to converted, auto-create receipt draft if not exists
        if (targetColumn === 'converted') {
          try {
            const { data: existing } = await (await import('../../lib/supabase')).supabase
              .from('receipts')
              .select('id')
              .eq('lead_id', draggedItem)
              .limit(1)
              .maybeSingle();
            if (!existing) {
              await (await import('../../lib/supabase')).supabase
                .from('receipts')
                .insert({ lead_id: draggedItem, amount: 0, tax_rate: 0, total_amount: 0, status: 'draft' });
            }
          } catch (e) {
            console.warn('Failed to create receipt draft for converted lead', e);
          }
        }

        // Update local state
        setLeads(prev => ({
          ...prev,
          [sourceColumn]: prev[sourceColumn as keyof typeof prev].filter(lead => lead.id !== draggedItem),
          [targetColumn]: [...prev[targetColumn as keyof typeof prev], { ...draggedLead, status: targetColumn }]
        }));
      } catch (error) {
        console.error('Error updating lead status:', error);
        // Optionally show error message to user
      }
    }

    setDraggedItem(null);
  };

  const handleContactClick = (lead: any) => {
    setSelectedLead(lead);
    setShowContactModal(true);
  };

  const handleDetailsClick = (lead: any) => {
    setSelectedLead(lead);
    setShowDetailsModal(true);
  };

  const closeModals = () => {
    setSelectedLead(null);
    setShowDetailsModal(false);
    setShowContactModal(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-secondary-200 p-4 lg:p-6 shadow-soft">
        {/* Loading Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="w-32 lg:w-40 h-6 lg:h-7 bg-secondary-200 rounded animate-pulse"></div>
            <div className="w-48 lg:w-64 h-4 bg-secondary-200 rounded animate-pulse mt-2"></div>
          </div>
          <div className="w-full sm:w-24 h-10 bg-secondary-200 rounded-xl animate-pulse"></div>
        </div>

        {/* Loading Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="w-20 h-4 bg-secondary-200 rounded animate-pulse"></div>
                <div className="w-6 h-6 bg-secondary-200 rounded-full animate-pulse"></div>
              </div>
              <div className="min-h-[400px] lg:min-h-[500px] bg-secondary-100 rounded-xl p-3 lg:p-4">
                <div className="space-y-3">
                  {[1, 2].map(j => (
                    <div key={j} className="bg-white p-3 lg:p-4 rounded-xl">
                      <div className="flex items-start space-x-2 mb-3">
                        <div className="w-8 h-8 bg-secondary-200 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="w-24 h-4 bg-secondary-200 rounded animate-pulse"></div>
                          <div className="w-32 h-3 bg-secondary-200 rounded animate-pulse mt-2"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-28 h-3 bg-secondary-200 rounded animate-pulse"></div>
                        <div className="w-36 h-3 bg-secondary-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-4 lg:p-6 shadow-soft">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-secondary-800">Lead Pipeline</h2>
          <p className="text-sm text-secondary-600 mt-1">Drag leads between stages to update their status</p>
        </div>
        <button
          onClick={onAddLead}
          className="flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl transition-all duration-200 shadow-soft hover:shadow-medium hover:scale-105 active:scale-95 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Lead</span>
        </button>
      </div>

      {/* Pipeline Grid */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-semibold text-secondary-700 text-sm lg:text-base truncate">
                {column.title}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${column.badgeColor} flex-shrink-0`}>
                {leads[column.id as keyof typeof leads].length}
              </span>
            </div>

            {/* Drop Zone */}
            <div
              className={`flex-1 min-h-[400px] lg:min-h-[500px] ${column.bgColor} ${column.borderColor} border-2 border-dashed rounded-xl p-3 lg:p-4 transition-all duration-200 hover:border-opacity-60`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="space-y-3">
                {leads[column.id as keyof typeof leads].map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="bg-white p-3 lg:p-4 rounded-xl shadow-sm border border-secondary-100 cursor-move hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                  >
                    {/* Lead Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-2 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-secondary-800 text-sm leading-tight truncate">
                            {lead.first_name} {lead.last_name}
                          </h4>
                          <p className="text-xs text-secondary-600 mt-1 line-clamp-2">
                            {lead.subjects_interested?.length > 0
                              ? lead.subjects_interested.join(', ')
                              : 'No subjects specified'}
                          </p>
                        </div>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-primary-500 flex-shrink-0 ml-2" />
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center space-x-2 text-xs text-secondary-600">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{lead.phone}</span>
                      </div>
                      {lead.email && (
                        <div className="flex items-center space-x-2 text-xs text-secondary-600">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-3 border-t border-secondary-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactClick(lead);
                        }}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors hover:underline"
                      >
                        Contact
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDetailsClick(lead);
                        }}
                        className="text-xs text-secondary-500 hover:text-secondary-700 transition-colors hover:underline"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}

                {/* Empty State for Column */}
                {leads[column.id as keyof typeof leads].length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center mb-3">
                      <User className="w-6 h-6 text-secondary-400" />
                    </div>
                    <p className="text-sm text-secondary-500 font-medium">No leads yet</p>
                    <p className="text-xs text-secondary-400 mt-1">Drag leads here or add new ones</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <LeadDetailsModal
        isOpen={showDetailsModal}
        onClose={closeModals}
        lead={selectedLead}
      />

      <LeadContactModal
        isOpen={showContactModal}
        onClose={closeModals}
        lead={selectedLead}
      />
    </div>
  );
};

export default LeadPipeline;