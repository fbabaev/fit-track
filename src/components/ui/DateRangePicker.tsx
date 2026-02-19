import { cn, dateRangeStart, dateRangeEnd } from '../../lib/utils';
import type { DateRange, DateRangePreset } from '../../types';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS: { label: string; value: DateRangePreset; days?: number }[] = [
  { label: 'Last 7d', value: '7d', days: 7 },
  { label: 'Last 14d', value: '14d', days: 14 },
  { label: 'Last 30d', value: '30d', days: 30 },
  { label: 'Custom', value: 'custom' },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const handlePreset = (preset: DateRangePreset, days?: number) => {
    if (preset === 'custom') {
      onChange({ ...value, preset: 'custom' });
      return;
    }
    onChange({
      start: dateRangeStart(days!),
      end: dateRangeEnd(),
      preset,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePreset(p.value, p.days)}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-md transition-colors duration-150',
              value.preset === p.value
                ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200'
                : 'text-neutral-500 hover:text-neutral-700'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {value.preset === 'custom' && (
        <div className="flex items-center gap-1.5 text-xs">
          <input
            type="date"
            value={value.start}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
            className="input text-xs py-1 w-36"
            aria-label="Start date"
          />
          <span className="text-neutral-400">–</span>
          <input
            type="date"
            value={value.end}
            max={dateRangeEnd()}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
            className="input text-xs py-1 w-36"
            aria-label="End date"
          />
        </div>
      )}
    </div>
  );
}
