import { useState } from 'react';
import { SettingsSchema } from '../lib/schemas';
import { useAppStore } from '../store/useAppStore';
import type { Settings as SettingsType } from '../types';
import { cn } from '../lib/utils';

type SettingsForm = {
  protein_target_g: string;
  calories_target: string;
  water_target_oz: string;
  steps_target: string;
  workout_minutes_target: string;
  name: string;
  ramadan_mode: boolean;
  weight_unit: 'lbs' | 'kg';
};

function settingsToForm(s: SettingsType): SettingsForm {
  return {
    protein_target_g: s.protein_target_g.toString(),
    calories_target: s.calories_target.toString(),
    water_target_oz: s.water_target_oz.toString(),
    steps_target: s.steps_target.toString(),
    workout_minutes_target: s.workout_minutes_target.toString(),
    name: s.name,
    ramadan_mode: s.ramadan_mode,
    weight_unit: s.weight_unit,
  };
}

function formToSettings(form: SettingsForm): SettingsType {
  return {
    protein_target_g: parseFloat(form.protein_target_g) || 180,
    calories_target: parseFloat(form.calories_target) || 2200,
    water_target_oz: parseFloat(form.water_target_oz) || 80,
    steps_target: parseFloat(form.steps_target) || 8000,
    workout_minutes_target: parseFloat(form.workout_minutes_target) || 45,
    name: form.name.trim(),
    ramadan_mode: form.ramadan_mode,
    weight_unit: form.weight_unit,
  };
}

interface TargetFieldProps {
  label: string;
  name: keyof SettingsForm;
  unit: string;
  description: string;
  form: SettingsForm;
  error?: string;
  onChange: (name: keyof SettingsForm, value: string) => void;
  min?: number;
  max?: number;
}

