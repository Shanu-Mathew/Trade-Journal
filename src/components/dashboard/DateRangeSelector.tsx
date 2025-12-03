import { Calendar } from 'lucide-react';

interface DateRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  customStartDate: Date | null;
  customEndDate: Date | null;
  onCustomStartDateChange: (date: Date | null) => void;
  onCustomEndDateChange: (date: Date | null) => void;
}

export default function DateRangeSelector({
  value,
  onChange,
  customStartDate,
  customEndDate,
  onCustomStartDateChange,
  onCustomEndDateChange,
}: DateRangeSelectorProps) {
  const presets = [
    { value: 'last_10_days', label: 'Last 10 Days' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_3_months', label: 'Last 3 Months' },
    { value: 'ytd', label: 'Year to Date' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              value === preset.value
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {value === 'custom' && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 dark:text-slate-400">From:</label>
            <input
              type="date"
              value={customStartDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => onCustomStartDateChange(e.target.value ? new Date(e.target.value) : null)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 dark:text-slate-400">To:</label>
            <input
              type="date"
              value={customEndDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => onCustomEndDateChange(e.target.value ? new Date(e.target.value) : null)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
