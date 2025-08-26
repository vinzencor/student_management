import React, { useState, useEffect } from 'react';
import { Plus, User, Phone, Mail, Trash2, Filter, Calendar } from 'lucide-react';
import { DataService } from '../services/dataService';
import LeadDetailsModal from './modals/LeadDetailsModal';
import LeadContactModal from './modals/LeadContactModal';

interface LeadTriageProps {
  onAddLead?: () => void;
}

const LeadTriage: React.FC<LeadTriageProps> = ({ onAddLead }) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [leads, setLeads] = useState<{
    new: any[];
    contacted: any[];
    interested: any[];
    converted: any[];
    lost: any[];
  }>({
    new: [],
    contacted: [],
    interested: [],
    converted: [],
    lost: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  
  // Date filtering state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const allLeads = await DataService.getLeads();
      const groupedLeads = {
        new: allLeads?.filter(lead => lead.status === 'new') || [],
        contacted: allLeads?.filter(lead => lead.status === 'contacted') || [],
        interested: allLeads?.filter(lead => lead.status === 'interested') || [],
        converted: allLeads?.filter(lead => lead.status === 'converted') || [],
        lost: allLeads?.filter(lead => lead.status === 'lost') || []
      };
      setLeads(groupedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter leads by date range
  const filterLeadsByDate = (leadList: any[]) => {
    if (!startDate && !endDate) return leadList;
    
    return leadList.filter(lead => {
      const leadDate = new Date(lead.created_at);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && leadDate < start) return false;
      if (end && leadDate > end) return false;
      
      return true;
    });
  };

  const columns = [
    {
      id: 'new',
      title: 'New Inquiries',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      badgeColor: 'bg-primary-100 text-primary-800'
    },
    {
      id: 'contacted',
      title: 'Contacted',
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      badgeColor: 'bg-warning-100 text-warning-800'
    },
    {
      id: 'interested',
      title: 'Interested',
      bgColor: 'bg-secondary-50',
      borderColor: 'border-secondary-200',
      badgeColor: 'bg-secondary-100 text-secondary-800'
    },
    {
      id: 'converted',
      title: 'Converted',
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      badgeColor: 'bg-success-100 text-success-800'
    },
    {
      id: 'lost',
      title: 'Lost',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      badgeColor: 'bg-red-100 text-red-800'
    }
  ];

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedItem(leadId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', leadId);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedItem(null);
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
        await DataService.updateLead(draggedItem, { status: targetColumn as 'new' | 'contacted' | 'interested' | 'converted' | 'lost' });

        if (targetColumn === 'converted') {
          try {
            // Create receipt draft
            const { data: existing } = await (await import('../lib/supabase')).supabase
              .from('receipts')
              .select('id')
              .eq('lead_id', draggedItem)
              .limit(1)
              .maybeSingle();
            if (!existing) {
              await (await import('../lib/supabase')).supabase
                .from('receipts')
                .insert({ lead_id: draggedItem, amount: 0, tax_rate: 0, total_amount: 0, status: 'draft' });
            }

            // Generate external payment link
            const { data: linkData, error: linkError } = await (await import('../lib/supabase')).supabase
              .rpc('create_payment_link_for_lead', {
                p_lead_id: draggedItem,
                p_course_name: null,
                p_course_fee: null
              });

            if (linkError) {
              console.warn('Failed to create payment link:', linkError);
            } else if (linkData && linkData.length > 0) {
              const paymentUrl = linkData[0].payment_url;
              console.log('Payment link generated:', paymentUrl);

              // Show success message with payment link
              alert(`Lead converted successfully!\n\nExternal Payment Link:\n${paymentUrl}\n\nShare this link with the parent to submit payment information.`);
            }
          } catch (e) {
            console.warn('Failed to create receipt draft or payment link for converted lead', e);
          }
        }

        setLeads(prev => ({
          ...prev,
          [sourceColumn]: prev[sourceColumn as keyof typeof prev].filter(lead => lead.id !== draggedItem),
          [targetColumn]: [...prev[targetColumn as keyof typeof prev], { ...draggedLead, status: targetColumn }]
        }));
      } catch (error) {
        console.error('Error updating lead status:', error);
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

  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="h-screen flex flex-col bg-white">
        {/* Header with Filters */}
        <div className="flex-shrink-0 p-6 border-b border-secondary-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-secondary-800">Lead Triage</h1>
              <p className="text-secondary-600 mt-1">Drag leads between stages to update their status</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Date Filters */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-3 py-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm">Filters</span>
                </button>
                
                {onAddLead && (
                  <button
                    onClick={onAddLead}
                    className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Lead</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-secondary-600" />
                  <label className="text-sm font-medium text-secondary-700">From:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-1.5 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-secondary-700">To:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-1.5 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                {(startDate || endDate) && (
                  <button
                    onClick={clearDateFilters}
                    className="px-3 py-1.5 text-sm text-secondary-600 hover:text-secondary-800 underline"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Triage Board - Full Height */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full flex gap-4 overflow-x-auto">
            {columns.map(column => {
              const filteredLeads = filterLeadsByDate(leads[column.id as keyof typeof leads]);
              
              return (
                <div key={column.id} className="flex flex-col h-full min-w-[280px] flex-shrink-0">
                  <div className="flex items-center justify-between mb-4 px-2 flex-shrink-0">
                    <h3 className="font-semibold text-secondary-700 text-base">{column.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${column.badgeColor}`}>
                      {filteredLeads.length}
                    </span>
                  </div>

                  <div
                    className={`flex-1 ${column.bgColor} ${column.borderColor} border-2 border-dashed rounded-xl p-4 transition-all duration-200 hover:border-opacity-60 overflow-hidden`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                  >
                    <div className="h-full overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-secondary-300 scrollbar-track-transparent">
                      {filteredLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onDragEnd={handleDragEnd}
                          className="bg-white p-4 rounded-lg shadow-soft border border-secondary-200 cursor-move hover:shadow-medium transition-all duration-200 hover:scale-[1.02]"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-secondary-800 truncate">
                                  {lead.first_name} {lead.last_name}
                                </h4>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  lead.priority === 'hot' ? 'bg-red-100 text-red-700' :
                                  lead.priority === 'cold' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {lead.priority?.toUpperCase() || 'COLD'}
                                </span>
                              </div>
                              <p className="text-sm text-secondary-600 truncate">{lead.phone}</p>
                              {lead.email && (
                                <p className="text-xs text-secondary-500 truncate">{lead.email}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleContactClick(lead)}
                                className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Contact"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDetailsClick(lead)}
                                className="p-1.5 text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <User className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-xs text-secondary-400">
                              {new Date(lead.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDetailsModal && selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={closeModals}
          onUpdate={fetchLeads}
        />
      )}

      {showContactModal && selectedLead && (
        <LeadContactModal
          lead={selectedLead}
          onClose={closeModals}
          onUpdate={fetchLeads}
        />
      )}
    </>
  );
};

export default LeadTriage;
