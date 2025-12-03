// CSVImportModal.tsx
import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { calculateTradeMetrics } from '../../utils/tradeCalculations';

type Account = Database['public']['Tables']['accounts']['Row'];

interface CSVImportModalProps {
  accounts: Account[];
  onClose: () => void;
  onImport: () => void;
}

export default function CSVImportModal({ accounts, onClose, onImport }: CSVImportModalProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  // convert various CSV timestamp formats -> ISO (best-effort)
  const toIsoTimestamp = (value: string | undefined | null): string | null => {
    if (!value) return null;
    // Try Date parsing
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
    // Try replacing space with T (common CSV format "YYYY-MM-DD HH:MM")
    const alt = value.replace(' ', 'T');
    const d2 = new Date(alt);
    if (!isNaN(d2.getTime())) return d2.toISOString();

    // Try replacing slashes
    const cleaned = value.replace(/\//g, '-');
    const d3 = new Date(cleaned);
    if (!isNaN(d3.getTime())) return d3.toISOString();

    // fallback: return original string (may show empty in datetime-local)
    return value;
  };

  const normalizeHeaders = (rawHeaders: string[]) => {
    return rawHeaders.map(h => h.trim().toLowerCase().replace(/["' ]+/g, '_'));
  };

  const handleImport = async () => {
    if (!file || accounts.length === 0) return;

    setImporting(true);
    setError('');

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('CSV appears empty or has no data rows.');
      }

      const rawHeaders = lines[0].split(',').map(h => h.trim());
      const headers = normalizeHeaders(rawHeaders);

      // Required checks
      const hasEntryTime = headers.some(h => h.includes('entry') && h.includes('time')) ||
                           headers.some(h => h.includes('entry_timestamp'));
      const hasExitTime = headers.some(h => h.includes('exit') && h.includes('time')) ||
                          headers.some(h => h.includes('exit_timestamp'));
      const hasLeverage = headers.some(h => h.includes('leverage'));

      const missing: string[] = [];
      if (!hasEntryTime) missing.push('entry_time / entry_timestamp');
      if (!hasExitTime) missing.push('exit_time / exit_timestamp');
      if (!hasLeverage) missing.push('leverage');

      if (missing.length > 0) {
        throw new Error(
          `CSV must include the following headers: ${missing.join(', ')}. ` +
          `Example headers: symbol,instrument_type,direction,quantity,entry_price,exit_price,entry_time,exit_time,leverage,fees,commission,strategy,status`
        );
      }

      const trades = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const trade: any = {};

        headers.forEach((header, index) => {
          const value = values[index] ?? '';

          // basic mappings (robust to common header names)
          if (header.includes('symbol')) trade.symbol = value.toUpperCase();
          if (header.includes('type') || header.includes('instrument')) trade.instrument_type = value.toLowerCase() || null;
          if (header.includes('direction') || header.includes('side')) trade.direction = value.toLowerCase() || 'long';
          if (header.includes('quantity') || header.includes('size')) trade.quantity = parseFloat(value) || 0;
          if (header.includes('entry') && header.includes('price')) trade.entry_price = parseFloat(value) || 0;
          if (header.includes('exit') && header.includes('price')) trade.exit_price = value ? parseFloat(value) : null;

          // timestamps
          if ((header.includes('entry') && header.includes('time')) || header.includes('entry_timestamp')) {
            trade.entry_timestamp = toIsoTimestamp(value);
          }
          // FIXED: previously incorrectly wrote to entry_timestamp here (typo). Now sets exit_timestamp.
          if ((header.includes('exit') && header.includes('time')) || header.includes('exit_timestamp')) {
            trade.exit_timestamp = toIsoTimestamp(value) || null;
          }

          // fees / commission
          if (header.includes('fee')) trade.fees = value ? parseFloat(value) : 0;
          if (header.includes('commission')) trade.commission = value ? parseFloat(value) : 0;

          // leverage
          if (header.includes('leverage')) {
            trade.leverage = value ? parseFloat(value) : null;
          }

          if (header.includes('strategy')) trade.strategy = value || null;
          if (header.includes('status')) trade.status = value.toLowerCase() || 'open';
        });

        // defaults
        trade.user_id = user!.id;
        trade.account_id = accounts[0].id;
        trade.slippage = trade.slippage ?? 0;
        trade.tags = trade.tags ?? [];

        // Ensure numeric values
        trade.quantity = Number(trade.quantity) || 0;
        trade.leverage = trade.leverage ? Number(trade.leverage) : null;

        // NOTE: Do NOT apply leverage to stored quantity.
        // Leverage should only affect P/L calculation — leave `trade.quantity` as-is.

        // compute metrics if closed (calculateTradeMetrics uses trade.leverage internally)
        if (trade.exit_price && trade.status === 'closed') {
          const metrics = calculateTradeMetrics(trade as any);
          trade.profit_loss = metrics.profit_loss;
          trade.profit_loss_percent = metrics.profit_loss_percent;
        } else {
          trade.profit_loss = null;
          trade.profit_loss_percent = null;
        }

        return trade;
      }).filter(trade => trade.symbol && trade.entry_price !== undefined && trade.quantity !== undefined);

      if (trades.length === 0) {
        throw new Error('No valid trades found in CSV (missing symbol/entry_price/quantity).');
      }

      const { error: insertError } = await supabase.from('trades').insert(trades);

      if (insertError) throw insertError;

      onImport();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Import Trades from CSV</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Expected CSV Format</h3>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Your CSV must include these headers (case-insensitive): <br/>
              <strong>symbol, instrument_type, direction, quantity, entry_price, exit_price, entry_time, exit_time, leverage, fees, commission, strategy, status</strong>
              <br/>
              Header synonyms supported: <em>entry_timestamp</em>, <em>exit_timestamp</em>, <em>size</em> for quantity, etc.
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Choose CSV File
            </label>
            {file && (
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                Selected: {file.name}
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
