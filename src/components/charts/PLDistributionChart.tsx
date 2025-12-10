import { useState, useMemo } from 'react';
import { Database } from '../../lib/database.types';
import ChartTooltip from './ChartTooltip';
import ChartInfoButton from './ChartInfoButton';

type Trade = Database['public']['Tables']['trades']['Row'];

interface PLDistributionChartProps {
  trades: Trade[];
}

export default function PLDistributionChart({ trades }: PLDistributionChartProps) {
  const [hoveredBin, setHoveredBin] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const distribution = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.profit_loss !== null);

    if (closedTrades.length === 0) return { bins: [], maxCount: 0 };

    const plValues = closedTrades.map(t => t.profit_loss!);
    const minPL = Math.min(...plValues);
    const maxPL = Math.max(...plValues);
    const binCount = 10;
    const binSize = (maxPL - minPL) / binCount || 1;

    const bins = Array.from({ length: binCount }, (_, i) => ({
      min: minPL + i * binSize,
      max: minPL + (i + 1) * binSize,
      count: 0,
      trades: [] as Trade[],
    }));

    closedTrades.forEach(trade => {
      const pl = trade.profit_loss!;
      const binIndex = Math.min(Math.floor((pl - minPL) / binSize), binCount - 1);
      bins[binIndex].count++;
      bins[binIndex].trades.push(trade);
    });

    const maxCount = Math.max(...bins.map(b => b.count), 1);

    return { bins, maxCount };
  }, [trades]);

  if (distribution.bins.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">P/L Distribution</h3>
          <ChartInfoButton
            title="P/L Distribution"
            description="Histogram showing the distribution of your trade profits and losses. Helps identify your typical win/loss sizes."
          />
        </div>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          No closed trades yet
        </div>
      </div>
    );
  }

  const chartHeight = 240;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">P/L Distribution</h3>
        <ChartInfoButton
          title="P/L Distribution"
          description="Histogram showing the distribution of your trade profits and losses. Helps identify your typical win/loss sizes."
        />
      </div>

      <div className="relative" style={{ height: `${chartHeight}px` }}>
        <div className="flex items-end justify-around h-full gap-1 px-4">
          {distribution.bins.map((bin, index) => {
            const heightPercent = (bin.count / distribution.maxCount) * 90;
            const isHovered = hoveredBin === index;
            const midPoint = (bin.min + bin.max) / 2;
            const color = midPoint >= 0 ? 'bg-green-500 dark:bg-green-600' : 'bg-red-500 dark:bg-red-600';

            return (
              <div
                key={index}
                className="flex flex-col items-center flex-1 cursor-pointer"
                style={{ height: '100%' }}
                onMouseEnter={(e) => {
                  setHoveredBin(index);
                  setMousePos({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setMousePos({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredBin(null)}
              >
                <div className="flex-1 flex flex-col justify-end items-center w-full">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 ${color} ${
                      isHovered ? 'opacity-100 shadow-lg scale-x-105' : 'opacity-80'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hoveredBin !== null && (
        <ChartTooltip x={mousePos.x} y={mousePos.y} visible={true}>
          <div className="space-y-1">
            <div className="font-semibold">
              ${distribution.bins[hoveredBin].min.toFixed(2)} to ${distribution.bins[hoveredBin].max.toFixed(2)}
            </div>
            <div className="text-slate-300">
              Trades: {distribution.bins[hoveredBin].count}
            </div>
            <div className="text-slate-300">
              {((distribution.bins[hoveredBin].count / trades.filter(t => t.status === 'closed').length) * 100).toFixed(1)}% of total
            </div>
          </div>
        </ChartTooltip>
      )}

      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-slate-600 dark:text-slate-400">Losses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-slate-600 dark:text-slate-400">Wins</span>
        </div>
      </div>
    </div>
  );
}
