// JournalsView.tsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../lib/database.types';
import {
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Loader2,
  Folder,
  FolderOpen,
  MoreVertical,
} from 'lucide-react';
import JournalForm from './JournalForm';

type Journal = Database['public']['Tables']['journals']['Row'];
type FolderType = Database['public']['Tables']['folders']['Row'];

interface JournalsViewProps {
  selectedAccountId: string | null;
}

export default function JournalsView({ selectedAccountId }: JournalsViewProps) {
  const { user } = useAuth();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [draggedJournal, setDraggedJournal] = useState<Journal | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // menus & renaming
  const [folderMenuOpenId, setFolderMenuOpenId] = useState<string | null>(null);
  const [journalMenuOpenId, setJournalMenuOpenId] = useState<string | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState<string>('');

  // ref to detect clicks outside the entire folders/entries area (also closes menus)
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (user && selectedAccountId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedAccountId]);

  useEffect(() => {
    // click outside -> collapse all expanded folders and menus
    function handleDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setExpandedFolders(new Set());
        setFolderMenuOpenId(null);
        setJournalMenuOpenId(null);
        setRenamingFolderId(null);
      }
    }
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  const loadData = async () => {
    if (!selectedAccountId) return;

    try {
      setLoading(true);
      const [journalsResult, foldersResult] = await Promise.all([
        supabase
          .from('journals')
          .select('*')
          .eq('user_id', user!.id)
          .eq('account_id', selectedAccountId)
          .order('entry_date', { ascending: false }),
        supabase
          .from('folders')
          .select('*')
          .eq('user_id', user!.id)
          .eq('account_id', selectedAccountId)
          .order('created_at', { ascending: false }),
      ]);

      if (journalsResult.error) throw journalsResult.error;
      if (foldersResult.error) throw foldersResult.error;

      setJournals(journalsResult.data || []);
      setFolders(foldersResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (journalData: any) => {
    try {
      if (editingJournal) {
        const { error } = await supabase.from('journals').update(journalData).eq('id', editingJournal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('journals')
          .insert({ ...journalData, user_id: user!.id, account_id: selectedAccountId });
        if (error) throw error;
      }

      await loadData();
      setShowForm(false);
      setEditingJournal(null);
    } catch (error) {
      console.error('Error saving journal:', error);
    }
  };

  const handleDelete = async (journalId: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;

    try {
      const { error } = await supabase.from('journals').delete().eq('id', journalId);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting journal:', error);
    } finally {
      setJournalMenuOpenId(null);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const { error } = await supabase.from('folders').insert({
        name: newFolderName,
        user_id: user!.id,
        account_id: selectedAccountId!,
      });

      if (error) throw error;
      await loadData();
      setNewFolderName('');
      setShowNewFolder(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder? Journal entries will not be deleted.')) return;

    try {
      const { error } = await supabase.from('folders').delete().eq('id', folderId);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting folder:', error);
    } finally {
      setFolderMenuOpenId(null);
    }
  };

  const handleRenameFolderSubmit = async (folderId: string) => {
    if (!renameFolderName.trim()) return;
    try {
      const { error } = await supabase.from('folders').update({ name: renameFolderName }).eq('id', folderId);
      if (error) throw error;
      await loadData();
      setRenamingFolderId(null);
      setRenameFolderName('');
      setFolderMenuOpenId(null);
    } catch (error) {
      console.error('Error renaming folder:', error);
    }
  };

  // Drag handlers
  const handleDragStart = (journal: Journal) => {
    setDraggedJournal(journal);
  };

  const handleDragEnd = () => {
    setDraggedJournal(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnFolder = async (folderId: string) => {
    if (!draggedJournal) return;

    try {
      const { error } = await supabase.from('journals').update({ folder_id: folderId }).eq('id', draggedJournal.id);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error moving journal:', error);
    } finally {
      setDraggedJournal(null);
    }
  };

  const handleDropOnRoot = async () => {
    if (!draggedJournal) return;

    try {
      const { error } = await supabase.from('journals').update({ folder_id: null }).eq('id', draggedJournal.id);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error moving journal:', error);
    } finally {
      setDraggedJournal(null);
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      // If you want only one expanded at a time uncomment next line:
      // newExpanded.clear();
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const rootJournals = journals.filter((j) => !j.folder_id);
  const getJournalsInFolder = (folderId: string) => journals.filter((j) => j.folder_id === folderId);

  if (!selectedAccountId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Please select an account to view journals</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Journals</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Document your trading journey</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Folder className="w-4 h-4" />
            New Folder
          </button>
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
      </div>

      {showNewFolder && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') {
                  setShowNewFolder(false);
                  setNewFolderName('');
                }
              }}
            />
            <button
              onClick={handleCreateFolder}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewFolder(false);
                setNewFolderName('');
              }}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {journals.length === 0 && folders.length === 0 && !showForm ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 border border-slate-200 dark:border-slate-700 text-center">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No journal entries yet</h3>
          <p className="text-slate-600 dark:text-slate-400">Start documenting your trading thoughts and lessons</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folder tiles (compact, wrap, up to ~5 per row based on width) */}
          {folders.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Folders</h3>
              <div className="flex flex-wrap gap-3">
                {folders.map((folder) => {
                  const isMenuOpen = folderMenuOpenId === folder.id;
                  const isRenaming = renamingFolderId === folder.id;
                  return (
                    <div
                      key={folder.id}
                      onDragOver={handleDragOver}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropOnFolder(folder.id);
                      }}
                      className={`w-44 min-h-[64px] bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 flex flex-col justify-between relative cursor-pointer transition-shadow ${
                        draggedJournal ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation(); // avoid container click hiding immediately
                        toggleFolder(folder.id);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {expandedFolders.has(folder.id) ? (
                            <FolderOpen className="w-5 h-5 text-blue-500" />
                          ) : (
                            <Folder className="w-5 h-5 text-blue-500" />
                          )}
                          <div className="min-w-0">
                            {isRenaming ? (
                              <div className="flex items-center gap-2">
                                <input
                                  className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded text-sm bg-transparent w-32"
                                  value={renameFolderName}
                                  onChange={(e) => setRenameFolderName(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameFolderSubmit(folder.id);
                                    if (e.key === 'Escape') {
                                      setRenamingFolderId(null);
                                      setRenameFolderName('');
                                    }
                                  }}
                                  autoFocus
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRenameFolderSubmit(folder.id);
                                  }}
                                  className="text-xs px-2 py-1 rounded bg-blue-500 text-white"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{folder.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {getJournalsInFolder(folder.id).length} entries
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* three-dots menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderMenuOpenId(isMenuOpen ? null : folder.id);
                              // prepare rename input default text
                              setRenameFolderName(folder.name || '');
                            }}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50"
                            title="More"
                          >
                            <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                          </button>

                          {isMenuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow z-30"
                            >
                              <button
                                onClick={() => {
                                  setRenamingFolderId(folder.id);
                                  setFolderMenuOpenId(null);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/20"
                              >
                                Rename
                              </button>
                              <button
                                onClick={() => handleDeleteFolder(folder.id)}
                                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expanded folder panels */}
          {Array.from(expandedFolders).map((folderId) => {
            const folder = folders.find((f) => f.id === folderId);
            if (!folder) return null;
            const items = getJournalsInFolder(folderId);
            return (
              <div
                key={`expanded-${folderId}`}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{folder.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{items.length} entries</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">Click outside to collapse</div>
                </div>

                {items.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">Drag journal entries here</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {items.map((journal) => (
                      <CompactJournalCard
                        key={journal.id}
                        journal={journal}
                        onEdit={() => {
                          setEditingJournal(journal);
                          setShowForm(true);
                        }}
                        onDelete={() => handleDelete(journal.id)}
                        onDragStart={() => handleDragStart(journal)}
                        onDragEnd={handleDragEnd}
                        isMenuOpen={journalMenuOpenId === journal.id}
                        setJournalMenuOpenId={setJournalMenuOpenId}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Root / All Entries area - supports drop to remove from folder */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => {
              e.preventDefault();
              handleDropOnRoot();
            }}
            className={`p-3 rounded-xl ${draggedJournal && draggedJournal.folder_id ? 'ring-2 ring-blue-500' : ''}`}
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">All Entries</h3>
            {rootJournals.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 text-center text-slate-500">
                No entries in root. Drag entries here to remove them from a folder.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {rootJournals.map((journal) => (
                  <CompactJournalCard
                    key={journal.id}
                    journal={journal}
                    onEdit={() => {
                      setEditingJournal(journal);
                      setShowForm(true);
                    }}
                    onDelete={() => handleDelete(journal.id)}
                    onDragStart={() => handleDragStart(journal)}
                    onDragEnd={() => handleDragEnd()}
                    isMenuOpen={journalMenuOpenId === journal.id}
                    setJournalMenuOpenId={setJournalMenuOpenId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <JournalForm
          journal={editingJournal}
          folders={folders}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingJournal(null);
            setJournalMenuOpenId(null);
          }}
        />
      )}
    </div>
  );
}

interface CompactJournalCardProps {
  journal: Journal;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isMenuOpen?: boolean;
  setJournalMenuOpenId?: (id: string | null) => void;
}

function CompactJournalCard({
  journal,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  isMenuOpen = false,
  setJournalMenuOpenId,
}: CompactJournalCardProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart()}
      onDragEnd={() => onDragEnd()}
      className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:shadow transition-shadow cursor-move flex items-center justify-between gap-3 relative"
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{journal.title}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {new Date(journal.entry_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
        {/* three-dots menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (setJournalMenuOpenId) setJournalMenuOpenId(isMenuOpen ? null : journal.id);
            }}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50"
            title="More"
          >
            <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>

          {isMenuOpen && (
            <div onClick={(e) => e.stopPropagation()} className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow z-30">
              <button
                onClick={() => {
                  onEdit();
                  if (setJournalMenuOpenId) setJournalMenuOpenId(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/20 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => onDelete()}
                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
