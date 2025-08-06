import React, { useState, useEffect } from 'react';
import { Plus, User, Phone, Mail } from 'lucide-react';
import { DataService } from '../../services/dataService';

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
        await DataService.updateLead(draggedItem, { status: targetColumn });

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

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <div className="w-32 h-6 bg-secondary-200 rounded animate-pulse"></div>
          <div className="w-24 h-8 bg-secondary-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-4">
              <div className="w-full h-20 bg-secondary-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-secondary-800">Lead Pipeline</h2>
        <button
          onClick={onAddLead}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl transition-colors shadow-soft hover:shadow-medium"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Lead</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">{column.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${column.badgeColor}`}>
                {leads[column.id as keyof typeof leads].length}
              </span>
            </div>

            <div
              className={`min-h-96 ${column.bgColor} ${column.borderColor} border-2 border-dashed rounded-xl p-4 transition-colors`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="space-y-3">
                {leads[column.id as keyof typeof leads].map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-move hover:shadow-md transition-all duration-200 hover:scale-102"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-secondary-800 text-sm">
                            {lead.first_name} {lead.last_name}
                          </h4>
                          <p className="text-xs text-secondary-600">
                            {lead.subjects_interested?.join(', ') || 'No subjects specified'}
                          </p>
                        </div>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-primary-500" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-xs text-secondary-600">
                        <Phone className="w-3 h-3" />
                        <span>{lead.phone}</span>
                      </div>
                      {lead.email && (
                        <div className="flex items-center space-x-2 text-xs text-secondary-600">
                          <Mail className="w-3 h-3" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-secondary-100">
                      <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                        Contact
                      </button>
                      <button className="text-xs text-secondary-500 hover:text-secondary-700">
                        Details
                      </button>
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
};

export default LeadPipeline;