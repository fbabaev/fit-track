import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { DailyEntry } from '../../types';
import { buildMacroChartData } from '../../lib/selectors';
import { formatShortDate } from '../../lib/utils';

interface MacroChartProps {
  entries: DailyEntry[];
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

  const total = payload.reduce((sum, p) => sum + (p.value ?? 0), 0);

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-card-md p-2.5 text-xs min-w-[130px]">
      <p className="font-medium text-neutral-700 mb-1.5">{label}</p>
      {[...payload].reverse().map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: p.color }} />
            <span className="text-neutral-500">{p.name}:</span>
          </div>
          <span className="font-medium text-neutral-800">
            {p.value !== null && p.value !== undefined ? `${p.value}g` : '—'}
          </span>
        </div>
      ))}
      {total > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-neutral-100 flex justify-between">
          <span className="text-neutral-400">Total macros</span>
          <span className="font-medium text-neutral-700">{total}g</span>
        </div>
      )}
    </div>
  );
}

export function MacroChart({ entries }: MacroChartProps) {
  const data = useMemo(() => buildMacroChartData(entries), [entries]);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="proteinGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="carbsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
          </linearGradient>
        </defs>
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
          tick={{ fontSize: 11, fill: '#a3a3a3' }}
          tickLine={false}
          axisLine={false}
          width={36}
          tickFormatter={(v) => `${v}g`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: '#737373' }}>{value}</span>}
        />

        <Area
          type="monotone"
          dataKey="fat"
          name="Fat (g)"
          stackId="macros"
          stroke="#8b5cf6"
          fill="url(#fatGrad)"
          strokeWidth={1.5}
          connectNulls={false}
        />
        <Area
          type="monotone"
          dataKey="carbs"
          name="Carbs (g)"
          stackId="macros"
          stroke="#f59e0b"
          fill="url(#carbsGrad)"
          strokeWidth={1.5}
          connectNulls={false}
        />
        <Area
          type="monotone"
          dataKey="protein"
          name="Protein (g)"
          stackId="macros"
          stroke="#10b981"
          fill="url(#proteinGrad)"
          strokeWidth={1.5}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
