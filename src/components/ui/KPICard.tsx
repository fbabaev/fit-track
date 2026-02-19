import { cn, formatNumber, formatDelta } from '../../lib/utils';

interface KPICardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  delta?: number | null;
  deltaUnit?: string;
  deltaLowerIsBetter?: boolean;
  subtext?: string;
  loading?: boolean;
  emphasis?: boolean;
}

export function KPICard({
  label,
  value,
  unit,
  delta,
  deltaUnit = '',
  deltaLowerIsBetter = false,
  subtext,
  loading = false,
  emphasis = false,
}: KPICardProps) {
  const deltaType =
    delta === null || delta === undefined || Math.abs(delta) < 0.05
      ? 'neutral'
      : deltaLowerIsBetter
      ? delta > 0
        ? 'negative'
        : 'positive'
      : delta > 0
      ? 'positive'
      : 'negative';

  const deltaClasses = {
    positive: 'text-emerald-600 bg-emerald-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-neutral-500 bg-neutral-100',
  };

  if (loading) {
    return (
      <div className="card p-4 space-y-3">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-8 w-16 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    );
  }

  const displayValue =
    value === null || value === undefined
      ? '—'
      : typeof value === 'number'
      ? formatNumber(value, value % 1 === 0 ? 0 : 1)
      : value;

  return (
    <div
      className={cn(
        'card p-4 flex flex-col gap-2 hover:shadow-card-md transition-shadow duration-150',
        emphasis && 'border-emerald-200 bg-emerald-50/30'
      )}
    >
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide leading-none">
        {label}
      </p>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold text-neutral-900 tabular-nums">
          {displayValue}
        </span>
        {unit && value !== null && value !== undefined && (
          <span className="text-sm text-neutral-500">{unit}</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 min-h-[20px]">
        {delta !== null && delta !== undefined ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded',
              deltaClasses[deltaType]
            )}
          >
            {deltaType === 'positive' && '↑'}
            {deltaType === 'negative' && '↓'}
            {deltaType === 'neutral' && '→'}
            {formatDelta(delta, deltaUnit, Math.abs(delta) < 10 ? 1 : 0)}
            {' vs prior 7d'}
          </span>
        ) : (
          <span />
        )}
        {subtext && (
          <span className="text-xs text-neutral-400 text-right">{subtext}</span>
        )}
      </div>
    </div>
  );
}
