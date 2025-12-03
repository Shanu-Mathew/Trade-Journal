import { TrendingUp, TrendingDown, Target, Award, AlertCircle, BarChart3, Activity, DollarSign } from 'lucide-react';
import { TradeStats } from '../../utils/tradeCalculations';

interface KPIGridProps {
  stats: TradeStats;
}

export default function KPIGrid({ stats }: KPIGridProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const kpis = [
    {
      label: 'Total P&L',
      value: formatCurrency(stats.totalPL),
      icon: stats.totalPL >= 0 ? TrendingUp : TrendingDown,
      color: stats.totalPL >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: stats.totalPL >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Win Rate',
      value: formatPercent(stats.winRate),
      icon: Target,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Number of Trades',
      value: stats.closedTrades.toString(),
      icon: BarChart3,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      subtitle: `${stats.openTrades} open`,
    },
    {
      label: 'Avg R',
      value: stats.avgR.toFixed(2),
      icon: Award,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      label: 'Expectancy',
      value: formatCurrency(stats.expectancy),
      icon: Activity,
      color: stats.expectancy >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: stats.expectancy >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Max Drawdown',
      value: formatCurrency(stats.maxDrawdown),
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      subtitle: formatPercent(stats.maxDrawdownPercent),
    },
    {
      label: 'Best Day',
      value: formatCurrency(stats.bestDay),
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Worst Day',
      value: formatCurrency(stats.worstDay),
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Open P&L',
      value: formatCurrency(stats.openPL),
      icon: DollarSign,
      color: stats.openPL >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: stats.openPL >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Profit Factor',
      value: stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2),
      icon: Award,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`${kpi.bgColor} p-2.5 rounded-lg`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                {kpi.label}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {kpi.value}
              </p>
              {kpi.subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {kpi.subtitle}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
