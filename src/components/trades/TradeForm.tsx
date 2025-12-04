// TradeForm.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { calculateTradeMetrics } from '../../utils/tradeCalculations';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Trade = Database['public']['Tables']['trades']['Row'];
type Account = Database['public']['Tables']['accounts']['Row'];
type Strategy = Database['public']['Tables']['strategies']['Row'];

interface TradeFormProps {
  trade: Trade | null;
  accounts: Account[];
  prefilledData?: any;
  onSubmit: (data: any) => void;
  onClose: () => void;
}

function isoToLocalDatetimeInput(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
}

function localDatetimeInputToIso(localValue?: string | null) {
  if (!localValue) return null;
  // `localValue` is like "2025-12-02T13:41" (no timezone); construct Date using local timezone
  const d = new Date(localValue);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function TradeForm({ trade, accounts, prefilledData, onSubmit, onClose }: TradeFormProps) {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [isCustomStrategy, setIsCustomStrategy] = useState(false);

  const [formData, setFormData] = useState(() => ({
    account_id: trade?.account_id || accounts[0]?.id || '',
    symbol: trade?.symbol || '',
    instrument_type: trade?.instrument_type || 'stocks',
    direction: trade?.direction || 'long',
    quantity: trade?.quantity ?? 0,
    leverage: trade?.leverage ?? null,
    entry_price: trade?.entry_price ?? 0,
    exit_price: trade?.exit_price ?? null,
    entry_timestamp: isoToLocalDatetimeInput(trade?.entry_timestamp) || isoToLocalDatetimeInput(new Date().toISOString()),
    exit_timestamp: isoToLocalDatetimeInput(trade?.exit_timestamp) || '',
    fees: trade?.fees ?? 0,
    commission: trade?.commission ?? 0,
    slippage: trade?.slippage ?? 0,
    tags: trade?.tags?.join(', ') || '',
    strategy: trade?.strategy || '',
    notes: trade?.notes || '',
    status: trade?.status || 'open',
  }));

  useEffect(() => {
    if (user) {
      loadStrategies();
    }
  }, [user]);

  useEffect(() => {
    if (prefilledData) {
      setFormData(prev => ({
        ...prev,
        ...prefilledData,
      }));
    }
  }, [prefilledData]);

  useEffect(() => {
    setFormData({
      account_id: trade?.account_id || accounts[0]?.id || '',
      symbol: trade?.symbol || '',
      instrument_type: trade?.instrument_type || 'stocks',
      direction: trade?.direction || 'long',
      quantity: trade?.quantity ?? 0,
      leverage: trade?.leverage ?? null,
      entry_price: trade?.entry_price ?? 0,
      exit_price: trade?.exit_price ?? null,
      entry_timestamp: isoToLocalDatetimeInput(trade?.entry_timestamp) || isoToLocalDatetimeInput(new Date().toISOString()),
      exit_timestamp: isoToLocalDatetimeInput(trade?.exit_timestamp) || '',
      fees: trade?.fees ?? 0,
      commission: trade?.commission ?? 0,
      slippage: trade?.slippage ?? 0,
      tags: trade?.tags?.join(', ') || '',
      strategy: trade?.strategy || '',
      notes: trade?.notes || '',
      status: trade?.status || 'open',
    });
  }, [trade, accounts]);

  const loadStrategies = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user.id)
      .order('title');

    if (data) {
      setStrategies(data);
    }
  };

  const handleStrategyChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomStrategy(true);
      setSelectedStrategyId('');
      setFormData({ ...formData, strategy: '' });
    } else if (value === '') {
      setIsCustomStrategy(false);
      setSelectedStrategyId('');
      setFormData({ ...formData, strategy: '' });
    } else {
      const strategy = strategies.find(s => s.id === value);
      if (strategy) {
        setIsCustomStrategy(false);
        setSelectedStrategyId(value);
        setFormData({ ...formData, strategy: strategy.title });
      }
    }
  };

  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

  const formatStrategyBody = (body: string, isBulleted: boolean) => {
    if (!body) return null;

    if (isBulleted) {
      return body.split('\n').filter(line => line.trim()).map((line, i) => (
        <li key={i} className="ml-4">{line.trim()}</li>
      ));
    }

    return body.split('\n').map((line, i) => (
      <p key={i} className="mb-1 text-sm">{line || '\u00A0'}</p>
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse numeric inputs
    const numericQuantity = Number(formData.quantity) || 0;
    const numericLeverage = formData.leverage ? Number(formData.leverage) : null;

    // IMPORTANT: Do NOT multiply quantity by leverage. Store quantity as entered.
    const storedQuantity = numericQuantity;

    // convert timestamps to ISO for DB
    const entryIso = localDatetimeInputToIso(formData.entry_timestamp);
    const exitIso = localDatetimeInputToIso(formData.exit_timestamp);

    const tradeData: any = {
      ...formData,
      // store the raw quantity (do NOT apply leverage here)
      quantity: storedQuantity,
      // keep leverage as numeric or null (so UI still shows it)
      leverage: numericLeverage,
      entry_price: Number(formData.entry_price),
      exit_price: formData.exit_price ? Number(formData.exit_price) : null,
      // store full ISO timestamps (DB / display canonical form)
      entry_timestamp: entryIso,
      exit_timestamp: exitIso,
      fees: Number(formData.fees),
      commission: Number(formData.commission),
      slippage: Number(formData.slippage),
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      account_id: formData.account_id,
      symbol: formData.symbol?.toUpperCase?.() || formData.symbol,
      instrument_type: formData.instrument_type,
      direction: formData.direction,
      status: formData.status,
      strategy: formData.strategy,
      notes: formData.notes,
    };

    // compute metrics only if we have an exit price and the trade is closed
    if (tradeData.exit_price && tradeData.status === 'closed') {
      const metrics = calculateTradeMetrics(tradeData as Trade);
      tradeData.profit_loss = metrics.profit_loss;
      tradeData.profit_loss_percent = metrics.profit_loss_percent;
    } else {
      tradeData.profit_loss = null;
      tradeData.profit_loss_percent = null;
    }

    onSubmit(tradeData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {trade ? 'Edit Trade' : 'Add New Trade'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Account
              </label>
              <select
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Symbol */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Symbol
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                required
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="AAPL"
              />
            </div>

            {/* Instrument Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Instrument Type
              </label>
              <select
                value={formData.instrument_type}
                onChange={(e) => setFormData({ ...formData, instrument_type: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="stocks">Stocks</option>
                <option value="forex">Forex</option>
                <option value="futures">Futures</option>
                <option value="options">Options</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>

            {/* Direction */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Direction
              </label>
              <select
                value={formData.direction}
                onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Quantity
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.quantity as any}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                required
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Leverage */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Leverage (optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.leverage ?? ''}
                onChange={(e) => setFormData({ ...formData, leverage: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="1.5"
              />
            </div>

            {/* Entry Price */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Entry Price
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.entry_price as any}
                onChange={(e) => setFormData({ ...formData, entry_price: Number(e.target.value) })}
                required
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Exit Price */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Exit Price
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.exit_price ?? ''}
                onChange={(e) => setFormData({ ...formData, exit_price: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Entry Timestamp */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Entry Timestamp
              </label>
              <input
                type="datetime-local"
                value={formData.entry_timestamp}
                onChange={(e) => setFormData({ ...formData, entry_timestamp: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Exit Timestamp */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Exit Timestamp
              </label>
              <input
                type="datetime-local"
                value={formData.exit_timestamp}
                onChange={(e) => setFormData({ ...formData, exit_timestamp: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Fees */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fees
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.fees as any}
                onChange={(e) => setFormData({ ...formData, fees: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Commission */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Commission
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.commission as any}
                onChange={(e) => setFormData({ ...formData, commission: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Slippage */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Slippage
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.slippage as any}
                onChange={(e) => setFormData({ ...formData, slippage: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Strategy */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Strategy
              </label>
              <select
                value={isCustomStrategy ? 'custom' : selectedStrategyId}
                onChange={(e) => handleStrategyChange(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">Select a strategy...</option>
                {strategies.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.title}
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>

              {isCustomStrategy && (
                <input
                  type="text"
                  value={formData.strategy}
                  onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white mt-2"
                  placeholder="Enter custom strategy name"
                />
              )}

              {selectedStrategy && !isCustomStrategy && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Strategy Details:</p>
                  <div className="text-slate-700 dark:text-slate-300">
                    {selectedStrategy.is_bulleted ? (
                      <ul className="list-disc space-y-1">
                        {formatStrategyBody(selectedStrategy.body, true)}
                      </ul>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {formatStrategyBody(selectedStrategy.body, false)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="swing, tech, earnings"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="Trade notes, reasons for entry/exit, etc."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors"
            >
              {trade ? 'Update Trade' : 'Add Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
