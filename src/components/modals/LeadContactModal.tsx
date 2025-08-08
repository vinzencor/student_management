import React from 'react';
import { X, Phone, Mail, MessageCircle, ExternalLink } from 'lucide-react';

interface LeadContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
}

const LeadContactModal: React.FC<LeadContactModalProps> = ({ isOpen, onClose, lead }) => {
  if (!isOpen || !lead) return null;

  const handlePhoneClick = () => {
    window.open(`tel:${lead.phone}`, '_self');
  };

  const handleEmailClick = () => {
    window.open(`mailto:${lead.email}`, '_self');
  };

  const handleSMSClick = () => {
    window.open(`sms:${lead.phone}`, '_self');
  };

  const handleWhatsAppClick = () => {
    // Remove any non-numeric characters from phone number
    const cleanPhone = lead.phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Hi ${lead.first_name}, this is regarding your inquiry about our courses at EduCare. How can we help you today?`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-secondary-200 flex-shrink-0">
          <div className="min-w-0 flex-1 mr-4">
            <h2 className="text-lg lg:text-xl font-bold text-secondary-800 truncate">Contact Lead</h2>
            <p className="text-secondary-600 mt-1 text-sm lg:text-base truncate">
              {lead.first_name} {lead.last_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary-100 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-secondary-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {/* Phone Options */}
          <div className="space-y-3">
            <h3 className="text-base lg:text-lg font-semibold text-secondary-800 flex items-center flex-wrap">
              <Phone className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-primary-600 flex-shrink-0" />
              <span className="text-sm lg:text-base">Phone:</span>
              <span className="ml-2 text-sm lg:text-base break-all">{lead.phone}</span>
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {/* Call Button */}
              <button
                onClick={handlePhoneClick}
                className="flex items-center justify-between p-3 lg:p-4 bg-success-50 hover:bg-success-100 border border-success-200 rounded-xl transition-all duration-200 hover:scale-105 group active:scale-95"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-success-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-semibold text-success-800 text-sm lg:text-base">Make a Call</p>
                    <p className="text-xs lg:text-sm text-success-600">Open phone app to call</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-success-600 group-hover:text-success-700 flex-shrink-0" />
              </button>

              {/* SMS Button */}
              <button
                onClick={handleSMSClick}
                className="flex items-center justify-between p-3 lg:p-4 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-all duration-200 hover:scale-105 group active:scale-95"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-semibold text-primary-800 text-sm lg:text-base">Send SMS</p>
                    <p className="text-xs lg:text-sm text-primary-600">Open messaging app</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-primary-600 group-hover:text-primary-700 flex-shrink-0" />
              </button>

              {/* WhatsApp Button */}
              <button
                onClick={handleWhatsAppClick}
                className="flex items-center justify-between p-3 lg:p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-all duration-200 hover:scale-105 group active:scale-95"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-semibold text-green-800 text-sm lg:text-base">WhatsApp</p>
                    <p className="text-xs lg:text-sm text-green-600">Send WhatsApp message</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-green-600 group-hover:text-green-700 flex-shrink-0" />
              </button>
            </div>
          </div>

          {/* Email Options */}
          {lead.email && (
            <div className="space-y-3 pt-4 border-t border-secondary-200">
              <h3 className="text-base lg:text-lg font-semibold text-secondary-800 flex items-center flex-wrap">
                <Mail className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-primary-600 flex-shrink-0" />
                <span className="text-sm lg:text-base">Email:</span>
                <span className="ml-2 text-sm lg:text-base break-all">{lead.email}</span>
              </h3>

              <button
                onClick={handleEmailClick}
                className="w-full flex items-center justify-between p-3 lg:p-4 bg-warning-50 hover:bg-warning-100 border border-warning-200 rounded-xl transition-all duration-200 hover:scale-105 group active:scale-95"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-warning-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-semibold text-warning-800 text-sm lg:text-base">Send Email</p>
                    <p className="text-xs lg:text-sm text-warning-600">Open email client</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-warning-600 group-hover:text-warning-700 flex-shrink-0" />
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-4 border-t border-secondary-200">
            <h3 className="text-sm lg:text-base font-semibold text-secondary-600 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button className="px-3 py-2 lg:px-4 lg:py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-xl text-xs lg:text-sm font-medium transition-colors">
                Schedule Call
              </button>
              <button className="px-3 py-2 lg:px-4 lg:py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-xl text-xs lg:text-sm font-medium transition-colors">
                Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 lg:p-6 border-t border-secondary-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-secondary-600 hover:text-secondary-800 font-medium transition-colors text-sm lg:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadContactModal;
