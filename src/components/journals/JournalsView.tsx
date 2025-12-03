import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../lib/database.types';
import { Plus, Edit2, Trash2, BookOpen, Loader2 } from 'lucide-react';
import JournalForm from './JournalForm';

type Journal = Database['public']['Tables']['journals']['Row'];

export default function JournalsView() {
  const { user } = useAuth();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);

  useEffect(() => {
    if (user) {
      loadJournals();
    }
  }, [user]);

  const loadJournals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJournals(data || []);
    } catch (error) {
      console.error('Error loading journals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (journalData: any) => {
    try {
      if (editingJournal) {
        const { error } = await supabase
          .from('journals')
          .update(journalData)
          .eq('id', editingJournal.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('journals')
          .insert({ ...journalData, user_id: user!.id });

        if (error) throw error;
      }

      await loadJournals();
      setShowForm(false);
      setEditingJournal(null);
    } catch (error) {
      console.error('Error saving journal:', error);
    }
  };

  const handleDelete = async (journalId: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;

    try {
      const { error } = await supabase
        .from('journals')
        .delete()
        .eq('id', journalId);

      if (error) throw error;
      await loadJournals();
    } catch (error) {
      console.error('Error deleting journal:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Journals</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Document your trading journey
          </p>
        </div>
        <button
          onClick={() => {
            setEditingJournal(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </div>

      {journals.length === 0 && !showForm ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 border border-slate-200 dark:border-slate-700 text-center">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No journal entries yet</h3>
          <p className="text-slate-600 dark:text-slate-400">
            Start documenting your trading thoughts and lessons
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {journals.map((journal) => (
            <div
              key={journal.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                  {journal.title}
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <button
                    onClick={() => {
                      setEditingJournal(journal);
                      setShowForm(true);
                    }}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(journal.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-4 mb-4">
                {journal.content.replace(/<[^>]*>/g, '')}
              </p>
              <div className="text-xs text-slate-500 dark:text-slate-500">
                {new Date(journal.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <JournalForm
          journal={editingJournal}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingJournal(null);
          }}
        />
      )}
    </div>
  );
}
