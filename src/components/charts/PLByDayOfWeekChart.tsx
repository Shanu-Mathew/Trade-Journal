import { Database } from '../../lib/database.types';

type Trade = Database['public']['Tables']['trades']['Row'];

interface PLByDayOfWeekChartProps {
  trades: Trade[];
}

export default function PLByDayOfWeekChart({ trades }: PLByDayOfWeekChartProps) {
  const closedTrades = trades.filter(t => t.status === 'closed' && t.profit_loss !== null);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayPL = new Array(7).fill(0);

  closedTrades.forEach(trade => {
    const date = new Date(trade.exit_timestamp ?? trade.entry_timestamp);
    const dayIndex = date.getDay();
    dayPL[dayIndex] += trade.profit_loss ?? 0;
  });

  if (closedTrades.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">P&L by Day of Week</h3>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          No closed trades yet
        </div>
      </div>
    );
  }

  const maxAbsPL = Math.max(...dayPL.map(Math.abs), 1);
  const chartHeight = 300;
  const barWidth = 60;
  const gap = 20;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">P&L by Day of Week</h3>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${(barWidth + gap) * 7 + gap} ${chartHeight}`} className="w-full h-64">
          {dayPL.map((pl, index) => {
            const barHeight = Math.abs(pl) / maxAbsPL * (chartHeight / 2 - 20);
            const x = gap + index * (barWidth + gap);
            const y = pl >= 0 ? chartHeight / 2 - barHeight : chartHeight / 2;
            const color = pl >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';

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
                  <title>{`${dayNames[index]}: $${pl.toFixed(2)}`}</title>
                </rect>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 5}
                  textAnchor="middle"
                  className="text-xs fill-slate-600 dark:fill-slate-400"
                >
                  {dayNames[index].slice(0, 3)}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={pl >= 0 ? y - 5 : y + barHeight + 15}
                  textAnchor="middle"
                  className="text-xs fill-slate-700 dark:fill-slate-300 font-semibold"
                >
                  ${pl.toFixed(0)}
                </text>
              </g>
            );
          })}
          <line
            x1="0"
            y1={chartHeight / 2}
            x2={(barWidth + gap) * 7 + gap}
            y2={chartHeight / 2}
            stroke="rgb(148, 163, 184)"
            strokeWidth="1"
            strokeDasharray="4"
          />
        </svg>
      </div>
    </div>
  );
}