function TargetField({ label, name, unit, description, form, error, onChange, min, max }: TargetFieldProps) {
  return (
    <div className="flex items-start gap-4 px-4 py-3 border-b border-neutral-100 last:border-0">
      <div className="flex-1 min-w-0">
        <label htmlFor={String(name)} className="text-sm font-medium text-neutral-800">
          {label}
        </label>
        <p className="text-xs text-neutral-400 mt-0.5">{description}</p>
        {error && <p className="text-xs text-red-500 mt-0.5" role="alert">{error}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0 mr-1">
        <input
          id={String(name)}
          type="number"
          value={form[name] as string}
          onChange={(e) => onChange(name, e.target.value)}
          className={cn('input w-24 text-right tabular-nums', error && 'input-error')}
          min={min}
          max={max}
          aria-invalid={!!error}
        />
        <span className="text-sm text-neutral-400 w-16 shrink-0">{unit}</span>
      </div>
    </div>
  );
}

export function Settings() {
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);

  const [form, setForm] = useState<SettingsForm>(() => settingsToForm(settings));
  const [errors, setErrors] = useState<Partial<Record<keyof SettingsForm, string>>>({});
  const [saved, setSaved] = useState(false);

  const handleChange = (name: keyof SettingsForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = formToSettings(form);
    const result = SettingsSchema.safeParse(parsed);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SettingsForm, string>> = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof SettingsForm;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSettings(result.data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    const defaults: SettingsType = {
      protein_target_g: 180,
      calories_target: 2200,
      water_target_oz: 80,
      steps_target: 8000,
      workout_minutes_target: 45,
      name: '',
      ramadan_mode: true,
      weight_unit: 'lbs',
    };
    setForm(settingsToForm(defaults));
    setSettings(defaults);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-xl animate-fade-in">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Configure daily targets. These drive the adherence score and insights.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Profile */}
        <div className="card">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Profile</h2>
          </div>

          {/* Name */}
          <div className="px-4 pb-3 border-b border-neutral-100">
            <label htmlFor="name" className="label">
              Name <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Your name"
              maxLength={50}
              className="input"
            />
          </div>

          {/* Weight unit */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-neutral-100">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800">Weight unit</p>
              <p className="text-xs text-neutral-400 mt-0.5">Display preference — data is always stored in lbs</p>
            </div>
            <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5 shrink-0 mr-1">
              {(['lbs', 'kg'] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => handleChange('weight_unit', unit)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                    form.weight_unit === unit
                      ? 'bg-white text-neutral-900 shadow-sm border border-neutral-200'
                      : 'text-neutral-500 hover:text-neutral-700'
                  )}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          {/* Ramadan mode */}
          <div className="flex items-center gap-4 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800">Ramadan mode</p>
              <p className="text-xs text-neutral-400 mt-0.5">Shows fasting-specific context in insights</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.ramadan_mode}
              aria-label="Toggle Ramadan mode"
              onClick={() => handleChange('ramadan_mode', !form.ramadan_mode)}
              className={cn(
                'relative shrink-0 w-10 h-5 mr-1 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400',
                form.ramadan_mode ? 'bg-neutral-800' : 'bg-neutral-300'
              )}
            >
              <span
                className={cn(
                  'absolute left-0 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                  form.ramadan_mode ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        </div>

        {/* Daily targets */}
        <div className="card">
          <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
            <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Daily Targets
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Used to compute adherence score (0–100) across nutrition + activity.
            </p>
          </div>

          <TargetField
            label="Protein"
            name="protein_target_g"
            unit="g/day"
            description="Accounts for 30% of adherence score. Aim for ~0.8–1g per lb bodyweight."
            form={form}
            error={errors.protein_target_g}
            onChange={handleChange}
            min={0}
            max={1000}
          />
          <TargetField
            label="Calories"
            name="calories_target"
            unit="kcal/day"
            description="Accounts for 10%. Hard to hit exactly; a ±150 kcal window is normal."
            form={form}
            error={errors.calories_target}
            onChange={handleChange}
            min={0}
            max={10000}
          />
          <TargetField
            label="Water"
            name="water_target_oz"
            unit="oz/day"
            description="Accounts for 20%. During Ramadan, concentrate intake in suhoor + iftar window."
            form={form}
            error={errors.water_target_oz}
            onChange={handleChange}
            min={0}
            max={500}
          />
          <TargetField
            label="Steps"
            name="steps_target"
            unit="steps/day"
            description="Accounts for 15%. Tarawih alone can add 2,000–3,000 steps."
            form={form}
            error={errors.steps_target}
            onChange={handleChange}
            min={0}
            max={100000}
          />
          <TargetField
            label="Workout"
            name="workout_minutes_target"
            unit="min/day"
            description="Accounts for 25%. Post-iftar is typically the highest-performance window."
            form={form}
            error={errors.workout_minutes_target}
            onChange={handleChange}
            min={0}
            max={480}
          />
        </div>

        {/* Adherence breakdown */}
        <div className="card p-4 bg-neutral-50 overflow-hidden">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            Adherence Score Breakdown
          </h2>
          <div className="space-y-2">
            {[
              { label: 'Protein', weight: 30, color: 'bg-emerald-400' },
              { label: 'Workout minutes', weight: 25, color: 'bg-neutral-700' },
              { label: 'Water', weight: 20, color: 'bg-blue-400' },
              { label: 'Steps', weight: 15, color: 'bg-amber-400' },
              { label: 'Calories (proximity)', weight: 10, color: 'bg-purple-400' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-xs">
                <span className="w-36 shrink-0 text-neutral-500">{item.label}</span>
                <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden min-w-0">
                  <div
                    className={cn('h-full rounded-full', item.color)}
                    style={{ width: `${item.weight}%` }}
                  />
                </div>
                <span className="w-7 shrink-0 text-right font-medium text-neutral-700">{item.weight}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className={cn('btn-primary', saved && 'bg-emerald-600 hover:bg-emerald-600')}
          >
            {saved ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Saved
              </>
            ) : (
              'Save settings'
            )}
          </button>
          <button type="button" className="btn-ghost" onClick={handleReset}>
            Reset to defaults
          </button>
        </div>
      </form>
    </div>
  );
}
