import { Database } from '../../lib/database.types';

type Trade = Database['public']['Tables']['trades']['Row'];

interface RollingWinRateChartProps {
  trades: Trade[];
  window?: number;
}

export default function RollingWinRateChart({ trades, window = 30 }: RollingWinRateChartProps) {
  const closedTrades = trades
    .filter(t => t.status === 'closed' && t.profit_loss !== null)
    .sort((a, b) =>
      new Date(a.exit_timestamp ?? a.entry_timestamp).getTime() -
      new Date(b.exit_timestamp ?? b.entry_timestamp).getTime()
    );

  if (closedTrades.length < window) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Rolling Win Rate ({window}-trade window)
        </h3>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          Need at least {window} closed trades
        </div>
      </div>
    );
  }

  const rollingWinRates: number[] = [];

  for (let i = window - 1; i < closedTrades.length; i++) {
    const windowTrades = closedTrades.slice(i - window + 1, i + 1);
    const wins = windowTrades.filter(t => (t.profit_loss ?? 0) > 0).length;
    const winRate = (wins / window) * 100;
    rollingWinRates.push(winRate);
  }

  const chartWidth = 800;
  const chartHeight = 300;
  const stepX = chartWidth / (rollingWinRates.length - 1);

  const getY = (winRate: number) => {
    return chartHeight - (winRate / 100) * (chartHeight - 40) - 20;
  };

  const pathData = rollingWinRates.map((winRate, index) => {
    const x = index * stepX;
    const y = getY(winRate);
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Rolling Win Rate ({window}-trade window)
      </h3>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-64">
          <line
            x1="0"
            y1={getY(50)}
            x2={chartWidth}
            y2={getY(50)}
            stroke="rgb(148, 163, 184)"
            strokeWidth="1"
            strokeDasharray="4"
          />

          <path
            d={pathData}
            fill="none"
            stroke="rgb(139, 92, 246)"
            strokeWidth="2"
          />

          {rollingWinRates.map((winRate, index) => (
            <circle
              key={index}
              cx={index * stepX}
              cy={getY(winRate)}
              r="3"
              fill="rgb(139, 92, 246)"
              className="hover:r-5 transition-all cursor-pointer"
            >
              <title>{`After trade ${index + window}: ${winRate.toFixed(1)}%`}</title>
            </circle>
          ))}

          <text
            x="10"
            y={getY(50) - 5}
            className="text-xs fill-slate-500 dark:fill-slate-400"
          >
            50%
          </text>
        </svg>
      </div>
    </div>
  );
}
