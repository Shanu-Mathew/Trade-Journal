import { Database } from '../../lib/database.types';

type Trade = Database['public']['Tables']['trades']['Row'];

interface PLDistributionChartProps {
  trades: Trade[];
}

export default function PLDistributionChart({ trades }: PLDistributionChartProps) {
  const closedTrades = trades.filter(t => t.status === 'closed' && t.profit_loss !== null);

  if (closedTrades.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">P&L Distribution</h3>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          No closed trades yet
        </div>
      </div>
    );
  }

  const plValues = closedTrades.map(t => t.profit_loss ?? 0);
  const minPL = Math.min(...plValues);
  const maxPL = Math.max(...plValues);
  const range = maxPL - minPL;

  const binCount = 10;
  const binSize = range / binCount;
  const bins = new Array(binCount).fill(0);

  plValues.forEach(pl => {
    const binIndex = Math.min(Math.floor((pl - minPL) / binSize), binCount - 1);
    bins[binIndex]++;
  });

  const maxBinCount = Math.max(...bins);
  const chartWidth = 800;
  const chartHeight = 300;
  const barWidth = chartWidth / binCount - 10;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">P&L Distribution</h3>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-64">
          {bins.map((count, index) => {
            const barHeight = (count / maxBinCount) * (chartHeight - 40);
            const x = index * (chartWidth / binCount) + 5;
            const y = chartHeight - barHeight - 20;
            const binStart = minPL + index * binSize;
            const binEnd = binStart + binSize;
            const color = binStart >= 0 ? 'rgb(34, 197, 94)' : binEnd <= 0 ? 'rgb(239, 68, 68)' : 'rgb(148, 163, 184)';

            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  rx="4"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <title>{`${binStart.toFixed(0)} to ${binEnd.toFixed(0)}: ${count} trades`}</title>
                </rect>
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-xs fill-slate-700 dark:fill-slate-300"
                >
                  {count}
                </text>
              </g>
            );
          })}
          <line
            x1="0"
            y1={chartHeight - 20}
            x2={chartWidth}
            y2={chartHeight - 20}
            stroke="rgb(148, 163, 184)"
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  );
}
