import { useState, useMemo } from 'react';
import { Database } from '../../lib/database.types';
import ChartTooltip from './ChartTooltip';
import ChartInfoButton from './ChartInfoButton';

type Trade = Database['public']['Tables']['trades']['Row'];

interface PLByDayOfWeekChartProps {
  trades: Trade[];
}

export default function PLByDayOfWeekChart({ trades }: PLByDayOfWeekChartProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const dayData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats = days.map((name, index) => ({
      name,
      shortName: name.slice(0, 3),
      index,
      totalPL: 0,
      tradeCount: 0,
      winCount: 0,
    }));

    trades
      .filter(t => t.status === 'closed' && t.profit_loss !== null)
      .forEach(trade => {
        const date = new Date(trade.exit_timestamp ?? trade.entry_timestamp);
        const dayIndex = date.getDay();
        dayStats[dayIndex].totalPL += trade.profit_loss ?? 0;
        dayStats[dayIndex].tradeCount++;
        if ((trade.profit_loss ?? 0) > 0) {
          dayStats[dayIndex].winCount++;
        }
      });

    return dayStats;
  }, [trades]);

  if (dayData.every(d => d.tradeCount === 0)) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">P/L by Day of Week</h3>
          <ChartInfoButton
            title="P/L by Day of Week"
            description="Shows your profit/loss performance for each day of the week. Identify which days are most profitable for your trading strategy."
          />
        </div>
        <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
          No closed trades yet
        </div>
      </div>
    );
  }

  const maxAbsPL = Math.max(...dayData.map(d => Math.abs(d.totalPL)), 1);
  const chartHeight = 240;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">P/L by Day of Week</h3>
        <ChartInfoButton
          title="P/L by Day of Week"
          description="Shows your profit/loss performance for each day of the week. Identify which days are most profitable for your trading strategy."
        />
      </div>

      <div className="relative" style={{ height: `${chartHeight}px` }}>
        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-300 dark:bg-slate-600" />

        <div className="flex items-end justify-around h-full gap-2 px-4">
          {dayData.map((day) => {
            const heightPercent = (Math.abs(day.totalPL) / maxAbsPL) * 45;
            const isPositive = day.totalPL >= 0;
            const isHovered = hoveredDay === day.index;

            return (
              <div
                key={day.index}
                className="flex flex-col items-center flex-1 cursor-pointer"
                style={{ height: '100%' }}
                onMouseEnter={(e) => {
                  setHoveredDay(day.index);
                  setMousePos({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setMousePos({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div className="flex-1 flex flex-col justify-center items-center w-full">
                  {isPositive ? (
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isHovered
                          ? 'bg-green-500 dark:bg-green-500 shadow-lg'
                          : 'bg-green-400 dark:bg-green-600'
                      }`}
                      style={{
                        height: `${heightPercent}%`,
                        opacity: isHovered ? 1 : 0.9,
                      }}
                    />
                  ) : (
                    <div
                      className={`w-full rounded-b-lg transition-all duration-300 ${
                        isHovered
                          ? 'bg-red-500 dark:bg-red-500 shadow-lg'
                          : 'bg-red-400 dark:bg-red-600'
                      }`}
                      style={{
                        height: `${heightPercent}%`,
                        opacity: isHovered ? 1 : 0.9,
                        marginTop: 'auto',
                      }}
                    />
                  )}
                </div>

                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2">
                  {day.shortName}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hoveredDay !== null && (
        <ChartTooltip x={mousePos.x} y={mousePos.y} visible={true}>
          <div className="space-y-1">
            <div className="font-semibold">{dayData[hoveredDay].name}</div>
            <div className={dayData[hoveredDay].totalPL >= 0 ? 'text-green-400' : 'text-red-400'}>
              Total P/L: {dayData[hoveredDay].totalPL >= 0 ? '+' : ''}${dayData[hoveredDay].totalPL.toFixed(2)}
            </div>
            <div className="text-slate-300">
              Trades: {dayData[hoveredDay].tradeCount}
            </div>
            <div className="text-slate-300">
              Win Rate: {dayData[hoveredDay].tradeCount > 0
                ? ((dayData[hoveredDay].winCount / dayData[hoveredDay].tradeCount) * 100).toFixed(1)
                : 0}%
            </div>
            <div className="text-slate-300">
              Avg P/L: ${dayData[hoveredDay].tradeCount > 0
                ? (dayData[hoveredDay].totalPL / dayData[hoveredDay].tradeCount).toFixed(2)
                : '0.00'}
            </div>
          </div>
        </ChartTooltip>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="text-slate-600 dark:text-slate-400">
          Best Day: <span className="font-semibold text-green-600 dark:text-green-400">
            {dayData.reduce((best, day) => day.totalPL > best.totalPL ? day : best).name}
          </span>
        </div>
        <div className="text-slate-600 dark:text-slate-400">
          Worst Day: <span className="font-semibold text-red-600 dark:text-red-400">
            {dayData.reduce((worst, day) => day.totalPL < worst.totalPL ? day : worst).name}
          </span>
        </div>
      </div>
    </div>
  );
}
