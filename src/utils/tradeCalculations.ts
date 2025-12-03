// tradeCalculations.ts
import { Database } from '../lib/database.types';

type Trade = Database['public']['Tables']['trades']['Row'];

export function calculateTradeMetrics(trade: {
  direction?: 'long' | 'short' | string | null;
  entry_price?: number | null;
  exit_price?: number | null;
  quantity?: number | null;
  leverage?: number | null;
  fees?: number | null;
  commission?: number | null;
  slippage?: number | null;
}) {
  const entry = typeof trade.entry_price === 'number' ? trade.entry_price : null;
  const exit = typeof trade.exit_price === 'number' ? trade.exit_price : null;
  const quantity = typeof trade.quantity === 'number' ? trade.quantity : 0;
  const leverage = typeof trade.leverage === 'number' && !isNaN(trade.leverage) ? trade.leverage : 1;
  const fees = typeof trade.fees === 'number' ? trade.fees : 0;
  const commission = typeof trade.commission === 'number' ? trade.commission : 0;
  const slippage = typeof trade.slippage === 'number' ? trade.slippage : 0;

  if (entry === null || exit === null || quantity === 0) {
    return {
      profit_loss: null,
      profit_loss_percent: null,
    };
  }

  // PnL per unit (long = exit - entry, short = entry - exit)
  const dir = (trade.direction ?? 'long').toString().toLowerCase();
  let pnlPerUnit = 0;
  if (dir === 'short') {
    pnlPerUnit = entry - exit;
  } else {
    // default to long semantics
    pnlPerUnit = exit - entry;
  }

  // Gross PnL uses quantity and leverage (leverage affects the P/L magnitude)
  const grossPnl = pnlPerUnit * quantity * (leverage ?? 1);

  // Subtract fees/commission/slippage (assumed monetary totals)
  const totalCosts = fees + commission + slippage;

  const profitLoss = grossPnl - totalCosts;

  // percent relative to leveraged notional (entry_price * quantity * leverage)
  const leveragedNotional = entry * quantity * (leverage ?? 1);
  const profitLossPercent = leveragedNotional !== 0 ? (profitLoss / leveragedNotional) * 100 : null;

  // Round to 2 decimals for display
  const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

  return {
    profit_loss: profitLoss !== null ? round2(profitLoss) : null,
    profit_loss_percent: profitLossPercent !== null ? round2(profitLossPercent) : null,
  };
}

export default calculateTradeMetrics;

export function calculatePortfolioStats(
  trades: Trade[],
  initialBalance: number = 10000
): TradeStats {
  // Ensure closedTrades include recalculated profit_loss if missing
  const closedTradesRaw = trades.filter(t => t.status === 'closed');
  const closedTrades = closedTradesRaw.map(t => {
    // If profit_loss is null or undefined, calculate it
    if (t.profit_loss === null || t.profit_loss === undefined) {
      const metrics = calculateTradeMetrics(t);
      return { ...t, profit_loss: metrics.profit_loss };
    }
    return t;
  }).filter(t => t.profit_loss !== null); // keep only closed with calculable PL

  const openTrades = trades.filter(t => t.status === 'open');

  const winningTrades = closedTrades.filter(t => (t.profit_loss ?? 0) > 0);
  const losingTrades = closedTrades.filter(t => (t.profit_loss ?? 0) < 0);

  const totalPL = closedTrades.reduce((sum, t) => sum + (t.profit_loss ?? 0), 0);
  const totalProfit = winningTrades.reduce((sum, t) => sum + (t.profit_loss ?? 0), 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit_loss ?? 0), 0));

  const avgWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;

  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  const expectancy = closedTrades.length > 0
    ? (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss
    : 0;

  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : (totalProfit > 0 ? Infinity : 0);

  // avgR: if r_multiple exists, use it; otherwise 0
  const avgR = closedTrades.length > 0
    ? closedTrades.reduce((sum, t) => sum + (t.r_multiple ?? 0), 0) / closedTrades.length
    : 0;

  const sortedByDate = [...closedTrades].sort((a, b) =>
    new Date(a.exit_timestamp ?? a.entry_timestamp).getTime() -
    new Date(b.exit_timestamp ?? b.entry_timestamp).getTime()
  );

  let runningBalance = initialBalance;
  let peak = initialBalance;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;

  const dailyPL = new Map<string, number>();

  sortedByDate.forEach(trade => {
    const pl = Number(trade.profit_loss ?? 0);
    runningBalance += pl;

    if (runningBalance > peak) {
      peak = runningBalance;
    }

    const drawdown = peak - runningBalance;
    const drawdownPercent = peak !== 0 ? (drawdown / peak) * 100 : 0;

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = drawdownPercent;
    }

    const date = new Date(trade.exit_timestamp ?? trade.entry_timestamp).toISOString().split('T')[0];
    dailyPL.set(date, (dailyPL.get(date) ?? 0) + pl);
  });

  const dailyPLValues = Array.from(dailyPL.values());
  const bestDay = dailyPLValues.length > 0 ? Math.max(...dailyPLValues) : 0;
  const worstDay = dailyPLValues.length > 0 ? Math.min(...dailyPLValues) : 0;

  // openPL: sum unrealized PL for open trades if exit_price exists (or 0 otherwise).
  const openPL = openTrades.reduce((sum, t) => {
    if (!t.exit_price) return sum;
    const metrics = calculateTradeMetrics({ ...t, status: 'closed' as any });
    return sum + (metrics.profit_loss ?? 0);
  }, 0);

  return {
    totalTrades: trades.length,
    openTrades: openTrades.length,
    closedTrades: closedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    totalPL,
    totalProfit,
    totalLoss,
    avgWin,
    avgLoss,
    avgR,
    expectancy,
    profitFactor,
    maxDrawdown,
    maxDrawdownPercent,
    bestDay,
    worstDay,
    openPL,
  };
}

export function filterTradesByDateRange(
  trades: Trade[],
  startDate: Date | null,
  endDate: Date | null
): Trade[] {
  return trades.filter(trade => {
    const tradeDate = new Date(trade.exit_timestamp ?? trade.entry_timestamp);
    if (startDate && tradeDate < startDate) return false;
    if (endDate && tradeDate > endDate) return false;
    return true;
  });
}

export function getDateRangePreset(preset: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (preset) {
    case 'last_10_days':
      start.setDate(end.getDate() - 10);
      break;
    case 'last_week':
      start.setDate(end.getDate() - 7);
      break;
    case 'last_month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'last_3_months':
      start.setMonth(end.getMonth() - 3);
      break;
    case 'last_year':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'ytd':
      start.setMonth(0, 1);
      break;
    case 'all':
      start.setFullYear(1970, 0, 1);
      break;
    default:
      start.setMonth(end.getMonth() - 1);
  }

  return { start, end };
}
