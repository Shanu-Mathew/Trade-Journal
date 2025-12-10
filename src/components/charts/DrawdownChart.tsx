import { useState, useRef, useMemo } from 'react';
import { Database } from '../../lib/database.types';
import ChartTooltip from './ChartTooltip';
import ChartInfoButton from './ChartInfoButton';

type Trade = Database['public']['Tables']['trades']['Row'];

interface DrawdownChartProps {
  trades: Trade[];
  initialBalance: number;
}

export default function DrawdownChart({ trades, initialBalance }: DrawdownChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);
  const chartRef = useRef<SVGSVGElement>(null);

  const closedTrades = useMemo(() =>
    trades
      .filter(t => t.status === 'closed' && t.profit_loss !== null)
      .sort((a, b) =>
        new Date(a.exit_timestamp ?? a.entry_timestamp).getTime() -
        new Date(b.exit_timestamp ?? b.entry_timestamp).getTime()
      ),
    [trades]
  );

  const drawdownPoints = useMemo(() => {
    const points: { index: number; drawdown: number; drawdownPercent: number; date: string }[] = [];
    let runningBalance = initialBalance;
    let peak = initialBalance;

    closedTrades.forEach((trade, index) => {
      runningBalance += trade.profit_loss ?? 0;
      if (runningBalance > peak) {
        peak = runningBalance;
      }
      const drawdown = peak - runningBalance;
      const drawdownPercent = (drawdown / peak) * 100;
      points.push({
        index,
        drawdown,
        drawdownPercent,
        date: new Date(trade.exit_timestamp ?? trade.entry_timestamp).toLocaleDateString(),
      });
    });

    return points;
  }, [closedTrades, initialBalance]);

  if (closedTrades.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Drawdown</h3>
          <ChartInfoButton
            title="Drawdown"
            description="Shows the decline from peak equity to trough. Helps you understand the risk and potential losses during trading periods."
          />
        </div>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          No closed trades yet
        </div>
      </div>
    );
  }

  const maxDrawdown = Math.max(...drawdownPoints.map(p => p.drawdown), 0);
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const getX = (index: number) => padding.left + (index / (drawdownPoints.length - 1 || 1)) * innerWidth;
  const getY = (drawdown: number) => padding.top + innerHeight - ((drawdown / (maxDrawdown || 1)) * innerHeight);

  const pathData = drawdownPoints.map((point, index) => {
    const x = getX(index);
    const y = getY(point.drawdown);
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  const areaData = `${pathData} L ${getX(drawdownPoints.length - 1)} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`;

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
    const index = Math.round((relativeX / innerWidth) * (drawdownPoints.length - 1));
    const clampedIndex = Math.max(0, Math.min(index, drawdownPoints.length - 1));
    setHoveredPoint(clampedIndex);
  };

  const handleMouseLeave = () => {
    setCrosshair(null);
    setHoveredPoint(null);
  };

  const yAxisTicks = 5;
  const yAxisValues = Array.from({ length: yAxisTicks }, (_, i) =>
    (maxDrawdown * i) / (yAxisTicks - 1)
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Drawdown</h3>
        <ChartInfoButton
          title="Drawdown"
          description="Shows the decline from peak equity to trough. Helps you understand the risk and potential losses during trading periods."
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
            <linearGradient id="drawdownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {yAxisValues.map((value, i) => (
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
                -${value.toFixed(0)}
              </text>
            </g>
          ))}

          <path d={areaData} fill="url(#drawdownGradient)" />
          <path
            d={pathData}
            fill="none"
            stroke="rgb(239, 68, 68)"
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

          {drawdownPoints.map((point, index) => {
            const isHovered = hoveredPoint === index;
            return (
              <circle
                key={index}
                cx={getX(index)}
                cy={getY(point.drawdown)}
                r={isHovered ? 6 : 3}
                fill="rgb(239, 68, 68)"
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
            <div className="font-semibold">{drawdownPoints[hoveredPoint].date}</div>
            <div className="text-red-400">
              Drawdown: -${drawdownPoints[hoveredPoint].drawdown.toFixed(2)}
            </div>
            <div className="text-red-400">
              ({drawdownPoints[hoveredPoint].drawdownPercent.toFixed(2)}%)
            </div>
            <div className="text-xs text-slate-400 border-t border-slate-700 pt-1 mt-1">
              Trade {hoveredPoint + 1} of {drawdownPoints.length}
            </div>
          </div>
        </ChartTooltip>
      )}

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-slate-600 dark:text-slate-400">
          Max Drawdown: <span className="font-semibold text-red-600 dark:text-red-400">
            -${maxDrawdown.toFixed(2)}
          </span>
        </div>
        <div className="text-slate-600 dark:text-slate-400">
          Max Drawdown %: <span className="font-semibold text-red-600 dark:text-red-400">
            {maxDrawdown > 0 ? `${((maxDrawdown / initialBalance) * 100).toFixed(2)}%` : '0%'}
          </span>
        </div>
      </div>
    </div>
  );
}
