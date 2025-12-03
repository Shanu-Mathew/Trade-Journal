import { Database } from '../../lib/database.types';

type Trade = Database['public']['Tables']['trades']['Row'];

interface EquityCurveChartProps {
  trades: Trade[];
  initialBalance: number;
}

export default function EquityCurveChart({ trades, initialBalance }: EquityCurveChartProps) {
  const closedTrades = trades
    .filter(t => t.status === 'closed' && t.profit_loss !== null)
    .sort((a, b) =>
      new Date(a.exit_timestamp ?? a.entry_timestamp).getTime() -
      new Date(b.exit_timestamp ?? b.entry_timestamp).getTime()
    );

  const equityPoints: { date: string; balance: number }[] = [
    { date: 'Start', balance: initialBalance }
  ];

  let runningBalance = initialBalance;
  closedTrades.forEach((trade, index) => {
    runningBalance += trade.profit_loss ?? 0;
    equityPoints.push({
      date: index === closedTrades.length - 1 ? 'Now' : `Trade ${index + 1}`,
      balance: runningBalance
    });
  });

  if (equityPoints.length === 1) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Equity Curve</h3>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          No closed trades yet
        </div>
      </div>
    );
  }

  const maxBalance = Math.max(...equityPoints.map(p => p.balance));
  const minBalance = Math.min(...equityPoints.map(p => p.balance));
  const range = maxBalance - minBalance || 1;
  const padding = range * 0.1;

  const chartWidth = 800;
  const chartHeight = 300;
  const stepX = chartWidth / (equityPoints.length - 1);

  const getY = (balance: number) => {
    return chartHeight - ((balance - minBalance + padding) / (range + 2 * padding)) * chartHeight;
  };

  const pathData = equityPoints.map((point, index) => {
    const x = index * stepX;
    const y = getY(point.balance);
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  const areaData = `${pathData} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Equity Curve</h3>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-64">
          <defs>
            <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <path
            d={areaData}
            fill="url(#equityGradient)"
          />
          <path
            d={pathData}
            fill="none"
            stroke="rgb(59, 130, 246)"
            strokeWidth="2"
          />

          {equityPoints.map((point, index) => (
            <circle
              key={index}
              cx={index * stepX}
              cy={getY(point.balance)}
              r="4"
              fill="rgb(59, 130, 246)"
              className="hover:r-6 transition-all cursor-pointer"
            >
              <title>{`${point.date}: $${point.balance.toFixed(2)}`}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-slate-600 dark:text-slate-400">
          Start: ${initialBalance.toFixed(2)}
        </span>
        <span className={`font-semibold ${
          runningBalance >= initialBalance ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
          Current: ${runningBalance.toFixed(2)} ({((runningBalance - initialBalance) / initialBalance * 100).toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}
