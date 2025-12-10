import { useState, useRef, useMemo } from 'react';
import { Database } from '../../lib/database.types';
import ChartTooltip from './ChartTooltip';
import ChartInfoButton from './ChartInfoButton';

type Trade = Database['public']['Tables']['trades']['Row'];

interface RollingWinRateChartProps {
  trades: Trade[];
}

export default function RollingWinRateChart({ trades }: RollingWinRateChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);
  const chartRef = useRef<SVGSVGElement>(null);

  const rollingData = useMemo(() => {
    const closedTrades = trades
      .filter(t => t.status === 'closed' && t.profit_loss !== null)
      .sort((a, b) =>
        new Date(a.exit_timestamp ?? a.entry_timestamp).getTime() -
        new Date(b.exit_timestamp ?? b.entry_timestamp).getTime()
      );

    if (closedTrades.length < 10) return [];

    const windowSize = 20;
    const points: { index: number; winRate: number; wins: number; total: number; date: string }[] = [];

    for (let i = windowSize - 1; i < closedTrades.length; i++) {
      const window = closedTrades.slice(i - windowSize + 1, i + 1);
      const wins = window.filter(t => (t.profit_loss ?? 0) > 0).length;
      const winRate = (wins / windowSize) * 100;

      points.push({
        index: i,
        winRate,
        wins,
        total: windowSize,
        date: new Date(closedTrades[i].exit_timestamp ?? closedTrades[i].entry_timestamp).toLocaleDateString(),
      });
    }

    return points;
  }, [trades]);

  if (rollingData.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rolling Win Rate</h3>
          <ChartInfoButton
            title="Rolling Win Rate"
            description="Shows your win rate over the last 20 trades. Helps track consistency and identify improvement or degradation in performance."
          />
        </div>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          Need at least 10 closed trades
        </div>
      </div>
    );
  }

  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const getX = (index: number) => padding.left + (index / (rollingData.length - 1 || 1)) * innerWidth;
  const getY = (winRate: number) => padding.top + innerHeight - ((winRate / 100) * innerHeight);

  const pathData = rollingData.map((point, index) => {
    const x = getX(index);
    const y = getY(point.winRate);
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartRef.current) return;

    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < padding.left || x > chartWidth - padding.right || y < padding.top || y > chartHeight - padding.bottom) {
      setCrosshair(null);
      setHoveredPoint(null);
      return;
    }

    setCrosshair({ x, y });
    setMousePos({ x: e.clientX, y: e.clientY });

    const relativeX = x - padding.left;
    const index = Math.round((relativeX / innerWidth) * (rollingData.length - 1));
    const clampedIndex = Math.max(0, Math.min(index, rollingData.length - 1));
    setHoveredPoint(clampedIndex);
  };

  const handleMouseLeave = () => {
    setCrosshair(null);
    setHoveredPoint(null);
  };

  const yAxisTicks = [0, 25, 50, 75, 100];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rolling Win Rate (20 trades)</h3>
        <ChartInfoButton
          title="Rolling Win Rate"
          description="Shows your win rate over the last 20 trades. Helps track consistency and identify improvement or degradation in performance."
        />
      </div>

      <div className="overflow-x-auto">
        <svg
          ref={chartRef}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-64 cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="winRateGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {yAxisTicks.map((value, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={getY(value)}
                x2={chartWidth - padding.right}
                y2={getY(value)}
                stroke="rgb(226, 232, 240)"
                strokeWidth="1"
                className="dark:stroke-slate-700"
              />
              <text
                x={padding.left - 10}
                y={getY(value)}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-xs fill-slate-600 dark:fill-slate-400"
              >
                {value}%
              </text>
            </g>
          ))}

          <line
            x1={padding.left}
            y1={getY(50)}
            x2={chartWidth - padding.right}
            y2={getY(50)}
            stroke="rgb(148, 163, 184)"
            strokeWidth="2"
            strokeDasharray="6 4"
            className="dark:stroke-slate-600"
          />

          <path
            d={pathData}
            fill="none"
            stroke="rgb(34, 197, 94)"
            strokeWidth="2.5"
            className="drop-shadow-sm"
          />

          {crosshair && (
            <>
              <line
                x1={crosshair.x}
                y1={padding.top}
                x2={crosshair.x}
                y2={chartHeight - padding.bottom}
                stroke="rgb(148, 163, 184)"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="pointer-events-none"
              />
              <line
                x1={padding.left}
                y1={crosshair.y}
                x2={chartWidth - padding.right}
                y2={crosshair.y}
                stroke="rgb(148, 163, 184)"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="pointer-events-none"
              />
            </>
          )}

          {rollingData.map((point, index) => {
            const isHovered = hoveredPoint === index;
            return (
              <circle
                key={index}
                cx={getX(index)}
                cy={getY(point.winRate)}
                r={isHovered ? 6 : 3}
                fill="rgb(34, 197, 94)"
                stroke="white"
                strokeWidth={isHovered ? 2 : 0}
                className="transition-all duration-150 cursor-pointer"
              />
            );
          })}

          <line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={chartWidth - padding.right}
            y2={chartHeight - padding.bottom}
            stroke="rgb(148, 163, 184)"
            strokeWidth="2"
          />
        </svg>
      </div>

      {hoveredPoint !== null && (
        <ChartTooltip x={mousePos.x} y={mousePos.y} visible={true}>
          <div className="space-y-1">
            <div className="font-semibold">{rollingData[hoveredPoint].date}</div>
            <div className="text-green-400">
              Win Rate: {rollingData[hoveredPoint].winRate.toFixed(1)}%
            </div>
            <div className="text-slate-300">
              {rollingData[hoveredPoint].wins} wins out of {rollingData[hoveredPoint].total} trades
            </div>
            <div className="text-xs text-slate-400 border-t border-slate-700 pt-1 mt-1">
              Trade {rollingData[hoveredPoint].index + 1}
            </div>
          </div>
        </ChartTooltip>
      )}

      <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        Current Rolling Win Rate: <span className="font-semibold text-slate-900 dark:text-white">
          {rollingData[rollingData.length - 1].winRate.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
