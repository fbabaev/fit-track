import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LineChart,
  Line,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { computeWeeklySummaries, buildScatterData } from '../lib/selectors';
import { ChartContainer } from '../components/ui/ChartContainer';
import { formatDate, cn } from '../lib/utils';

interface ScatterTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { date: string; calories: number | null; weightChange: number | null; steps: number | null; protein: number | null } }>;
}

function ScatterTooltip({ active, payload }: ScatterTooltipProps) {
  if (!active || !payload || !payload[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-card-md p-2.5 text-xs">
      <p className="font-medium text-neutral-700 mb-1.5">{formatDate(d.date, 'MMM d')}</p>
      <div className="space-y-0.5">
        <div className="flex justify-between gap-4">
          <span className="text-neutral-500">Calories:</span>
          <span className="font-medium">{d.calories ? `${d.calories} kcal` : '—'}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-neutral-500">Weight Δ:</span>
          <span className={cn('font-medium', d.weightChange && d.weightChange > 0 ? 'text-red-500' : 'text-emerald-600')}>
            {d.weightChange !== null && d.weightChange !== undefined
              ? `${d.weightChange > 0 ? '+' : ''}${d.weightChange.toFixed(2)} lbs`
              : '—'}
          </span>
        </div>
        {d.steps !== null && (
          <div className="flex justify-between gap-4">
            <span className="text-neutral-500">Steps:</span>
            <span className="font-medium">{d.steps.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Sparkline({ data, dataKey, color }: { data: Record<string, number | null>[]; dataKey: string; color: string }) {
  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Insights() {
  const entries = useAppStore((s) => s.entries);
  const settings = useAppStore((s) => s.settings);

  const scatterData = useMemo(() => buildScatterData(entries), [entries]);
  const weeklySummaries = useMemo(() => computeWeeklySummaries(entries, settings), [entries, settings]);

  const hasEnoughData = entries.length >= 5;

  if (entries.length === 0) {
    return (
      <div className="animate-fade-in space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Insights</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Correlations and patterns across your training data.</p>
        </div>
        <div className="card p-8 text-center max-w-sm mx-auto">
          <p className="text-sm font-medium text-neutral-700">No data to analyze yet.</p>
          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
            Log at least 5 days of entries to unlock weekly summaries, scatter plots, and pattern detection.
          </p>
          <a href="/log" className="btn-primary mt-4 justify-center inline-flex">Log today's entry</a>
        </div>
      </div>
    );
  }

  // Compute correlations — thresholds derived from user's calorie target
  const calTarget = settings.calories_target;
  const highCalThreshold = Math.round(calTarget * 1.1);   // 10% above target
  const lowCalThreshold = Math.round(calTarget * 0.85);   // 15% below target

  const validScatter = scatterData.filter(
    (d) => d.calories !== null && d.weightChange !== null
  );

  const highCalDays = validScatter.filter((d) => d.calories !== null && d.calories > highCalThreshold);
  const lowCalDays = validScatter.filter((d) => d.calories !== null && d.calories < lowCalThreshold);

  // Best and worst adherence weeks
  const weeksByAdherence = [...weeklySummaries].sort((a, b) => b.adherenceDays - a.adherenceDays);
  const bestWeek = weeksByAdherence[0];
  const worstWeek = weeksByAdherence[weeksByAdherence.length - 1];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Insights</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Correlations and patterns across {entries.length} logged {entries.length === 1 ? 'day' : 'days'}.
        </p>
      </div>

      {!hasEnoughData && (
        <div className="card p-5 text-sm text-neutral-500 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-amber-600 text-xs font-bold">!</span>
          </div>
          <div>
            <p className="font-medium text-neutral-700">
              {5 - entries.length} more {5 - entries.length === 1 ? 'entry' : 'entries'} needed
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Pattern analysis (scatter plots, weekly summaries, outlier detection) unlocks at 5 logged days.
              You have {entries.length} so far.
            </p>
          </div>
        </div>
      )}

      {hasEnoughData && (
        <>
          {/* Weekly summaries */}
          <section>
            <h2 className="text-sm font-semibold text-neutral-800 mb-3">Weekly Summaries</h2>
            <div className="space-y-2">
              {weeklySummaries.map((week) => {
                const score = week.adherenceDays;
                const scoreColor =
                  score >= 5
                    ? 'text-emerald-600'
                    : score >= 3
                    ? 'text-amber-600'
                    : 'text-red-500';

                const weekData = entries
                  .filter((e) => e.date >= week.weekStart && e.date <= week.weekEnd)
                  .sort((a, b) => a.date.localeCompare(b.date));

                return (
                  <div key={week.weekStart} className="card p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="sm:w-36 shrink-0">
                        <p className="text-sm font-medium text-neutral-800">
                          {formatDate(week.weekStart, 'MMM d')} – {formatDate(week.weekEnd, 'MMM d')}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={cn('text-xs font-semibold', scoreColor)}>
                            {score}/7 adherent days
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 text-xs">
                        <div>
                          <p className="text-neutral-400 mb-0.5">Avg calories</p>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-neutral-700">
                              {week.avgCalories !== null ? `${Math.round(week.avgCalories)} kcal` : '—'}
                            </span>
                            {weekData.length > 2 && (
                              <Sparkline
                                data={weekData.map((e) => ({ calories: e.calories }))}
                                dataKey="calories"
                                color="#d4d4d4"
                              />
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-neutral-400 mb-0.5">Avg protein</p>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-neutral-700">
                              {week.avgProtein !== null ? `${Math.round(week.avgProtein)}g` : '—'}
                            </span>
                            {weekData.length > 2 && (
                              <Sparkline
                                data={weekData.map((e) => ({ protein: e.protein_g }))}
                                dataKey="protein"
                                color="#10b981"
                              />
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-neutral-400 mb-0.5">Avg steps</p>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-neutral-700">
                              {week.avgSteps !== null ? `${Math.round(week.avgSteps).toLocaleString()}` : '—'}
                            </span>
                            {weekData.length > 2 && (
                              <Sparkline
                                data={weekData.map((e) => ({ steps: e.steps }))}
                                dataKey="steps"
                                color="#f59e0b"
                              />
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-neutral-400 mb-0.5">Avg weight</p>
                          <span className="font-medium text-neutral-700">
                            {week.avgWeight !== null ? `${week.avgWeight.toFixed(1)} ${settings.weight_unit}` : 'No weigh-ins'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Scatter: Calories vs Weight Change */}
          <ChartContainer
            title="Calories vs. Next-Day Weight Change"
            subtitle="Each point = one day. Does eating more correlate with weight gain?"
            isEmpty={validScatter.length < 3}
            emptyState="Not enough days with both calorie and weight data."
          >
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 8, right: 16, left: -16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="calories"
                  type="number"
                  name="Calories"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: '#a3a3a3' }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Calories (kcal)', position: 'insideBottom', offset: -4, fontSize: 11, fill: '#a3a3a3' }}
                />
                <YAxis
                  dataKey="weightChange"
                  type="number"
                  name="Weight Δ"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: '#a3a3a3' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`}
                  unit=" lb"
                />
                <Tooltip content={<ScatterTooltip />} />
                <ReferenceLine y={0} stroke="#d4d4d4" strokeDasharray="3 3" />
                <Scatter
                  data={validScatter}
                  fill="#404040"
                  opacity={0.7}
                  shape={(props: { cx?: number; cy?: number; payload?: { calories: number | null; weightChange: number | null } }) => {
                    const { cx, cy, payload } = props;
                    if (!cx || !cy) return <circle cx={cx} cy={cy} r={5} />;
                    const isOutlier =
                      payload &&
                      ((payload.calories !== null && payload.calories > highCalThreshold) ||
                        (payload.weightChange !== null && Math.abs(payload.weightChange) > 1.5));
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isOutlier ? 6 : 4}
                        fill={isOutlier ? '#f59e0b' : '#404040'}
                        opacity={isOutlier ? 0.9 : 0.6}
                        stroke={isOutlier ? '#d97706' : 'none'}
                        strokeWidth={1}
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-xs text-neutral-400 mt-2">
              Amber dots = outlier days (calories &gt;{highCalThreshold.toLocaleString()} kcal or weight swing &gt;1.5 {settings.weight_unit}).
            </p>
          </ChartContainer>

          {/* Pattern callouts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card p-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                High-cal days (&gt;{highCalThreshold.toLocaleString()} kcal)
              </p>
              <p className="text-2xl font-semibold text-neutral-900 tabular-nums">
                {highCalDays.length}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Avg weight change:{' '}
                {highCalDays.length > 0
                  ? `${(highCalDays.reduce((s, d) => s + (d.weightChange ?? 0), 0) / highCalDays.length).toFixed(2)} ${settings.weight_unit}`
                  : '—'}
              </p>
            </div>

            <div className="card p-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                Low-cal days (&lt;{lowCalThreshold.toLocaleString()} kcal)
              </p>
              <p className="text-2xl font-semibold text-neutral-900 tabular-nums">
                {lowCalDays.length}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Avg weight change:{' '}
                {lowCalDays.length > 0
                  ? `${(lowCalDays.reduce((s, d) => s + (d.weightChange ?? 0), 0) / lowCalDays.length).toFixed(2)} ${settings.weight_unit}`
                  : '—'}
              </p>
            </div>

            <div className="card p-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                Rest days logged
              </p>
              <p className="text-2xl font-semibold text-neutral-900 tabular-nums">
                {entries.filter((e) => e.workout_type === 'rest').length}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Avg {(entries.filter((e) => e.workout_type === 'rest').length / Math.max(1, Math.ceil(entries.length / 7))).toFixed(1)}/week
              </p>
            </div>
          </div>

          {/* Best / worst weeks */}
          {weeklySummaries.length >= 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bestWeek && (
                <div className="card p-4 border-l-4 border-l-emerald-400">
                  <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1.5">
                    Strongest week
                  </p>
                  <p className="text-sm font-semibold text-neutral-800">
                    {formatDate(bestWeek.weekStart, 'MMM d')} – {formatDate(bestWeek.weekEnd, 'MMM d')}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {bestWeek.adherenceDays}/7 adherent days ·{' '}
                    {bestWeek.avgProtein !== null ? `${Math.round(bestWeek.avgProtein)}g avg protein` : 'No protein data'}
                  </p>
                </div>
              )}
              {worstWeek && worstWeek.weekStart !== bestWeek?.weekStart && (
                <div className="card p-4 border-l-4 border-l-amber-400">
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1.5">
                    Weakest week
                  </p>
                  <p className="text-sm font-semibold text-neutral-800">
                    {formatDate(worstWeek.weekStart, 'MMM d')} – {formatDate(worstWeek.weekEnd, 'MMM d')}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {worstWeek.adherenceDays}/7 adherent days ·{' '}
                    {worstWeek.avgCalories !== null ? `${Math.round(worstWeek.avgCalories)} kcal avg` : '—'}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
