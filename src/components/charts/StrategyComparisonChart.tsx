import { useState, useMemo } from 'react';
import { Database } from '../../lib/database.types';
import ChartTooltip from './ChartTooltip';
import ChartInfoButton from './ChartInfoButton';

type Trade = Database['public']['Tables']['trades']['Row'];

interface StrategyComparisonChartProps {
  trades: Trade[];
}

export default function StrategyComparisonChart({ trades }: StrategyComparisonChartProps) {
  const [hoveredStrategy, setHoveredStrategy] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const strategyData = useMemo(() => {
    const strategies: {
      [key: string]: {
        totalPL: number;
        tradeCount: number;
        winCount: number;
        avgWin: number;
        avgLoss: number;
      };
    } = {};

    trades
      .filter(t => t.status === 'closed' && t.profit_loss !== null)
      .forEach(trade => {
        const strategy = trade.strategy || 'No Strategy';

        if (!strategies[strategy]) {
          strategies[strategy] = {
            totalPL: 0,
            tradeCount: 0,
            winCount: 0,
            avgWin: 0,
            avgLoss: 0,
          };
        }

        strategies[strategy].totalPL += trade.profit_loss ?? 0;
        strategies[strategy].tradeCount++;

        if ((trade.profit_loss ?? 0) > 0) {
          strategies[strategy].winCount++;
        }
      });

    const sortedStrategies = Object.entries(strategies)
      .map(([name, stats]) => {
        const winRate = stats.tradeCount > 0 ? (stats.winCount / stats.tradeCount) * 100 : 0;
        const avgPL = stats.tradeCount > 0 ? stats.totalPL / stats.tradeCount : 0;
        return { name, ...stats, winRate, avgPL };
      })
      .sort((a, b) => b.totalPL - a.totalPL);

    return sortedStrategies;
  }, [trades]);

  if (strategyData.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Strategy Comparison</h3>
          <ChartInfoButton
            title="Strategy Comparison"
            description="Compare performance across different trading strategies. See which strategies are most profitable and consistent."
          />
        </div>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          No closed trades yet
        </div>
      </div>
    );
  }

  const maxAbsPL = Math.max(...strategyData.map(s => Math.abs(s.totalPL)), 1);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Strategy Comparison</h3>
        <ChartInfoButton
          title="Strategy Comparison"
          description="Compare performance across different trading strategies. See which strategies are most profitable and consistent."
        />
      </div>

      <div className="space-y-3">
        {strategyData.map((strategy) => {
          const widthPercent = (Math.abs(strategy.totalPL) / maxAbsPL) * 100;
          const isPositive = strategy.totalPL >= 0;
          const isHovered = hoveredStrategy === strategy.name;

          return (
            <div
              key={strategy.name}
              className="group cursor-pointer"
              onMouseEnter={(e) => {
                setHoveredStrategy(strategy.name);
                setMousePos({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => {
                setMousePos({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredStrategy(null)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {strategy.name}
                </span>
                <span className={`text-sm font-semibold ${
                  isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {isPositive ? '+' : ''}${strategy.totalPL.toFixed(2)}
                </span>
              </div>

              <div className="relative h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isPositive
                      ? 'bg-green-500 dark:bg-green-600'
                      : 'bg-red-500 dark:bg-red-600'
                  } ${isHovered ? 'opacity-100 shadow-lg' : 'opacity-80'}`}
                  style={{ width: `${widthPercent}%` }}
                />

                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 mix-blend-difference">
                    {strategy.tradeCount} trades • {strategy.winRate.toFixed(1)}% win rate
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hoveredStrategy && (
        <ChartTooltip x={mousePos.x} y={mousePos.y} visible={true}>
          <div className="space-y-1">
            {(() => {
              const strategy = strategyData.find(s => s.name === hoveredStrategy)!;
              return (
                <>
                  <div className="font-semibold">{strategy.name}</div>
                  <div className={strategy.totalPL >= 0 ? 'text-green-400' : 'text-red-400'}>
                    Total P/L: {strategy.totalPL >= 0 ? '+' : ''}${strategy.totalPL.toFixed(2)}
                  </div>
                  <div className="text-slate-300">
                    Trades: {strategy.tradeCount}
                  </div>
                  <div className="text-slate-300">
                    Win Rate: {strategy.winRate.toFixed(1)}%
                  </div>
                  <div className="text-slate-300">
                    Avg P/L: ${strategy.avgPL.toFixed(2)}
                  </div>
                </>
              );
            })()}
          </div>
        </ChartTooltip>
      )}

      {strategyData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
          Best Strategy: <span className="font-semibold text-green-600 dark:text-green-400">
            {strategyData[0].name} (+${strategyData[0].totalPL.toFixed(2)})
          </span>
        </div>
      )}
    </div>
  );
}
