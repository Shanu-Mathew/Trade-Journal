import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../lib/database.types';
import { calculatePortfolioStats, filterTradesByDateRange, getDateRangePreset } from '../../utils/tradeCalculations';
import KPIGrid from './KPIGrid';
import DateRangeSelector from './DateRangeSelector';
import ChartsGrid from './ChartsGrid';
import { Loader2 } from 'lucide-react';

type Trade = Database['public']['Tables']['trades']['Row'];
type Account = Database['public']['Tables']['accounts']['Row'];

export default function Dashboard() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last_month');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

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

  const getFilteredTrades = () => {
    if (dateRange === 'all') {
      return trades;
    }

    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return filterTradesByDateRange(trades, customStartDate, customEndDate);
    }

    const { start, end } = getDateRangePreset(dateRange);
    return filterTradesByDateRange(trades, start, end);
  };

  const filteredTrades = getFilteredTrades();
  const initialBalance = accounts.reduce((sum, acc) => sum + Number(acc.initial_balance), 0);
  const stats = calculatePortfolioStats(filteredTrades, initialBalance);

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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track your trading performance
          </p>
        </div>
        <DateRangeSelector
          value={dateRange}
          onChange={setDateRange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomStartDateChange={setCustomStartDate}
          onCustomEndDateChange={setCustomEndDate}
        />
      </div>

      <KPIGrid stats={stats} />
      <ChartsGrid trades={filteredTrades} initialBalance={initialBalance} />
    </div>
  );
}
