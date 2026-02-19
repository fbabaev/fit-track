import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import type { DailyEntry, Settings } from '../../types';
import { buildStepsWorkoutChartData } from '../../lib/selectors';
import { formatShortDate } from '../../lib/utils';

interface StepsWorkoutChartProps {
  entries: DailyEntry[];
  settings: Settings;
}

interface TooltipPayload {
  name: string;
  value: number | null;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-card-md p-2.5 text-xs">
      <p className="font-medium text-neutral-700 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-neutral-500">{p.name}:</span>
          <span className="font-medium text-neutral-800">
            {p.value !== null && p.value !== undefined
              ? p.dataKey === 'steps'
                ? p.value.toLocaleString()
                : `${p.value} min`
              : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

export function StepsWorkoutChart({ entries, settings }: StepsWorkoutChartProps) {
  const data = useMemo(() => buildStepsWorkoutChartData(entries), [entries]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          tick={{ fontSize: 11, fill: '#a3a3a3' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="steps"
          orientation="left"
          tick={{ fontSize: 11, fill: '#a3a3a3' }}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
        />
        <YAxis
          yAxisId="workout"
          orientation="right"
          tick={{ fontSize: 11, fill: '#a3a3a3' }}
          tickLine={false}
          axisLine={false}
          width={36}
          tickFormatter={(v) => `${v}m`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: '#737373' }}>{value}</span>}
        />

        <Bar
          yAxisId="steps"
          dataKey="steps"
          name="Steps"
          radius={[3, 3, 0, 0]}
          maxBarSize={20}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.steps !== null && entry.steps >= settings.steps_target
                  ? '#6ee7b7'
                  : '#d4d4d4'
              }
            />
          ))}
        </Bar>

        <Line
          yAxisId="steps"
          type="monotone"
          dataKey={() => settings.steps_target}
          name="Step target"
          stroke="#f59e0b"
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="4 3"
          connectNulls
        />

        <Line
          yAxisId="workout"
          type="monotone"
          dataKey="workout_minutes"
          name="Workout (min)"
          stroke="#404040"
          strokeWidth={2}
          dot={{ r: 2.5, fill: '#404040', strokeWidth: 0 }}
          activeDot={{ r: 4, strokeWidth: 0 }}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
