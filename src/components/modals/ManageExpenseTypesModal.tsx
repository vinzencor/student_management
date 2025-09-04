import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ExpenseType {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ManageExpenseTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const ManageExpenseTypesModal: React.FC<ManageExpenseTypesModalProps> = ({
  isOpen,
  onClose,
  onUpdate
}) => {
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newType, setNewType] = useState({ name: '', description: '' });
  const [editingType, setEditingType] = useState({ name: '', description: '' });

  useEffect(() => {
    if (isOpen) {
      loadExpenseTypes();
    }
  }, [isOpen]);

  const loadExpenseTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expense_types')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;
      setExpenseTypes(data || []);
    } catch (error) {
      console.error('Error loading expense types:', error);
      alert('Failed to load expense types');
    } finally {
      setLoading(false);
    }
  };

  const handleAddType = async () => {
    if (!newType.name.trim()) {
      alert('Please enter a name for the expense type');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('expense_types')
        .insert([{
          name: newType.name.trim(),
          description: newType.description.trim() || null,
          is_default: false,
          is_active: true
        }]);

      if (error) {
        if (error.code === '23505') {
          alert('An expense type with this name already exists');
        } else {
          throw error;
        }
        return;
      }

      setNewType({ name: '', description: '' });
      await loadExpenseTypes();
      onUpdate();
    } catch (error) {
      console.error('Error adding expense type:', error);
      alert('Failed to add expense type');
    } finally {
      setLoading(false);
    }
  };

  const handleEditType = async (id: string) => {
    if (!editingType.name.trim()) {
      alert('Please enter a name for the expense type');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('expense_types')
        .update({
          name: editingType.name.trim(),
          description: editingType.description.trim() || null
        })
        .eq('id', id);

      if (error) {
        if (error.code === '23505') {
          alert('An expense type with this name already exists');
        } else {
          throw error;
        }
        return;
      }

      setEditingId(null);
      setEditingType({ name: '', description: '' });
      await loadExpenseTypes();
      onUpdate();
    } catch (error) {
      console.error('Error updating expense type:', error);
      alert('Failed to update expense type');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteType = async (id: string, name: string, isDefault: boolean) => {
    if (isDefault) {
      alert('Cannot delete default expense types');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('expense_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadExpenseTypes();
      onUpdate();
    } catch (error) {
      console.error('Error deleting expense type:', error);
      alert('Failed to delete expense type');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (expenseType: ExpenseType) => {
    setEditingId(expenseType.id);
    setEditingType({
      name: expenseType.name,
      description: expenseType.description || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingType({ name: '', description: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-secondary-800">Manage Expense Types</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Add New Type */}
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <h3 className="text-lg font-semibold text-danger-800 mb-3">Add New Expense Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newType.name}
                  onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-danger-500 focus:border-danger-500"
                  placeholder="e.g., Office Rent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newType.description}
                  onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                  className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-danger-500 focus:border-danger-500"
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleAddType}
                disabled={loading || !newType.name.trim()}
                className="flex items-center space-x-2 bg-danger-600 hover:bg-danger-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense Type</span>
              </button>
            </div>
          </div>

          {/* Existing Types */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-secondary-800">Existing Expense Types</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-secondary-600">Loading...</div>
              </div>
            ) : expenseTypes.length === 0 ? (
              <div className="text-center py-8 text-secondary-500">
                No expense types found
              </div>
            ) : (
              expenseTypes.map((expenseType) => (
                <div
                  key={expenseType.id}
                  className={`p-4 border rounded-lg ${
                    expenseType.is_default 
                      ? 'bg-secondary-50 border-secondary-200' 
                      : 'bg-white border-secondary-200'
                  }`}
                >
                  {editingId === expenseType.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          value={editingType.name}
                          onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                          className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-danger-500 focus:border-danger-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={editingType.description}
                          onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                          className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-danger-500 focus:border-danger-500"
                          placeholder="Optional description"
                        />
                      </div>
                      <div className="md:col-span-2 flex space-x-2">
                        <button
                          onClick={() => handleEditType(expenseType.id)}
                          disabled={loading}
                          className="flex items-center space-x-1 bg-success-600 hover:bg-success-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm disabled:opacity-50"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center space-x-1 bg-secondary-600 hover:bg-secondary-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-secondary-800">{expenseType.name}</h4>
                          {expenseType.is_default && (
                            <span className="text-xs bg-secondary-200 text-secondary-700 px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        {expenseType.description && (
                          <p className="text-sm text-secondary-600 mt-1">{expenseType.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(expenseType)}
                          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-secondary-600" />
                        </button>
                        {!expenseType.is_default && (
                          <button
                            onClick={() => handleDeleteType(expenseType.id, expenseType.name, expenseType.is_default)}
                            className="p-2 hover:bg-danger-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-danger-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageExpenseTypesModal;
