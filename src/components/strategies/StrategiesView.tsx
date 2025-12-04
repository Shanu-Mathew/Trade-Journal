import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';

type Strategy = Database['public']['Tables']['strategies']['Row'];
type StrategyInsert = Database['public']['Tables']['strategies']['Insert'];

interface StrategiesViewProps {
  selectedAccountId: string | null;
}

export function StrategiesView({ selectedAccountId }: StrategiesViewProps) {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    is_bulleted: false,
  });

  useEffect(() => {
    if (selectedAccountId) {
      loadStrategies();
    }
  }, [selectedAccountId]);

  const loadStrategies = async () => {
    if (!selectedAccountId || !user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user.id)
      .eq('account_id', selectedAccountId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setStrategies(data);
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({ title: '', body: '', is_bulleted: false });
  };

  const handleEdit = (strategy: Strategy) => {
    setEditingId(strategy.id);
    setFormData({
      title: strategy.title,
      body: strategy.body,
      is_bulleted: strategy.is_bulleted,
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ title: '', body: '', is_bulleted: false });
  };

  const handleSave = async () => {
    if (!user || !selectedAccountId || !formData.title.trim()) return;

    if (isCreating) {
      const newStrategy: StrategyInsert = {
        user_id: user.id,
        account_id: selectedAccountId,
        title: formData.title.trim(),
        body: formData.body.trim(),
        is_bulleted: formData.is_bulleted,
      };

      const { error } = await supabase.from('strategies').insert(newStrategy);

      if (!error) {
        await loadStrategies();
        handleCancel();
      }
    } else if (editingId) {
      const { error } = await supabase
        .from('strategies')
        .update({
          title: formData.title.trim(),
          body: formData.body.trim(),
          is_bulleted: formData.is_bulleted,
        })
        .eq('id', editingId);

      if (!error) {
        await loadStrategies();
        handleCancel();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this strategy?')) return;

    const { error } = await supabase.from('strategies').delete().eq('id', id);

    if (!error) {
      await loadStrategies();
    }
  };

  const formatBody = (body: string, isBulleted: boolean) => {
    if (!body) return null;

    if (isBulleted) {
      return body.split('\n').filter(line => line.trim()).map((line, i) => (
        <li key={i} className="ml-4">{line.trim()}</li>
      ));
    }

    return body.split('\n').map((line, i) => (
      <p key={i} className="mb-2">{line || '\u00A0'}</p>
    ));
  };

  if (!selectedAccountId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Please select an account to view strategies</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading strategies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trading Strategies</h2>
        {!isCreating && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Strategy
          </button>
        )}
      </div>

      {isCreating && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create New Strategy</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Strategy name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter strategy details (one line per rule if using bullets)"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_bulleted"
                checked={formData.is_bulleted}
                onChange={(e) => setFormData({ ...formData, is_bulleted: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_bulleted" className="text-sm text-gray-700 dark:text-gray-300">
                Format as bullet points
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Strategy
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {strategies.length === 0 && !isCreating ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <p className="text-gray-500 dark:text-gray-400">No strategies yet. Create your first one!</p>
          </div>
        ) : (
          strategies.map((strategy) => (
            <div
              key={strategy.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
            >
              {editingId === strategy.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      rows={8}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`edit_bulleted_${strategy.id}`}
                      checked={formData.is_bulleted}
                      onChange={(e) => setFormData({ ...formData, is_bulleted: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`edit_bulleted_${strategy.id}`} className="text-sm text-gray-700 dark:text-gray-300">
                      Format as bullet points
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{strategy.title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(strategy)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit strategy"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(strategy.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete strategy"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-gray-700 dark:text-gray-300">
                    {strategy.is_bulleted ? (
                      <ul className="list-disc space-y-1">
                        {formatBody(strategy.body, true)}
                      </ul>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {formatBody(strategy.body, false)}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Created {new Date(strategy.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
