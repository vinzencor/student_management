import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DataService } from '../services/dataService';
import StudentAdmissionModal from './StudentAdmissionModal';
import PrintableReceipt from './PrintableReceipt';

interface ReceiptForm {
  id?: string;
  lead_id: string;
  student_id?: string;
  parent_id?: string;
  course_id?: string;
  course_fee?: number;
  amount_paying: number;
  tax_rate?: number;
  total_amount: number;
  notes?: string;
  status: 'draft' | 'ready' | 'printed';
}

const Receipts: React.FC = () => {
  const [convertedLeads, setConvertedLeads] = useState<any[]>([]);
  const [receiptByLead, setReceiptByLead] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<ReceiptForm | null>(null);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      // 1) Fetch converted leads
      const { data: leads, error: leadsErr } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'converted')
        .order('updated_at', { ascending: false });
      if (leadsErr) throw leadsErr;
      setConvertedLeads(leads || []);

      // 2) Fetch receipts with course info for those leads (if any) and index by lead_id
      const leadIds = (leads || []).map((l:any) => l.id);
      if (leadIds.length > 0) {
        try {
          const { data: recs } = await supabase
            .from('receipts')
            .select('*, course:courses(name, price)')
            .in('lead_id', leadIds);
          const map: Record<string, any> = {};
          (recs || []).forEach(r => { map[r.lead_id] = r; });
          setReceiptByLead(map);
        } catch (receiptError) {
          console.warn('Receipts table not found, showing leads without receipts:', receiptError);
          setReceiptByLead({});
        }
      } else {
        setReceiptByLead({});
      }
    } catch (e) {
      console.error('Error loading converted leads/receipts', e);
    } finally {
      setLoading(false);
    }
  };

  const openAdmissionModal = async (lead: any) => {
    setSelectedLead(lead);
    setShowAdmissionModal(true);
  };

  const handleAdmissionComplete = async (studentId: string, parentId: string, courseId: string, coursePrice: number) => {
    if (!selectedLead) return;

    // Create or update receipt with student, parent, and course linked
    const receiptData = {
      lead_id: selectedLead.id,
      student_id: studentId,
      parent_id: parentId,
      course_id: courseId,
      amount: coursePrice, // Full course fee
      tax_rate: 0.18, // Default 18% GST
      status: 'ready'
    };

    try {
      const existingReceipt = receiptByLead[selectedLead.id];
      if (existingReceipt) {
        await supabase.from('receipts').update(receiptData).eq('id', existingReceipt.id);
      } else {
        await supabase.from('receipts').insert(receiptData);
      }
      await load();
      alert(`Student admission completed! Receipt created with course fee ₹${coursePrice.toLocaleString()}. Ready for printing.`);
    } catch (error) {
      console.error('Error updating receipt:', error);
      alert('Admission completed but failed to update receipt.');
    }
  };

  const calcTotal = (amount: number, tax?: number) => {
    const rate = tax && tax > 0 ? tax : 0;
    return Math.round((amount + amount * rate) * 100) / 100;
  };

  const calcRemaining = (courseFee: number, amountPaying: number) => {
    return Math.max(0, courseFee - amountPaying);
  };

  const saveReceipt = async () => {
    if (!editing) return;
    const payload = {
      lead_id: editing.lead_id,
      student_id: editing.student_id || null,
      parent_id: editing.parent_id || null,
      course_id: editing.course_id || null,
      amount: editing.amount_paying || 0,
      tax_rate: editing.tax_rate || 0,
      notes: editing.notes || null,
      status: editing.status || 'draft'
    };

    try {
      setLoading(true);
      let res;
      if (editing.id && editing.id !== 'undefined') {
        res = await supabase.from('receipts').update(payload).eq('id', editing.id).select().single();
      } else {
        res = await supabase.from('receipts').insert(payload).select().single();
      }
      if (res.error) throw res.error;
      setEditing(null);
      await load();
    } catch (e) {
      console.error('Error saving receipt', e);
      alert('Failed to save receipt: ' + (e as any).message);
    } finally {
      setLoading(false);
    }
  };

  const onPrint = async (rec: any) => {
    if (!rec.student_id || !rec.parent_id || rec.status !== 'ready') {
      alert('Please complete student admission before printing.');
      return;
    }

    try {
      // Fetch complete data for printing
      const [studentRes, parentRes, courseRes] = await Promise.all([
        supabase.from('students').select('*').eq('id', rec.student_id).single(),
        supabase.from('parents').select('*').eq('id', rec.parent_id).single(),
        rec.course_id ? supabase.from('courses').select('*').eq('id', rec.course_id).single() : { data: null }
      ]);

      setPrintData({
        receipt: rec,
        student: studentRes.data,
        parent: parentRes.data,
        course: courseRes.data
      });
      setShowPrintModal(true);
    } catch (error) {
      console.error('Error loading print data:', error);
      alert('Failed to load receipt data for printing.');
    }
  };



  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-4 lg:p-6 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-secondary-800">Receipts</h2>
        <button className="px-3 py-2 rounded-lg bg-primary-600 text-white" onClick={() => setEditing({ lead_id: '', amount_paying: 0, total_amount: 0, status: 'draft' })}>New Receipt</button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Lead Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Course</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {convertedLeads.map((lead: any) => {
                const receipt = receiptByLead[lead.id];
                return (
                  <tr key={lead.id} className="border-b hover:bg-secondary-50">
                    <td className="py-2 pr-4">{lead.first_name} {lead.last_name}</td>
                    <td className="py-2 pr-4">{lead.email || '-'}</td>
                    <td className="py-2 pr-4">{receipt?.course?.name || '-'}</td>
                    <td className="py-2 pr-4">{receipt ? `₹ ${receipt.total_amount.toLocaleString()}` : '-'}</td>
                    <td className="py-2 pr-4">{receipt ? receipt.status : 'Pending Admission'}</td>
                    <td className="py-2 pr-4 space-x-2">
                      {receipt && receipt.student_id ? (
                        <>
                          <button
                            className="text-primary-600"
                            onClick={async () => {
                              // Load course info for editing
                              if (receipt.course_id) {
                                const { data: course } = await supabase.from('courses').select('*').eq('id', receipt.course_id).single();
                                setEditing({
                                  ...receipt,
                                  course_fee: course?.price || 0,
                                  amount_paying: receipt.amount || 0
                                });
                              } else {
                                setEditing({
                                  ...receipt,
                                  course_fee: 0,
                                  amount_paying: receipt.amount || 0
                                });
                              }
                            }}
                          >
                            Edit Receipt
                          </button>
                          <button className="text-secondary-600" onClick={() => onPrint(receipt)}>Print</button>
                        </>
                      ) : (
                        <button
                          className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                          onClick={() => openAdmissionModal(lead)}
                        >
                          Complete Admission
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Edit Receipt</h3>

            <div className="space-y-4">
              <div className="bg-secondary-50 p-4 rounded-lg">
                <div className="text-sm text-secondary-600 mb-2">Course Information</div>
                <div className="font-medium">Course Fee: ₹{(editing.course_fee || 0).toLocaleString()}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Amount Paying (₹) *</label>
                <input
                  type="number"
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={editing.amount_paying}
                  onChange={(e)=> setEditing({...editing, amount_paying: Number(e.target.value)})}
                  placeholder="Enter amount being paid"
                />
                <div className="text-sm text-secondary-600 mt-1">
                  Remaining: ₹{calcRemaining(editing.course_fee || 0, editing.amount_paying).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={(editing.tax_rate || 0)*100}
                  onChange={(e)=> setEditing({...editing, tax_rate: Number(e.target.value)/100})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Total Amount (₹)</label>
                <input
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 bg-secondary-50"
                  value={calcTotal(editing.amount_paying, editing.tax_rate)}
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Notes</label>
                <textarea
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  value={editing.notes || ''}
                  onChange={(e)=> setEditing({...editing, notes: e.target.value})}
                  placeholder="Payment notes, installment details, etc."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50" onClick={()=> setEditing(null)}>Cancel</button>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700" onClick={saveReceipt}>Save Receipt</button>
            </div>
          </div>
        </div>
      )}

      <StudentAdmissionModal
        isOpen={showAdmissionModal}
        onClose={() => setShowAdmissionModal(false)}
        leadData={selectedLead}
        onComplete={handleAdmissionComplete}
      />

      {showPrintModal && printData && (
        <PrintableReceipt
          receipt={printData.receipt}
          student={printData.student}
          parent={printData.parent}
          course={printData.course}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};

export default Receipts;

