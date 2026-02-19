import type { DailyEntry, Settings, KPIData, WeeklyInsight, NarrativeInsight, FilterState } from '../types';
import { parseISO, subDays, format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

// ─── Rolling averages ───────────────────────────────────────────────────────

function rollingAvg(entries: DailyEntry[], field: keyof DailyEntry, days: number): number | null {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const window = sorted.slice(-days);
  const values = window.map((e) => e[field]).filter((v): v is number => v !== null && typeof v === 'number');
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ─── Adherence score ────────────────────────────────────────────────────────

export function computeAdherenceScore(entry: DailyEntry, settings: Settings): number {
  let score = 0;
  let total = 0;

  if (entry.protein_g !== null) {
    total += 30;
    const ratio = entry.protein_g / settings.protein_target_g;
    score += Math.min(30, ratio * 30);
  }
  if (entry.water_oz !== null) {
    total += 20;
    const ratio = entry.water_oz / settings.water_target_oz;
    score += Math.min(20, ratio * 20);
  }
  if (entry.workout_minutes !== null) {
    total += 25;
    if (entry.workout_type === 'rest') {
      score += 25; // Rest days count as full adherence
    } else {
      const ratio = entry.workout_minutes / settings.workout_minutes_target;
      score += Math.min(25, ratio * 25);
    }
  }
  if (entry.steps !== null) {
    total += 15;
    const ratio = entry.steps / settings.steps_target;
    score += Math.min(15, ratio * 15);
  }
  if (entry.calories !== null) {
    total += 10;
    const ratio = 1 - Math.abs(entry.calories - settings.calories_target) / settings.calories_target;
    score += Math.max(0, ratio * 10);
  }

  if (total === 0) return 0;
  return Math.round((score / total) * 100);
}

// ─── 7-day moving average for weight ────────────────────────────────────────

export function computeMovingAverage(
  entries: DailyEntry[],
  field: keyof DailyEntry,
  windowDays: number = 7
): Array<{ date: string; value: number | null; ma: number | null }> {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  return sorted.map((entry, idx) => {
    const start = Math.max(0, idx - windowDays + 1);
    const window = sorted.slice(start, idx + 1);
    const values = window
      .map((e) => e[field])
      .filter((v): v is number => v !== null && typeof v === 'number');

    const rawValue = entry[field];
    return {
      date: entry.date,
      value: typeof rawValue === 'number' ? rawValue : null,
      ma: values.length >= Math.min(3, windowDays) ? values.reduce((a, b) => a + b, 0) / values.length : null,
    };
  });
}

// ─── KPI computation ────────────────────────────────────────────────────────

export function computeKPIs(entries: DailyEntry[], settings: Settings): KPIData {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const last7 = sorted.slice(-7);
  const prev7 = sorted.slice(-14, -7);

  const avg = (arr: DailyEntry[], field: keyof DailyEntry): number | null => {
    const vals = arr.map((e) => e[field]).filter((v): v is number => v !== null && typeof v === 'number');
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const avgWeight7 = avg(last7, 'weight_lbs');
  const avgWeightPrev7 = avg(prev7, 'weight_lbs');

  const adherenceScores = last7
    .map((e) => computeAdherenceScore(e, settings))
    .filter((s) => s > 0);

  return {
    avgCalories: avg(last7, 'calories'),
    avgProtein: avg(last7, 'protein_g'),
    avgSteps: avg(last7, 'steps'),
    avgWorkoutMinutes: avg(last7, 'workout_minutes'),
    weightChange7d:
      avgWeight7 !== null && avgWeightPrev7 !== null ? avgWeight7 - avgWeightPrev7 : null,
    avgWeight: avgWeight7,
    avgWater: avg(last7, 'water_oz'),
    avgSleep: avg(last7, 'sleep_hours'),
    adherenceScore:
      adherenceScores.length ? Math.round(adherenceScores.reduce((a, b) => a + b, 0) / adherenceScores.length) : null,
  };
}

// ─── Filtered entries ───────────────────────────────────────────────────────

export function filterEntries(entries: DailyEntry[], filters: FilterState): DailyEntry[] {
  const { dateRange, workoutType } = filters;

  return entries.filter((entry) => {
    const date = parseISO(entry.date);
    const start = parseISO(dateRange.start);
    const end = parseISO(dateRange.end);

    if (!isWithinInterval(date, { start, end })) return false;
    if (workoutType !== 'all' && entry.workout_type !== workoutType) return false;

    return true;
  });
}

// ─── Weekly summaries ───────────────────────────────────────────────────────

export function computeWeeklySummaries(
  entries: DailyEntry[],
  settings: Settings
): WeeklyInsight[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return [];

  const weeks: Map<string, DailyEntry[]> = new Map();

  sorted.forEach((entry) => {
    const date = parseISO(entry.date);
    const weekStart = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    if (!weeks.has(weekStart)) weeks.set(weekStart, []);
    weeks.get(weekStart)!.push(entry);
  });

  return Array.from(weeks.entries()).map(([weekStart, weekEntries]) => {
    const weekDate = parseISO(weekStart);
    const weekEnd = format(endOfWeek(weekDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const avg = (field: keyof DailyEntry): number | null => {
      const vals = weekEntries.map((e) => e[field]).filter((v): v is number => v !== null && typeof v === 'number');
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };

    const adherenceDays = weekEntries.filter((e) => computeAdherenceScore(e, settings) >= 60).length;

    return {
      weekStart,
      weekEnd,
      avgCalories: avg('calories'),
      avgProtein: avg('protein_g'),
      avgSteps: avg('steps'),
      totalWorkoutMinutes:
        weekEntries
          .map((e) => e.workout_minutes)
          .filter((v): v is number => v !== null)
          .reduce((a, b) => a + b, 0) || null,
      avgWeight: avg('weight_lbs'),
      adherenceDays,
    };
  });
}

// ─── Narrative insights ──────────────────────────────────────────────────────

export function generateNarrativeInsights(
  entries: DailyEntry[],
  settings: Settings
): NarrativeInsight[] {
  const insights: NarrativeInsight[] = [];
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const last7 = sorted.slice(-7);
  const prev7 = sorted.slice(-14, -7);

  if (sorted.length < 3) {
    insights.push({
      id: 'no-data',
      type: 'neutral',
      text: 'Log at least 3 days of data to start seeing insights.',
    });
    return insights;
  }

  const avg = (arr: DailyEntry[], field: keyof DailyEntry): number | null => {
    const vals = arr.map((e) => e[field]).filter((v): v is number => v !== null && typeof v === 'number');
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  // Protein insight
  const proteinAvg7 = avg(last7, 'protein_g');
  const proteinAvgPrev7 = avg(prev7, 'protein_g');
  if (proteinAvg7 !== null) {
    const diff = proteinAvgPrev7 !== null ? proteinAvg7 - proteinAvgPrev7 : null;
    const vs = diff !== null ? ` (${diff > 0 ? '+' : ''}${diff.toFixed(0)}g vs prior 7)` : '';
    const hitTarget = proteinAvg7 >= settings.protein_target_g * 0.9;
    insights.push({
      id: 'protein',
      type: hitTarget ? 'positive' : 'warning',
      text: `Protein averaged ${proteinAvg7.toFixed(0)}g/day over the last 7 days${vs}. Target: ${settings.protein_target_g}g.`,
    });
  }

  // Weight insight
  const weightAvg7 = avg(last7, 'weight_lbs');
  const weightAvgPrev7 = avg(prev7, 'weight_lbs');
  if (weightAvg7 !== null && weightAvgPrev7 !== null) {
    const delta = weightAvg7 - weightAvgPrev7;
    const direction = Math.abs(delta) < 0.3 ? 'stabilizing' : delta < 0 ? 'trending down' : 'trending up';
    insights.push({
      id: 'weight',
      type: delta <= 0 ? 'positive' : 'neutral',
      text: `7-day avg weight: ${weightAvg7.toFixed(1)} lbs (${delta > 0 ? '+' : ''}${delta.toFixed(1)} lbs vs prior week). Trend is ${direction}.`,
    });
  } else if (weightAvg7 !== null) {
    insights.push({
      id: 'weight',
      type: 'neutral',
      text: `Current 7-day avg weight: ${weightAvg7.toFixed(1)} lbs. Log more weeks to see trend.`,
    });
  }

  // Steps insight
  const stepsAvg7 = avg(last7, 'steps');
  if (stepsAvg7 !== null) {
    const hitTarget = stepsAvg7 >= settings.steps_target * 0.9;
    insights.push({
      id: 'steps',
      type: hitTarget ? 'positive' : 'neutral',
      text: `Steps averaged ${Math.round(stepsAvg7).toLocaleString()}/day last 7 days. ${hitTarget ? 'Daily target met.' : `${Math.round(settings.steps_target - stepsAvg7).toLocaleString()} steps/day below target.`}`,
    });
  }

  // Workout adherence
  const workoutDays = last7.filter((e) => e.workout_minutes && e.workout_minutes > 0 && e.workout_type !== 'rest').length;
  insights.push({
    id: 'workout',
    type: workoutDays >= 4 ? 'positive' : workoutDays >= 2 ? 'neutral' : 'warning',
    text: `Trained ${workoutDays} of the last 7 days. ${workoutDays >= 4 ? 'Consistent frequency.' : workoutDays >= 2 ? 'Room to add 1–2 more sessions.' : 'Consider adding structured sessions post-iftar.'}`,
  });

  // Water insight
  const waterAvg7 = avg(last7, 'water_oz');
  if (waterAvg7 !== null) {
    const hitTarget = waterAvg7 >= settings.water_target_oz * 0.85;
    insights.push({
      id: 'water',
      type: hitTarget ? 'positive' : 'warning',
      text: `Water intake averaged ${waterAvg7.toFixed(0)} oz/day. ${hitTarget ? 'Good hydration during eating window.' : `Try to hit ${settings.water_target_oz} oz — especially important while fasting.`}`,
    });
  }

  // Missing data note
  const missingWeights = last7.filter((e) => e.weight_lbs === null).length;
  if (missingWeights >= 4) {
    insights.push({
      id: 'missing-weight',
      type: 'neutral',
      text: `${missingWeights} of the last 7 days are missing weigh-ins. Logging 3–4×/week is enough to see trend.`,
    });
  }

  // Fasting hours
  const fastingAvg = avg(last7, 'fasting_hours');
  if (fastingAvg !== null) {
    insights.push({
      id: 'fasting',
      type: 'neutral',
      text: `Fasting window averaged ${fastingAvg.toFixed(1)} hrs/day. Staying consistent with your eating window supports body composition during Ramadan.`,
    });
  }

  return insights;
}

// ─── Date range defaults ────────────────────────────────────────────────────

export function getDefaultDateRange(preset: '7d' | '14d' | '30d' = '30d') {
  const now = new Date();
  const end = format(now, 'yyyy-MM-dd');
  const days = preset === '7d' ? 7 : preset === '14d' ? 14 : 30;
  const start = format(subDays(now, days - 1), 'yyyy-MM-dd');
  return { start, end, preset };
}

// ─── Derived chart data ──────────────────────────────────────────────────────

export function buildWeightChartData(entries: DailyEntry[]) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return computeMovingAverage(sorted, 'weight_lbs', 7).map((item) => ({
    date: item.date,
    weight: item.value,
    ma7: item.ma !== null ? parseFloat(item.ma.toFixed(2)) : null,
  }));
}

export function buildCaloriesProteinChartData(entries: DailyEntry[]) {
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: e.date,
      calories: e.calories,
      protein: e.protein_g,
    }));
}

export function buildStepsWorkoutChartData(entries: DailyEntry[]) {
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: e.date,
      steps: e.steps,
      workout_minutes: e.workout_minutes,
    }));
}

export function buildMacroChartData(entries: DailyEntry[]) {
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: e.date,
      protein: e.protein_g,
      carbs: e.carbs_g,
      fat: e.fat_g,
    }));
}

export function buildScatterData(entries: DailyEntry[]) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return sorted
    .filter((_, idx) => idx > 0)
    .map((entry, idx) => {
      const prev = sorted[idx]; // idx is offset by 1 due to filter
      const weightChange =
        entry.weight_lbs !== null && prev.weight_lbs !== null
          ? entry.weight_lbs - prev.weight_lbs
          : null;
      return {
        date: entry.date,
        calories: entry.calories,
        weightChange,
        steps: entry.steps,
        protein: entry.protein_g,
      };
    })
    .filter((d) => d.calories !== null);
}

export { rollingAvg };
