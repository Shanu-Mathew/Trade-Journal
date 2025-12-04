import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthPage from './components/auth/AuthPage';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './components/dashboard/Dashboard';
import TradesView from './components/trades/TradesView';
import JournalsView from './components/journals/JournalsView';
import SettingsView from './components/settings/SettingsView';
import { StrategiesView } from './components/strategies/StrategiesView';
import { CalculatorView } from './components/calculator/CalculatorView';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Database } from './lib/database.types';

type Account = Database['public']['Tables']['accounts']['Row'];

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [calculatorData, setCalculatorData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadAccounts();
    }
  }, [user]);

  const loadAccounts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setAccounts(data);
      if (!selectedAccountId) {
        setSelectedAccountId(data[0].id);
      }
    }
  };

  const handleSendToTradeForm = (tradeData: any) => {
    setCalculatorData(tradeData);
    setCurrentView('trades');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'trades':
        return <TradesView prefilledData={calculatorData} onDataUsed={() => setCalculatorData(null)} />;
      case 'strategies':
        return <StrategiesView selectedAccountId={selectedAccountId} />;
      case 'calculator':
        return (
          <CalculatorView
            selectedAccountId={selectedAccountId}
            accounts={accounts}
            onSendToTradeForm={handleSendToTradeForm}
          />
        );
      case 'journals':
        return <JournalsView selectedAccountId={selectedAccountId} />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppLayout currentView={currentView} onViewChange={setCurrentView}>
      {accounts.length > 0 && (currentView === 'strategies' || currentView === 'calculator' || currentView === 'journals') && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Account
          </label>
          <select
            value={selectedAccountId || ''}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.currency})
              </option>
            ))}
          </select>
        </div>
      )}
      {renderView()}
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
