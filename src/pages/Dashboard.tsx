import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { filterEntries, computeKPIs, generateNarrativeInsights } from '../lib/selectors';
import { KPICard } from '../components/ui/KPICard';
import { ChartContainer } from '../components/ui/ChartContainer';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { WeightChart } from '../components/charts/WeightChart';
import { CaloriesProteinChart } from '../components/charts/CaloriesProteinChart';
import { StepsWorkoutChart } from '../components/charts/StepsWorkoutChart';
import { MacroChart } from '../components/charts/MacroChart';
import { DataTable } from '../components/ui/DataTable';
import type { DailyEntry, DateRange, FilterState } from '../types';
import { formatDate, getWorkoutTypeLabel, getWorkoutTypeBadgeClass, cn } from '../lib/utils';

// Derive a human-readable date range label from actual entries
function entryDateRangeLabel(entries: DailyEntry[]): string {
  if (entries.length === 0) return '';
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0].date;
  const last = sorted[sorted.length - 1].date;
  if (first === last) return formatDate(first, 'MMM d, yyyy');
  return `${formatDate(first, 'MMM d')} – ${formatDate(last, 'MMM d, yyyy')}`;
}

export function Dashboard() {
  const entries = useAppStore((s) => s.entries);
  const settings = useAppStore((s) => s.settings);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);

  const [showMA, setShowMA] = useState(true);

  const filtered = useMemo(() => filterEntries(entries, filters), [entries, filters]);
  const kpis = useMemo(() => computeKPIs(entries, settings), [entries, settings]);
  const insights = useMemo(() => generateNarrativeInsights(entries, settings), [entries, settings]);

  const dateLabel = useMemo(() => entryDateRangeLabel(entries), [entries]);

  const handleDateRange = (range: DateRange) => {
    setFilters({ dateRange: range });
  };

  const handleWorkoutFilter = (type: FilterState['workoutType']) => {
    setFilters({ workoutType: type });
  };

  const tableColumns = [
    {
      key: 'date' as keyof DailyEntry,
      label: 'Date',
      sortable: true,
      render: (row: DailyEntry) => (
        <Link
          to={`/log?edit=${row.date}`}
          className="font-medium text-neutral-800 hover:text-emerald-600 transition-colors"
        >
          {formatDate(row.date, 'MMM d, yyyy')}
        </Link>
      ),
    },
    {
      key: 'weight_lbs' as keyof DailyEntry,
      label: 'Weight',
      sortable: true,
      align: 'right' as const,
      render: (row: DailyEntry) => (
        <span className="tabular-nums">
          {row.weight_lbs !== null
            ? `${row.weight_lbs} ${settings.weight_unit}`
            : <span className="text-neutral-300">—</span>}
        </span>
      ),
    },
    {
      key: 'calories' as keyof DailyEntry,
      label: 'Calories',
      sortable: true,
      align: 'right' as const,
      render: (row: DailyEntry) => (
        <span className="tabular-nums">
          {row.calories !== null ? `${row.calories} kcal` : <span className="text-neutral-300">—</span>}
        </span>
      ),
    },
    {
      key: 'protein_g' as keyof DailyEntry,
      label: 'Protein',
      sortable: true,
      align: 'right' as const,
      render: (row: DailyEntry) => (
        <span className="tabular-nums">
          {row.protein_g !== null ? `${row.protein_g}g` : <span className="text-neutral-300">—</span>}
        </span>
      ),
    },
    {
      key: 'steps' as keyof DailyEntry,
      label: 'Steps',
      sortable: true,
      align: 'right' as const,
      render: (row: DailyEntry) => (
        <span className="tabular-nums">
          {row.steps !== null ? row.steps.toLocaleString() : <span className="text-neutral-300">—</span>}
        </span>
      ),
    },
    {
      key: 'workout_type' as keyof DailyEntry,
      label: 'Workout',
      render: (row: DailyEntry) => (
        row.workout_type ? (
          <span className={cn('badge text-xs', getWorkoutTypeBadgeClass(row.workout_type))}>
            {getWorkoutTypeLabel(row.workout_type)}
            {row.workout_minutes ? ` · ${row.workout_minutes}m` : ''}
          </span>
        ) : (
          <span className="text-neutral-300">—</span>
        )
      ),
    },
    {
      key: 'fasting_hours' as keyof DailyEntry,
      label: 'Fast',
      align: 'right' as const,
      render: (row: DailyEntry) => (
        <span className="tabular-nums text-neutral-500">
          {row.fasting_hours !== null ? `${row.fasting_hours}h` : <span className="text-neutral-300">—</span>}
        </span>
      ),
    },
  ];

  const insightTypeStyles = {
    positive: 'border-l-emerald-400 bg-emerald-50/50',
    neutral: 'border-l-neutral-300 bg-neutral-50',
    warning: 'border-l-amber-400 bg-amber-50/50',
  };

  const insightIconStyles = {
    positive: 'text-emerald-500',
    neutral: 'text-neutral-400',
    warning: 'text-amber-500',
  };

  // ── First-run empty state ────────────────────────────────────────────────
  if (entries.length === 0) {
    return (
      <div className="animate-fade-in space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">No entries logged yet.</p>
        </div>

        <div className="card p-8 flex flex-col items-center text-center gap-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-800">Start logging your data</h2>
            <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
              Add your first daily entry — weight, nutrition, steps, and workout. Charts and insights appear automatically as you log.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full justify-center">
            <Link to="/log" className="btn-primary justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Log today's entry
            </Link>
            <Link to="/export" className="btn-secondary justify-center">
              Import existing data
            </Link>
          </div>
          <p className="text-xs text-neutral-400">
            You can also configure your daily targets in{' '}
            <Link to="/settings" className="underline hover:text-neutral-600">Settings</Link>{' '}
            before logging.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          {[
            {
              title: 'Weight trend',
              desc: 'Daily weigh-ins with 7-day moving average. Logging 3–4×/week is enough to see a clear trend.',
            },
            {
              title: 'Macro tracking',
              desc: 'Calories, protein, carbs, and fat charted over time against your daily targets.',
            },
            {
              title: 'Adherence score',
              desc: 'Composite 0–100 score based on hitting protein, water, steps, and workout targets each day.',
            },
          ].map((f) => (
            <div key={f.title} className="card p-4 text-left">
              <p className="text-xs font-semibold text-neutral-700 mb-1">{f.title}</p>
              <p className="text-xs text-neutral-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {entries.length} {entries.length === 1 ? 'day' : 'days'} logged
            {dateLabel && <span className="text-neutral-400"> · {dateLabel}</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker value={filters.dateRange} onChange={handleDateRange} />
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-neutral-400 font-medium">Workout:</span>
        {(['all', 'strength', 'cardio', 'mixed', 'rest'] as const).map((type) => (
          <button
            key={type}
            onClick={() => handleWorkoutFilter(type)}
            className={cn(
              'px-2 py-1 rounded-md font-medium transition-colors',
              filters.workoutType === type
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
            )}
          >
            {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer" htmlFor="show-ma">
            <input
              id="show-ma"
              type="checkbox"
              checked={showMA}
              onChange={(e) => setShowMA(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-neutral-800"
            />
            <span className="text-neutral-500">Show 7-day avg</span>
          </label>
        </div>
      </div>

      {/* KPI cards */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard
            label="Avg Calories"
            value={kpis.avgCalories !== null ? Math.round(kpis.avgCalories) : null}
            unit="kcal"
            subtext={`Target: ${settings.calories_target}`}
          />
          <KPICard
            label="Avg Protein"
            value={kpis.avgProtein !== null ? Math.round(kpis.avgProtein) : null}
            unit="g/day"
            subtext={`Target: ${settings.protein_target_g}g`}
            emphasis={
              kpis.avgProtein !== null && kpis.avgProtein >= settings.protein_target_g * 0.9
            }
          />
          <KPICard
            label="Avg Steps"
            value={kpis.avgSteps !== null ? Math.round(kpis.avgSteps) : null}
            subtext={`Target: ${settings.steps_target.toLocaleString()}`}
          />
          <KPICard
            label="Avg Workout"
            value={kpis.avgWorkoutMinutes !== null ? Math.round(kpis.avgWorkoutMinutes) : null}
            unit="min/day"
            subtext={`Target: ${settings.workout_minutes_target}m`}
          />
          <KPICard
            label="Weight Change"
            value={kpis.weightChange7d !== null ? Math.abs(kpis.weightChange7d) : null}
            unit={settings.weight_unit}
            delta={kpis.weightChange7d}
            deltaUnit={` ${settings.weight_unit}`}
            deltaLowerIsBetter
            subtext={kpis.avgWeight !== null ? `Avg: ${kpis.avgWeight.toFixed(1)} ${settings.weight_unit}` : 'No weigh-ins yet'}
          />
        </div>
      </section>

      {/* Adherence strip */}
      {kpis.adherenceScore !== null && (
        <div className="card p-3 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-neutral-500">7-day adherence</span>
            <span
              className={cn(
                'text-sm font-semibold tabular-nums',
                kpis.adherenceScore >= 75
                  ? 'text-emerald-600'
                  : kpis.adherenceScore >= 50
                  ? 'text-amber-600'
                  : 'text-red-500'
              )}
            >
              {kpis.adherenceScore}%
            </span>
          </div>
          <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                kpis.adherenceScore >= 75
                  ? 'bg-emerald-400'
                  : kpis.adherenceScore >= 50
                  ? 'bg-amber-400'
                  : 'bg-red-400'
              )}
              style={{ width: `${kpis.adherenceScore}%` }}
              role="progressbar"
              aria-valuenow={kpis.adherenceScore}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span className="text-xs text-neutral-400 shrink-0">
            Protein · water · steps · workout
          </span>
        </div>
      )}

      {/* Charts grid */}
      <section aria-label="Charts" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartContainer
          title="Body Weight"
          subtitle={`Daily weigh-ins + 7-day moving average · ${settings.weight_unit}`}
          isEmpty={filtered.filter((e) => e.weight_lbs !== null).length === 0}
          emptyState="No weigh-ins logged in this range."
          headerRight={
            <span className="text-xs text-neutral-400">
              {filtered.filter((e) => e.weight_lbs === null).length > 0 &&
                `${filtered.filter((e) => e.weight_lbs === null).length} missing`}
            </span>
          }
        >
          <WeightChart entries={filtered} showMA={showMA} />
        </ChartContainer>

        <ChartContainer
          title="Calories & Protein"
          subtitle="Daily intake vs targets · kcal / g"
          isEmpty={filtered.filter((e) => e.calories !== null || e.protein_g !== null).length === 0}
          emptyState="No nutrition data logged in this range."
        >
          <CaloriesProteinChart entries={filtered} settings={settings} />
        </ChartContainer>

        <ChartContainer
          title="Steps & Workout"
          subtitle="Step count (green = at/above target) + workout duration · min"
          isEmpty={filtered.filter((e) => e.steps !== null).length === 0}
          emptyState="No activity data logged in this range."
        >
          <StepsWorkoutChart entries={filtered} settings={settings} />
        </ChartContainer>

        <ChartContainer
          title="Macro Breakdown"
          subtitle="Protein / Carbs / Fat stacked over time · g"
          isEmpty={filtered.filter((e) => e.protein_g !== null).length === 0}
          emptyState="No macro data logged in this range."
        >
          <MacroChart entries={filtered} />
        </ChartContainer>
      </section>

      {/* Narrative insights */}
      {insights.length > 0 && (
        <section aria-label="Insights">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-800">Automated Insights</h2>
            <span className="text-xs text-neutral-400">Last 7 days · rule-based</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={cn(
                  'rounded-lg border-l-2 px-3 py-2.5 text-xs text-neutral-700 leading-relaxed',
                  insightTypeStyles[insight.type]
                )}
              >
                <span className={cn('mr-1.5', insightIconStyles[insight.type])}>
                  {insight.type === 'positive' && '✓'}
                  {insight.type === 'warning' && '!'}
                  {insight.type === 'neutral' && '·'}
                </span>
                {insight.text}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Log table */}
      <section aria-label="Entry log">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-neutral-800">Entry Log</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400">
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
              {filtered.length < entries.length && ` of ${entries.length} total`}
            </span>
            <Link to="/log" className="btn-secondary py-1 text-xs">
              + Add entry
            </Link>
          </div>
        </div>
        <DataTable
          columns={tableColumns}
          data={[...filtered].sort((a, b) => b.date.localeCompare(a.date))}
          keyField="date"
          emptyMessage="No entries match the current filters."
          maxHeight="360px"
        />
      </section>
    </div>
  );
}
