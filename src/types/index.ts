import { z } from 'zod';
import { DailyEntrySchema, SettingsSchema } from '../lib/schemas';

export type WorkoutType = 'strength' | 'cardio' | 'mixed' | 'rest';

export type DailyEntry = z.infer<typeof DailyEntrySchema>;

export type Settings = z.infer<typeof SettingsSchema>;

export interface DerivedMetrics {
  calories_7d_avg: number | null;
  weight_7d_avg: number | null;
  protein_7d_avg: number | null;
  weekly_change_weight: number | null;
  adherence_score: number | null;
}

export interface KPIData {
  avgCalories: number | null;
  avgProtein: number | null;
  avgSteps: number | null;
  avgWorkoutMinutes: number | null;
  weightChange7d: number | null;
  avgWeight: number | null;
  avgWater: number | null;
  avgSleep: number | null;
  adherenceScore: number | null;
}

export type DateRangePreset = '7d' | '14d' | '30d' | 'custom';

export interface DateRange {
  start: string;
  end: string;
  preset: DateRangePreset;
}

export interface FilterState {
  dateRange: DateRange;
  workoutType: WorkoutType | 'all';
  showMovingAverage: boolean;
}

export interface WeeklyInsight {
  weekStart: string;
  weekEnd: string;
  avgCalories: number | null;
  avgProtein: number | null;
  avgSteps: number | null;
  totalWorkoutMinutes: number | null;
  avgWeight: number | null;
  adherenceDays: number;
}

export interface NarrativeInsight {
  id: string;
  type: 'positive' | 'neutral' | 'warning';
  text: string;
}

export interface AppStore {
  entries: DailyEntry[];
  settings: Settings;
  filters: FilterState;
  isLoaded: boolean;

  // Actions
  addEntry: (entry: DailyEntry) => void;
  updateEntry: (date: string, entry: DailyEntry) => void;
  deleteEntry: (date: string) => void;
  setSettings: (settings: Settings) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  importEntries: (entries: DailyEntry[]) => void;
  clearAllData: () => void;
}
