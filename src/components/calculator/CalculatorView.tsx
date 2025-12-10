import { useState, useEffect } from 'react';
import { Calculator, Send } from 'lucide-react';

interface CalculatorViewProps {
  selectedAccountId: string | null;
  accounts: Array<{ id: string; name: string; initial_balance: number; currency: string }>;
  onSendToTradeForm?: (tradeData: any) => void;
}

const UNITS_PER_LOT = 100;

export function CalculatorView({ selectedAccountId, accounts, onSendToTradeForm }: CalculatorViewProps) {
  const [entry, setEntry] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [riskPercent, setRiskPercent] = useState<string>('2');
  const [rewardRatio, setRewardRatio] = useState<string>('2');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [allowFractional, setAllowFractional] = useState(true);
  const [principal, setPrincipal] = useState<number>(0);
  const [valuePerPoint, setValuePerPoint] = useState<string>('1');
  const [leverage, setLeverage] = useState<string>('1');

  useEffect(() => {
    if (selectedAccountId) {
      const account = accounts.find(a => a.id === selectedAccountId);
      if (account) setPrincipal(account.initial_balance);
    }
  }, [selectedAccountId, accounts]);

  const calculate = () => {
    const entryPrice = parseFloat(entry);
    const slPrice = parseFloat(stopLoss);
    const risk = parseFloat(riskPercent);
    const reward = parseFloat(rewardRatio);
    const vpp = parseFloat(valuePerPoint);
    const lev = parseFloat(leverage);

    if (
      isNaN(entryPrice) ||
      isNaN(slPrice) ||
      isNaN(risk) ||
      isNaN(reward) ||
      isNaN(vpp) ||
      isNaN(lev) ||
      principal <= 0
    ) {
      return null;
    }

    const slDistance = Math.abs(entryPrice - slPrice);
    if (slDistance === 0) return null;

    const riskDollars = principal * (risk / 100);

    const positionSizeUnitsRaw = riskDollars / (slDistance * vpp);
    const positionSizeLotsRaw = positionSizeUnitsRaw / UNITS_PER_LOT;
    const positionSizeLots = allowFractional ? positionSizeLotsRaw : Math.floor(positionSizeLotsRaw);
    const finalPositionSizeLots = Math.max(0, positionSizeLots);
    const finalPositionSizeUnits = finalPositionSizeLots * UNITS_PER_LOT;

    const marginRequired = (finalPositionSizeUnits * entryPrice) / lev;
    const tpDistance = slDistance * reward;
    const takeProfit = direction === 'long' ? entryPrice + tpDistance : entryPrice - tpDistance;
    const profitDollars = tpDistance * (finalPositionSizeUnits * vpp);

    return {
      entry: entryPrice,
      stopLoss: slPrice,
      slDistance,
      riskDollars,
      positionSizeUnits: finalPositionSizeUnits,
      positionSizeLots: finalPositionSizeLots,
      unitsPerLot: UNITS_PER_LOT,
      marginRequired,
      tpDistance,
      takeProfit,
      profitDollars,
      valuePerPoint: vpp,
      leverage: lev,
    };
  };

  const result = calculate();
  const account = accounts.find(a => a.id === selectedAccountId);
  const currency = account?.currency || 'USD';

  const handleSendToTradeForm = () => {
    if (!result || !onSendToTradeForm) return;

    const tradeData = {
      entry_price: result.entry,
      quantity_lots: result.positionSizeLots,
      quantity_units: result.positionSizeUnits,
      direction,
    };

    onSendToTradeForm(tradeData);
  };

  if (!selectedAccountId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Please select an account to use calculator</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Position Size Calculator</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Input Parameters</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Direction</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setDirection('long')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    direction === 'long'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Long
                </button>
                <button
                  onClick={() => setDirection('short')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    direction === 'short'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Short
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Entry Price ({currency})
              </label>
              <input
                type="number"
                step="any"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stop Loss ({currency})</label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Risk (%)</label>
              <input
                type="number"
                step="0.1"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Percentage of principal to risk</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reward:Risk Ratio (R)</label>
              <input
                type="number"
                step="0.1"
                value={rewardRatio}
                onChange={(e) => setRewardRatio(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Target profit multiplier (e.g., 2 = 2R)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Principal Amount ({currency})</label>
              <input
                type="number"
                step="any"
                value={principal}
                onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10000"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Account balance from selected account</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Value per point per unit ({currency})</label>
              <input
                type="number"
                step="any"
                value={valuePerPoint}
                onChange={(e) => setValuePerPoint(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">How much one unit moves per 1 point move (default 1)</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allow_fractional"
                checked={allowFractional}
                onChange={(e) => setAllowFractional(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="allow_fractional" className="text-sm text-gray-700 dark:text-gray-300">
                Allow fractional lots
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Calculated Results</h3>

            {result ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Position Size</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.positionSizeLots.toFixed(allowFractional ? 4 : 0)} lots
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">({result.positionSizeUnits.toFixed(0)} units)</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Entry Price</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currency} {result.entry.toFixed(2)}
                  </p>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Stop Loss</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currency} {result.stopLoss.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Risk: {currency} {result.riskDollars.toFixed(2)} ({riskPercent}%)
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Take Profit Target</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currency} {result.takeProfit.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Estimated P&L: {currency} {result.profitDollars.toFixed(2)}</p>
                </div>

                {onSendToTradeForm && (
                  <button
                    onClick={handleSendToTradeForm}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Send className="w-5 h-5" />
                    Send to Trade Form
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Fill in all parameters to calculate position size</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalculatorView;
