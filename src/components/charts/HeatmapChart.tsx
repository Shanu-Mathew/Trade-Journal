import { Database } from '../../lib/database.types';

type Trade = Database['public']['Tables']['trades']['Row'];

interface HeatmapChartProps {
  trades: Trade[];
}

export default function HeatmapChart({ trades }: HeatmapChartProps) {
  const closedTrades = trades.filter(t => t.status === 'closed' && t.profit_loss !== null);

  if (closedTrades.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Trading Heatmap (Day x Hour)
        </h3>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          No closed trades yet
        </div>
      </div>
    );
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const heatmapData: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));

  closedTrades.forEach(trade => {
    const date = new Date(trade.exit_timestamp ?? trade.entry_timestamp);
    const day = date.getDay();
    const hour = date.getHours();
    heatmapData[day][hour] += trade.profit_loss ?? 0;
  });

  const allValues = heatmapData.flat();
  const maxAbsPL = Math.max(...allValues.map(Math.abs), 1);

  const cellSize = 25;
  const labelWidth = 40;
  const labelHeight = 20;
  const chartWidth = 24 * cellSize + labelWidth;
  const chartHeight = 7 * cellSize + labelHeight;

  const getColor = (value: number) => {
    if (value === 0) return 'rgb(226, 232, 240)';
    const intensity = Math.abs(value) / maxAbsPL;
    if (value > 0) {
      const green = Math.floor(255 - intensity * 100);
      return `rgb(34, ${197 - intensity * 100}, 94)`;
    } else {
      return `rgb(${239 - intensity * 100}, 68, 68)`;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Trading Heatmap (Day x Hour)
      </h3>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ height: 'auto' }}>
          {heatmapData.map((dayData, dayIndex) => (
            <g key={dayIndex}>
              <text
                x="5"
                y={labelHeight + dayIndex * cellSize + cellSize / 2 + 5}
                className="text-xs fill-slate-600 dark:fill-slate-400"
              >
                {dayNames[dayIndex]}
              </text>
              {dayData.map((value, hourIndex) => (
                <rect
                  key={hourIndex}
                  x={labelWidth + hourIndex * cellSize}
                  y={labelHeight + dayIndex * cellSize}
                  width={cellSize - 2}
                  height={cellSize - 2}
                  fill={getColor(value)}
                  rx="3"
                  className="hover:opacity-75 transition-opacity cursor-pointer"
                >
                  <title>{`${dayNames[dayIndex]} ${hourIndex}:00 - ${value > 0 ? '+' : ''}$${value.toFixed(2)}`}</title>
                </rect>
              ))}
            </g>
          ))}

          {Array.from({ length: 24 }, (_, i) => i).filter(h => h % 3 === 0).map(hour => (
            <text
              key={hour}
              x={labelWidth + hour * cellSize + cellSize / 2}
              y="15"
              textAnchor="middle"
              className="text-xs fill-slate-600 dark:fill-slate-400"
            >
              {hour}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
