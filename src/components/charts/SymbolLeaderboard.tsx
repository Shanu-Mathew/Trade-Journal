import { useState, useMemo } from 'react';
import { Database } from '../../lib/database.types';
import { TrendingUp, TrendingDown } from 'lucide-react';
import ChartTooltip from './ChartTooltip';
import ChartInfoButton from './ChartInfoButton';

type Trade = Database['public']['Tables']['trades']['Row'];

interface SymbolLeaderboardProps {
  trades: Trade[];
}

export default function SymbolLeaderboard({ trades }: SymbolLeaderboardProps) {
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const symbolData = useMemo(() => {
    const symbols: {
      [key: string]: {
        totalPL: number;
        tradeCount: number;
        winCount: number;
        totalVolume: number;
      };
    } = {};

    trades
      .filter(t => t.status === 'closed' && t.profit_loss !== null)
      .forEach(trade => {
        const symbol = trade.symbol || 'Unknown';

        if (!symbols[symbol]) {
          symbols[symbol] = {
            totalPL: 0,
            tradeCount: 0,
            winCount: 0,
            totalVolume: 0,
          };
        }

        symbols[symbol].totalPL += trade.profit_loss ?? 0;
        symbols[symbol].tradeCount++;
        symbols[symbol].totalVolume += trade.quantity ?? 0;

        if ((trade.profit_loss ?? 0) > 0) {
          symbols[symbol].winCount++;
        }
      });

    const sortedSymbols = Object.entries(symbols)
      .map(([name, stats]) => {
        const winRate = stats.tradeCount > 0 ? (stats.winCount / stats.tradeCount) * 100 : 0;
        const avgPL = stats.tradeCount > 0 ? stats.totalPL / stats.tradeCount : 0;
        return { name, ...stats, winRate, avgPL };
      })
      .sort((a, b) => b.totalPL - a.totalPL)
      .slice(0, 10);

    return sortedSymbols;
  }, [trades]);

  if (symbolData.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Top Symbols</h3>
          <ChartInfoButton
            title="Top Symbols"
            description="Leaderboard of your most traded symbols ranked by total profit/loss. Shows which instruments perform best."
          />
        </div>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          No closed trades yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Top Symbols</h3>
        <ChartInfoButton
          title="Top Symbols"
          description="Leaderboard of your most traded symbols ranked by total profit/loss. Shows which instruments perform best."
        />
      </div>

      <div className="space-y-2">
        {symbolData.map((symbol, index) => {
          const isPositive = symbol.totalPL >= 0;
          const isHovered = hoveredSymbol === symbol.name;

          return (
            <div
              key={symbol.name}
              className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                isHovered
                  ? 'bg-slate-100 dark:bg-slate-700 shadow-md scale-[1.02]'
                  : 'bg-slate-50 dark:bg-slate-750 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              onMouseEnter={(e) => {
                setHoveredSymbol(symbol.name);
                setMousePos({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => {
                setMousePos({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredSymbol(null)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 text-sm font-bold text-slate-700 dark:text-slate-300">
                  {index + 1}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {symbol.name}
                    </span>
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {symbol.tradeCount} trades • {symbol.winRate.toFixed(0)}% win rate
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-lg font-bold ${
                  isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {isPositive ? '+' : ''}${symbol.totalPL.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Avg: ${symbol.avgPL.toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hoveredSymbol && (
        <ChartTooltip x={mousePos.x} y={mousePos.y} visible={true}>
          <div className="space-y-1">
            {(() => {
              const symbol = symbolData.find(s => s.name === hoveredSymbol)!;
              return (
                <>
                  <div className="font-semibold text-lg">{symbol.name}</div>
                  <div className={symbol.totalPL >= 0 ? 'text-green-400' : 'text-red-400'}>
                    Total P/L: {symbol.totalPL >= 0 ? '+' : ''}${symbol.totalPL.toFixed(2)}
                  </div>
                  <div className="text-slate-300">
                    Total Trades: {symbol.tradeCount}
                  </div>
                  <div className="text-slate-300">
                    Wins: {symbol.winCount} ({symbol.winRate.toFixed(1)}%)
                  </div>
                  <div className="text-slate-300">
                    Avg P/L: ${symbol.avgPL.toFixed(2)}
                  </div>
                  <div className="text-slate-300">
                    Total Volume: {symbol.totalVolume.toFixed(0)} shares
                  </div>
                </>
              );
            })()}
          </div>
        </ChartTooltip>
      )}

      {symbolData.length >= 10 && (
        <div className="mt-4 text-xs text-center text-slate-500 dark:text-slate-400">
          Showing top 10 symbols by P/L
        </div>
      )}
    </div>
  );
}
