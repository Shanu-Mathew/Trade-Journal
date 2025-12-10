import { useState, useRef, useMemo } from 'react';
import { Database } from '../../lib/database.types';
import ChartTooltip from './ChartTooltip';
import ChartInfoButton from './ChartInfoButton';

type Trade = Database['public']['Tables']['trades']['Row'];

interface EquityCurveChartProps {
  trades: Trade[];
  initialBalance: number;
}

export default function EquityCurveChart({ trades, initialBalance }: EquityCurveChartProps) {
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

  const equityPoints = useMemo(() => {
    const points: { balance: number; date: string; trade: Trade; index: number }[] = [];
    let runningBalance = initialBalance;

    closedTrades.forEach((trade, index) => {
      runningBalance += trade.profit_loss ?? 0;
      points.push({
        balance: runningBalance,
        date: new Date(trade.exit_timestamp ?? trade.entry_timestamp).toLocaleDateString(),
        trade,
        index,
      });
    });

    return points;
  }, [closedTrades, initialBalance]);

  if (closedTrades.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Equity Curve</h3>
          <ChartInfoButton
            title="Equity Curve"
            description="Shows your account balance over time. A rising curve indicates profitable trading, while dips show drawdown periods."
          />
        </div>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          No closed trades yet
        </div>
      </div>
    );
  }

  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const minBalance = Math.min(initialBalance, ...equityPoints.map(p => p.balance));
  const maxBalance = Math.max(initialBalance, ...equityPoints.map(p => p.balance));
  const balanceRange = maxBalance - minBalance || 1;

  const getX = (index: number) => padding.left + (index / (equityPoints.length - 1 || 1)) * innerWidth;
  const getY = (balance: number) => padding.top + innerHeight - ((balance - minBalance) / balanceRange) * innerHeight;

  const pathData = `M ${padding.left} ${getY(initialBalance)} ` +
    equityPoints.map((point, index) => `L ${getX(index)} ${getY(point.balance)}`).join(' ');

  const areaData = `${pathData} L ${getX(equityPoints.length - 1)} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`;

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
    const index = Math.round((relativeX / innerWidth) * (equityPoints.length - 1));
    const clampedIndex = Math.max(0, Math.min(index, equityPoints.length - 1));
    setHoveredPoint(clampedIndex);
  };

  const handleMouseLeave = () => {
    setCrosshair(null);
    setHoveredPoint(null);
  };

  const yAxisTicks = 5;
  const yAxisValues = Array.from({ length: yAxisTicks }, (_, i) =>
    minBalance + (balanceRange * i) / (yAxisTicks - 1)
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Equity Curve</h3>
        <ChartInfoButton
          title="Equity Curve"
          description="Shows your account balance over time. A rising curve indicates profitable trading, while dips show drawdown periods."
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
            <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
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
                ${value.toFixed(0)}
              </text>
            </g>
          ))}

          <path d={areaData} fill="url(#equityGradient)" />
          <path
            d={pathData}
            fill="none"
            stroke="rgb(59, 130, 246)"
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

          {equityPoints.map((point, index) => {
            const isHovered = hoveredPoint === index;
            return (
              <circle
                key={index}
                cx={getX(index)}
                cy={getY(point.balance)}
                r={isHovered ? 6 : 3}
                fill="rgb(59, 130, 246)"
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
            <div className="font-semibold">{equityPoints[hoveredPoint].date}</div>
            <div>Balance: ${equityPoints[hoveredPoint].balance.toFixed(2)}</div>
            <div className={equityPoints[hoveredPoint].trade.profit_loss! >= 0 ? 'text-green-400' : 'text-red-400'}>
              P/L: {equityPoints[hoveredPoint].trade.profit_loss! >= 0 ? '+' : ''}
              ${equityPoints[hoveredPoint].trade.profit_loss!.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 border-t border-slate-700 pt-1 mt-1">
              {equityPoints[hoveredPoint].trade.symbol} • {equityPoints[hoveredPoint].trade.direction}
            </div>
          </div>
        </ChartTooltip>
      )}

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-slate-600 dark:text-slate-400">
          Start: <span className="font-semibold text-slate-900 dark:text-white">${initialBalance.toFixed(2)}</span>
        </div>
        <div className="text-slate-600 dark:text-slate-400">
          Current: <span className="font-semibold text-slate-900 dark:text-white">
            ${equityPoints[equityPoints.length - 1].balance.toFixed(2)}
          </span>
        </div>
        <div className="text-slate-600 dark:text-slate-400">
          Change: <span className={`font-semibold ${
            equityPoints[equityPoints.length - 1].balance >= initialBalance ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {equityPoints[equityPoints.length - 1].balance >= initialBalance ? '+' : ''}
            ${(equityPoints[equityPoints.length - 1].balance - initialBalance).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
