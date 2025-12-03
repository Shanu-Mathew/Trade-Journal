import { Database } from '../../lib/database.types';
import EquityCurveChart from '../charts/EquityCurveChart';
import PLByDayOfWeekChart from '../charts/PLByDayOfWeekChart';
import DrawdownChart from '../charts/DrawdownChart';
import PLDistributionChart from '../charts/PLDistributionChart';
import RollingWinRateChart from '../charts/RollingWinRateChart';
import HeatmapChart from '../charts/HeatmapChart';
import StrategyComparisonChart from '../charts/StrategyComparisonChart';
import SymbolLeaderboard from '../charts/SymbolLeaderboard';

type Trade = Database['public']['Tables']['trades']['Row'];

interface ChartsGridProps {
  trades: Trade[];
  initialBalance: number;
}

export default function ChartsGrid({ trades, initialBalance }: ChartsGridProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <EquityCurveChart trades={trades} initialBalance={initialBalance} />
        <PLByDayOfWeekChart trades={trades} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DrawdownChart trades={trades} initialBalance={initialBalance} />
        <PLDistributionChart trades={trades} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RollingWinRateChart trades={trades} />
        <StrategyComparisonChart trades={trades} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <HeatmapChart trades={trades} />
        <SymbolLeaderboard trades={trades} />
      </div>
    </div>
  );
}
