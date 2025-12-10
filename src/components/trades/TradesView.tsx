// TradesView.tsx (fixed date-range filtering)
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../lib/database.types';
import { Plus, Filter, Download, Upload, Search, Loader2, Trash } from 'lucide-react';
import TradesList from './TradesList';
import TradeForm from './TradeForm';
import TradeFilters from './TradeFilters';
import CSVImportModal from './CSVImportModal';

type Trade = Database['public']['Tables']['trades']['Row'];
type Account = Database['public']['Tables']['accounts']['Row'];

interface TradesViewProps {
  prefilledData?: any;
  onDataUsed?: () => void;
}

export default function TradesView({ prefilledData, onDataUsed }: TradesViewProps = {}) {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    if (user) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (prefilledData) {
      setShowForm(true);
    }
  }, [prefilledData]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [tradesResult, accountsResult] = await Promise.all([
        supabase
          .from('trades')
          .select('*')
          .eq('user_id', user!.id)
          .order('entry_timestamp', { ascending: false }),
        supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user!.id)
      ]);

      if (tradesResult.error) throw tradesResult.error;
      if (accountsResult.error) throw accountsResult.error;

      setTrades(tradesResult.data || []);
      setAccounts(accountsResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTradeSubmit = async (tradeData: any) => {
    try {
      if (editingTrade) {
        const { error } = await supabase
          .from('trades')
          .update(tradeData)
          .eq('id', editingTrade.id);

        if (error) throw error;

        await supabase.from('audit_logs').insert({
          user_id: user!.id,
          entity_type: 'trade',
          entity_id: editingTrade.id,
          action: 'update',
          changes: { before: editingTrade, after: tradeData },
        });
      } else {
        const { error } = await supabase
          .from('trades')
          .insert({ ...tradeData, user_id: user!.id });

        if (error) throw error;
      }

      await loadData();
      setShowForm(false);
      setEditingTrade(null);
    } catch (error) {
      console.error('Error saving trade:', error);
    }
  };

  const handleEdit = (trade: Trade) => {
    setEditingTrade(trade);
    setShowForm(true);
  };

  const handleDelete = async (tradeId: string) => {
    if (!confirm('Are you sure you want to delete this trade?')) return;

    try {
      const trade = trades.find(t => t.id === tradeId);

      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        entity_type: 'trade',
        entity_id: tradeId,
        action: 'delete',
        changes: { deleted: trade },
      });

      await loadData();
    } catch (error) {
      console.error('Error deleting trade:', error);
    }
  };

  // delete all trades for this user
  const handleDeleteAll = async () => {
    if (trades.length === 0) {
      alert('No trades to delete.');
      return;
    }

    const ok = confirm(`Are you sure you want to permanently delete ALL ${trades.length} trades? This action cannot be undone.`);
    if (!ok) return;

    try {
      setDeletingAll(true);

      // snapshot
      const { data: currentTrades, error: fetchErr } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user!.id);

      if (fetchErr) throw fetchErr;

      // delete
      const { error: deleteErr } = await supabase
        .from('trades')
        .delete()
        .eq('user_id', user!.id);

      if (deleteErr) throw deleteErr;

      await supabase.from('audit_logs').insert({
        user_id: user!.id,
        entity_type: 'trade',
        entity_id: null,
        action: 'delete_all',
        changes: { deleted: currentTrades || [] },
      });

      await loadData();
    } catch (error) {
      console.error('Error deleting all trades:', error);
      alert('Failed to delete all trades. See console for details.');
    } finally {
      setDeletingAll(false);
    }
  };

  // ---------------------------
  // Date range handling helper
  // ---------------------------
  const parseFilterDates = (filtersObj: any): { fromDate: Date | null; toDate: Date | null } => {
    let from: Date | null = null;
    let to: Date | null = null;

    // filters.fromDate and filters.toDate are expected to be 'YYYY-MM-DD' strings from input[type=date]
    if (filtersObj?.fromDate) {
      // start of day (local)
      from = new Date(filtersObj.fromDate + 'T00:00:00');
      if (Number.isNaN(from.getTime())) from = null;
    }
    if (filtersObj?.toDate) {
      // end of day (local) inclusive
      to = new Date(filtersObj.toDate + 'T23:59:59.999');
      if (Number.isNaN(to.getTime())) to = null;
    }

    return { fromDate: from, toDate: to };
  };

  // ---------------------------
  // Filtering logic (including date range)
  // ---------------------------
  const { fromDate: parsedFromDate, toDate: parsedToDate } = parseFilterDates(filters);

  const filteredTrades = trades.filter(trade => {
    // Search (symbol)
    if (searchTerm && !trade.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Account, status, direction, strategy
    if (filters.accountId && trade.account_id !== filters.accountId) return false;
    if (filters.status && trade.status !== filters.status) return false;
    if (filters.direction && trade.direction !== filters.direction) return false;
    if (filters.strategy && trade.strategy !== filters.strategy) return false;

    // P&L min/max
    if (filters.minPL !== undefined && filters.minPL !== '' && (trade.profit_loss ?? 0) < filters.minPL) return false;
    if (filters.maxPL !== undefined && filters.maxPL !== '' && (trade.profit_loss ?? 0) > filters.maxPL) return false;

    // Date range: compare against entry_timestamp (if you want exit_timestamp instead, change accordingly)
    if (parsedFromDate || parsedToDate) {
      if (!trade.entry_timestamp) {
        // if trade has no entry timestamp, exclude it when a date filter is present
        return false;
      }
      const entryDate = new Date(trade.entry_timestamp);
      if (Number.isNaN(entryDate.getTime())) {
        // invalid date stored - exclude
        return false;
      }

      if (parsedFromDate && entryDate < parsedFromDate) return false;
      if (parsedToDate && entryDate > parsedToDate) return false;
    }

    return true;
  });

  const exportToCSV = () => {
    const headers = [
      'Symbol', 'Type', 'Direction', 'Quantity', 'Entry Price', 'Exit Price',
      'Entry Time', 'Exit Time', 'P&L', 'Fees', 'Commission', 'Strategy', 'Status'
    ];

    const rows = filteredTrades.map(trade => [
      trade.symbol,
      trade.instrument_type,
      trade.direction,
      trade.quantity,
      trade.entry_price,
      trade.exit_price || '',
      trade.entry_timestamp,
      trade.exit_timestamp || '',
      trade.profit_loss || '',
      trade.fees,
      trade.commission,
      trade.strategy || '',
      trade.status,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Trades</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your trading history
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <button
            onClick={handleDeleteAll}
            disabled={deletingAll}
            className="
              flex items-center gap-2 px-4 py-2
              bg-red-500 text-white
              rounded-lg
              hover:bg-red-800
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-colors
            "
          >
            <Trash className="w-4 h-4" />
            {deletingAll ? 'Deleting...' : 'Delete All'}
          </button>

          <button
            onClick={() => {
              setEditingTrade(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Trade
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by symbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {showFilters && (
        <TradeFilters
          accounts={accounts}
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      <TradesList
        trades={filteredTrades}
        accounts={accounts}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showForm && (
        <TradeForm
          trade={editingTrade}
          accounts={accounts}
          prefilledData={prefilledData}
          onSubmit={handleTradeSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingTrade(null);
            if (onDataUsed) onDataUsed();
          }}
        />
      )}

      {showImport && (
        <CSVImportModal
          accounts={accounts}
          onClose={() => setShowImport(false)}
          onImport={loadData}
        />
      )}
    </div>
  );
}
