import { format, parseISO, subDays } from 'date-fns';
import type { DailyEntry } from '../types';

export function formatDate(dateStr: string, fmt = 'MMM d'): string {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function formatDateFull(dateStr: string): string {
  return formatDate(dateStr, 'MMMM d, yyyy');
}

export function formatShortDate(dateStr: string): string {
  return formatDate(dateStr, 'M/d');
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function yesterdayISO(): string {
  return format(subDays(new Date(), 1), 'yyyy-MM-dd');
}

export function dateRangeEnd(): string {
  return todayISO();
}

export function dateRangeStart(days: number): string {
  return format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function round(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(decimals);
}

export function formatNumber(n: number | null | undefined, decimals = 0): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDelta(n: number | null | undefined, unit = '', decimals = 1): string {
  if (n === null || n === undefined) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}${unit}`;
}

export function getDeltaType(n: number | null | undefined, lowerIsBetter = false): 'positive' | 'negative' | 'neutral' {
  if (n === null || n === undefined || Math.abs(n) < 0.05) return 'neutral';
  const isPositive = n > 0;
  if (lowerIsBetter) return isPositive ? 'negative' : 'positive';
  return isPositive ? 'positive' : 'negative';
}

export function entriestoCSV(entries: DailyEntry[]): string {
  const headers = [
    'date', 'weight_lbs', 'calories', 'protein_g', 'carbs_g', 'fat_g',
    'water_oz', 'steps', 'workout_minutes', 'workout_type', 'sleep_hours',
    'fasting_hours', 'notes',
  ];

  const rows = entries.map((e) =>
    headers.map((h) => {
      const val = e[h as keyof DailyEntry];
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return String(val);
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getWorkoutTypeLabel(type: string | null): string {
  if (!type) return '—';
  const labels: Record<string, string> = {
    strength: 'Strength',
    cardio: 'Cardio',
    mixed: 'Mixed',
    rest: 'Rest',
  };
  return labels[type] ?? type;
}

export function getWorkoutTypeBadgeClass(type: string | null): string {
  if (!type) return 'badge-neutral';
  const classes: Record<string, string> = {
    strength: 'bg-blue-50 text-blue-700',
    cardio: 'bg-orange-50 text-orange-700',
    mixed: 'bg-purple-50 text-purple-700',
    rest: 'bg-neutral-100 text-neutral-500',
  };
  return classes[type] ?? 'badge-neutral';
}
