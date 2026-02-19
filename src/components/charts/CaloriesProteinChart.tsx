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
} from 'recharts';
import type { DailyEntry, Settings } from '../../types';
import { buildCaloriesProteinChartData } from '../../lib/selectors';
import { formatShortDate } from '../../lib/utils';

interface CaloriesProteinChartProps {
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
              ? p.dataKey === 'calories'
                ? `${p.value} kcal`
                : `${p.value}g`
              : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CaloriesProteinChart({ entries, settings }: CaloriesProteinChartProps) {
  const data = useMemo(() => buildCaloriesProteinChartData(entries), [entries]);

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
          yAxisId="cal"
          orientation="left"
          tick={{ fontSize: 11, fill: '#a3a3a3' }}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(v) => `${v}`}
        />
        <YAxis
          yAxisId="prot"
          orientation="right"
          tick={{ fontSize: 11, fill: '#a3a3a3' }}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(v) => `${v}g`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: '#737373' }}>{value}</span>}
        />

        <Bar
          yAxisId="cal"
          dataKey="calories"
          name="Calories (kcal)"
          fill="#d4d4d4"
          radius={[3, 3, 0, 0]}
          maxBarSize={24}
        />
        <Line
          yAxisId="cal"
          type="monotone"
          dataKey={() => settings.calories_target}
          name="Cal target"
          stroke="#f59e0b"
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="4 3"
          connectNulls
        />
        <Line
          yAxisId="prot"
          type="monotone"
          dataKey="protein"
          name="Protein (g)"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 2.5, fill: '#10b981', strokeWidth: 0 }}
          activeDot={{ r: 4, strokeWidth: 0 }}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
