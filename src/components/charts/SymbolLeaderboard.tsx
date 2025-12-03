import { Database } from '../../lib/database.types';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Trade = Database['public']['Tables']['trades']['Row'];

interface SymbolLeaderboardProps {
  trades: Trade[];
}

export default function SymbolLeaderboard({ trades }: SymbolLeaderboardProps) {
  const closedTrades = trades.filter(t => t.status === 'closed' && t.profit_loss !== null);

  if (closedTrades.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Symbol Leaderboard</h3>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          No closed trades yet
        </div>
      </div>
    );
  }

  const symbolStats = new Map<string, { totalPL: number; count: number; winCount: number }>();

  closedTrades.forEach(trade => {
    const existing = symbolStats.get(trade.symbol) || { totalPL: 0, count: 0, winCount: 0 };
    existing.totalPL += trade.profit_loss ?? 0;
    existing.count++;
    if ((trade.profit_loss ?? 0) > 0) existing.winCount++;
    symbolStats.set(trade.symbol, existing);
  });

  const symbols = Array.from(symbolStats.entries())
    .map(([symbol, stats]) => ({
      symbol,
      totalPL: stats.totalPL,
      avgPL: stats.totalPL / stats.count,
      winRate: (stats.winCount / stats.count) * 100,
      count: stats.count,
    }))
    .sort((a, b) => b.totalPL - a.totalPL)
    .slice(0, 10);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Symbol Leaderboard</h3>
      <div className="space-y-2">
        {symbols.map((symbol, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-300">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-900 dark:text-white truncate">
                  {symbol.symbol}
                </span>
                <span className={`font-bold ${
                  symbol.totalPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  ${symbol.totalPL.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>{symbol.count} trades • {symbol.winRate.toFixed(0)}% WR</span>
                <span>Avg: ${symbol.avgPL.toFixed(2)}</span>
              </div>
            </div>
            {symbol.totalPL >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
