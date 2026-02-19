import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
} from 'recharts';
import type { DailyEntry } from '../../types';
import { buildWeightChartData } from '../../lib/selectors';
import { formatShortDate } from '../../lib/utils';

interface WeightChartProps {
  entries: DailyEntry[];
  showMA?: boolean;
}

interface TooltipPayload {
  name: string;
  value: number | null;
  color: string;
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
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-neutral-500">{p.name}:</span>
          <span className="font-medium text-neutral-800">
            {p.value !== null ? `${p.value} lbs` : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

export function WeightChart({ entries, showMA = true }: WeightChartProps) {
  const data = useMemo(() => buildWeightChartData(entries), [entries]);

  const allWeights = data.map((d) => d.weight).filter((v): v is number => v !== null);
  const minWeight = allWeights.length ? Math.floor(Math.min(...allWeights)) - 2 : 170;
  const maxWeight = allWeights.length ? Math.ceil(Math.max(...allWeights)) + 2 : 190;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
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
          domain={[minWeight, maxWeight]}
          tickFormatter={(v) => `${v}`}
          tick={{ fontSize: 11, fill: '#a3a3a3' }}
          tickLine={false}
          axisLine={false}
          width={36}
          unit=" lb"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value) => (
            <span style={{ color: '#737373' }}>{value}</span>
          )}
        />

        <Line
          type="monotone"
          dataKey="weight"
          name="Weight (lbs)"
          stroke="#404040"
          strokeWidth={1.5}
          dot={{ r: 2.5, fill: '#404040', strokeWidth: 0 }}
          activeDot={{ r: 4, strokeWidth: 0 }}
          connectNulls={false}
        />

        {showMA && (
          <Line
            type="monotone"
            dataKey="ma7"
            name="7-day avg"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            strokeDasharray="0"
            connectNulls
          />
        )}

        <Brush
          dataKey="date"
          height={20}
          stroke="#e5e5e5"
          fill="#fafafa"
          travellerWidth={6}
          tickFormatter={formatShortDate}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
