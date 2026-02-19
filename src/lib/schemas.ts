import { z } from 'zod';

export const WorkoutTypeSchema = z.enum(['strength', 'cardio', 'mixed', 'rest']);

export const DailyEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  weight_lbs: z.number().positive('Weight must be positive').max(999).nullable(),
  calories: z.number().min(0, 'Calories cannot be negative').max(10000).nullable(),
  protein_g: z.number().min(0).max(1000).nullable(),
  carbs_g: z.number().min(0).max(2000).nullable(),
  fat_g: z.number().min(0).max(1000).nullable(),
  water_oz: z.number().min(0).max(500).nullable(),
  steps: z.number().int('Steps must be whole number').min(0).max(100000).nullable(),
  workout_minutes: z.number().min(0).max(480).nullable(),
  workout_type: WorkoutTypeSchema.nullable(),
  sleep_hours: z.number().min(0).max(24).nullable(),
  fasting_hours: z.number().min(0).max(24).nullable(),
  notes: z.string().max(1000).nullable(),
});

export const SettingsSchema = z.object({
  protein_target_g: z.number().min(0).max(1000).default(180),
  calories_target: z.number().min(0).max(10000).default(2200),
  water_target_oz: z.number().min(0).max(500).default(80),
  steps_target: z.number().min(0).max(100000).default(8000),
  workout_minutes_target: z.number().min(0).max(480).default(45),
  name: z.string().max(50).default(''),
  ramadan_mode: z.boolean().default(true),
  weight_unit: z.enum(['lbs', 'kg']).default('lbs'),
});

export const ImportSchema = z.object({
  version: z.string().optional(),
  exported_at: z.string().optional(),
  entries: z.array(DailyEntrySchema),
  settings: SettingsSchema.optional(),
});

export type DailyEntryInput = z.input<typeof DailyEntrySchema>;
