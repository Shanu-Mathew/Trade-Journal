import { Database } from '../../lib/database.types';

type Trade = Database['public']['Tables']['trades']['Row'];

interface StrategyComparisonChartProps {
  trades: Trade[];
}

export default function StrategyComparisonChart({ trades }: StrategyComparisonChartProps) {
  const closedTrades = trades.filter(t => t.status === 'closed' && t.profit_loss !== null);

  if (closedTrades.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Strategy Comparison</h3>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          No closed trades yet
        </div>
      </div>
    );
  }

  const strategyStats = new Map<string, { totalPL: number; count: number; winCount: number }>();

  closedTrades.forEach(trade => {
    const strategy = trade.strategy || 'No Strategy';
    const existing = strategyStats.get(strategy) || { totalPL: 0, count: 0, winCount: 0 };
    existing.totalPL += trade.profit_loss ?? 0;
    existing.count++;
    if ((trade.profit_loss ?? 0) > 0) existing.winCount++;
    strategyStats.set(strategy, existing);
  });

  const strategies = Array.from(strategyStats.entries())
    .map(([name, stats]) => ({
      name,
      totalPL: stats.totalPL,
      avgPL: stats.totalPL / stats.count,
      winRate: (stats.winCount / stats.count) * 100,
      count: stats.count,
    }))
    .sort((a, b) => b.totalPL - a.totalPL)
    .slice(0, 10);

  if (strategies.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Strategy Comparison</h3>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          No strategies found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Strategy Comparison</h3>
      <div className="space-y-3">
        {strategies.map((strategy, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                {strategy.name}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-slate-500 dark:text-slate-400 text-xs">
                  {strategy.count} trades
                </span>
                <span className={`font-semibold ${
                  strategy.totalPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  ${strategy.totalPL.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    strategy.totalPL >= 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${strategy.winRate}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 w-12 text-right">
                {strategy.winRate.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
