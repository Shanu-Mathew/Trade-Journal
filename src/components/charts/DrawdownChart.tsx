import { Database } from '../../lib/database.types';

type Trade = Database['public']['Tables']['trades']['Row'];

interface DrawdownChartProps {
  trades: Trade[];
  initialBalance: number;
}

export default function DrawdownChart({ trades, initialBalance }: DrawdownChartProps) {
  const closedTrades = trades
    .filter(t => t.status === 'closed' && t.profit_loss !== null)
    .sort((a, b) =>
      new Date(a.exit_timestamp ?? a.entry_timestamp).getTime() -
      new Date(b.exit_timestamp ?? b.entry_timestamp).getTime()
    );

  if (closedTrades.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Drawdown</h3>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          No closed trades yet
        </div>
      </div>
    );
  }

  const drawdownPoints: { index: number; drawdown: number; drawdownPercent: number }[] = [];
  let runningBalance = initialBalance;
  let peak = initialBalance;

  closedTrades.forEach((trade, index) => {
    runningBalance += trade.profit_loss ?? 0;
    if (runningBalance > peak) {
      peak = runningBalance;
    }
    const drawdown = peak - runningBalance;
    const drawdownPercent = (drawdown / peak) * 100;
    drawdownPoints.push({ index, drawdown, drawdownPercent });
  });

  const maxDrawdown = Math.max(...drawdownPoints.map(p => p.drawdown), 0);
  const chartWidth = 800;
  const chartHeight = 300;
  const stepX = chartWidth / (drawdownPoints.length - 1 || 1);

  const getY = (drawdown: number) => {
    return chartHeight - (drawdown / (maxDrawdown || 1)) * (chartHeight - 40);
  };

  const pathData = drawdownPoints.map((point, index) => {
    const x = index * stepX;
    const y = getY(point.drawdown);
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  const areaData = `${pathData} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Drawdown</h3>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-64">
          <defs>
            <linearGradient id="drawdownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <path
            d={areaData}
            fill="url(#drawdownGradient)"
          />
          <path
            d={pathData}
            fill="none"
            stroke="rgb(239, 68, 68)"
            strokeWidth="2"
          />

          {drawdownPoints.map((point, index) => (
            <circle
              key={index}
              cx={index * stepX}
              cy={getY(point.drawdown)}
              r="3"
              fill="rgb(239, 68, 68)"
              className="hover:r-5 transition-all cursor-pointer"
            >
              <title>{`Trade ${index + 1}: -$${point.drawdown.toFixed(2)} (-${point.drawdownPercent.toFixed(2)}%)`}</title>
            </circle>
          ))}

          <line
            x1="0"
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
            stroke="rgb(148, 163, 184)"
            strokeWidth="1"
          />
        </svg>
      </div>
      <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        Max Drawdown: <span className="font-semibold text-red-600 dark:text-red-400">
          ${maxDrawdown.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
