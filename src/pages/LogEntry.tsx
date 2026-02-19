import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DailyEntrySchema } from '../lib/schemas';
import { useAppStore } from '../store/useAppStore';
import { todayISO, yesterdayISO, cn } from '../lib/utils';
import type { DailyEntry } from '../types';

type FormData = {
  date: string;
  weight_lbs: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  water_oz: string;
  steps: string;
  workout_minutes: string;
  workout_type: string;
  sleep_hours: string;
  fasting_hours: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const BLANK_FORM: FormData = {
  date: todayISO(),
  weight_lbs: '',
  calories: '',
  protein_g: '',
  carbs_g: '',
  fat_g: '',
  water_oz: '',
  steps: '',
  workout_minutes: '',
  workout_type: '',
  sleep_hours: '',
  fasting_hours: '',
  notes: '',
};

function entryToForm(entry: DailyEntry): FormData {
  return {
    date: entry.date,
    weight_lbs: entry.weight_lbs?.toString() ?? '',
    calories: entry.calories?.toString() ?? '',
    protein_g: entry.protein_g?.toString() ?? '',
    carbs_g: entry.carbs_g?.toString() ?? '',
    fat_g: entry.fat_g?.toString() ?? '',
    water_oz: entry.water_oz?.toString() ?? '',
    steps: entry.steps?.toString() ?? '',
    workout_minutes: entry.workout_minutes?.toString() ?? '',
    workout_type: entry.workout_type ?? '',
    sleep_hours: entry.sleep_hours?.toString() ?? '',
    fasting_hours: entry.fasting_hours?.toString() ?? '',
    notes: entry.notes ?? '',
  };
}

function formToEntry(form: FormData): DailyEntry {
  const parse = (v: string): number | null => {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };
  const parseInt2 = (v: string): number | null => {
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  };

  return {
    date: form.date,
    weight_lbs: parse(form.weight_lbs),
    calories: parseInt2(form.calories),
    protein_g: parseInt2(form.protein_g),
    carbs_g: parseInt2(form.carbs_g),
    fat_g: parseInt2(form.fat_g),
    water_oz: parseInt2(form.water_oz),
    steps: parseInt2(form.steps),
    workout_minutes: parseInt2(form.workout_minutes),
    workout_type: (form.workout_type as DailyEntry['workout_type']) || null,
    sleep_hours: parse(form.sleep_hours),
    fasting_hours: parse(form.fasting_hours),
    notes: form.notes.trim() || null,
  };
}

interface FieldProps {
  label: string;
  name: keyof FormData;
  type?: string;
  unit?: string;
  tip?: string;
  placeholder?: string;
  form: FormData;
  errors: FormErrors;
  onChange: (name: keyof FormData, value: string) => void;
  min?: string;
  max?: string;
  step?: string;
}

function Field({ label, name, type = 'number', unit, tip, placeholder, form, errors, onChange, min, max, step }: FieldProps) {
  const error = errors[name];
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="label">
        {label}
        {unit && <span className="ml-1 font-normal text-neutral-400">({unit})</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={form[name]}
        placeholder={placeholder ?? '—'}
        min={min}
        max={max}
        step={step ?? '1'}
        onChange={(e) => onChange(name, e.target.value)}
        className={cn('input', error && 'input-error')}
        aria-describedby={error ? `${name}-error` : tip ? `${name}-tip` : undefined}
        aria-invalid={!!error}
      />
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
      {!error && tip && (
        <p id={`${name}-tip`} className="text-xs text-neutral-400">
          {tip}
        </p>
      )}
    </div>
  );
}

export function LogEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editDate = searchParams.get('edit');

  const entries = useAppStore((s) => s.entries);
  const addEntry = useAppStore((s) => s.addEntry);
  const updateEntry = useAppStore((s) => s.updateEntry);
  const deleteEntry = useAppStore((s) => s.deleteEntry);

  const [form, setForm] = useState<FormData>(BLANK_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load existing entry on edit mode
  useEffect(() => {
    if (editDate) {
      const entry = entries.find((e) => e.date === editDate);
      if (entry) setForm(entryToForm(entry));
    } else {
      // Check if today already has an entry
      const todayEntry = entries.find((e) => e.date === todayISO());
      if (todayEntry) setForm(entryToForm(todayEntry));
    }
  }, [editDate, entries]);

  const handleChange = (name: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSaved(false);
  };

  const validate = (): boolean => {
    const entry = formToEntry(form);
    const result = DailyEntrySchema.safeParse(entry);
    if (result.success) {
      setErrors({});
      return true;
    }

    const fieldErrors: FormErrors = {};
    result.error.issues.forEach((err) => {
      const field = err.path[0] as keyof FormData;
      if (!fieldErrors[field]) {
        fieldErrors[field] = err.message;
      }
    });
    setErrors(fieldErrors);
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const entry = formToEntry(form);
    if (editDate) {
      updateEntry(editDate, entry);
    } else {
      addEntry(entry);
    }
    setSaved(true);
    setTimeout(() => {
      navigate('/?saved=1');
    }, 600);
  };

  const copyYesterday = () => {
    const yesterday = entries.find((e) => e.date === yesterdayISO());
    if (!yesterday) return;
    setForm({
      ...entryToForm(yesterday),
      date: todayISO(),
      notes: '',
      weight_lbs: '',
    });
    setSaved(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteEntry(editDate ?? form.date);
    navigate('/');
  };

  const isEditing = !!editDate;
  const existingEntry = entries.find((e) => e.date === (editDate ?? form.date));
  const hasYesterday = entries.some((e) => e.date === yesterdayISO());

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">
            {isEditing ? 'Edit Entry' : 'Log Entry'}
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {isEditing
              ? `Editing ${editDate}`
              : 'Add today\'s training and nutrition data.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && hasYesterday && (
            <button
              type="button"
              onClick={copyYesterday}
              className="btn-secondary text-xs"
              title="Copy yesterday's values and adjust for today"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy yesterday
            </button>
          )}
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className={cn('btn text-xs', confirmDelete ? 'btn-danger' : 'btn-ghost')}
            >
              {confirmDelete ? 'Confirm delete' : 'Delete entry'}
            </button>
          )}
        </div>
      </div>

      {existingEntry && !isEditing && (
        <div className="mb-4 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          An entry for today already exists. Submitting will overwrite it.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Date */}
        <div className="card p-4 space-y-3">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Date</h2>
          <Field
            label="Date"
            name="date"
            type="date"
            form={form}
            errors={errors}
            onChange={handleChange}
          />
        </div>

        {/* Body */}
        <div className="card p-4 space-y-3">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Body</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Weight"
              name="weight_lbs"
              unit="lbs"
              placeholder="e.g. 181.5"
              step="0.1"
              min="50"
              max="999"
              tip="Weigh yourself fasted, first thing in the morning."
              form={form}
              errors={errors}
              onChange={handleChange}
            />
            <Field
              label="Sleep"
              name="sleep_hours"
              unit="hours"
              placeholder="e.g. 6.5"
              step="0.5"
              min="0"
              max="24"
              form={form}
              errors={errors}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Fasting */}
        <div className="card p-4 space-y-3">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Ramadan Fasting
          </h2>
          <Field
            label="Fasting window"
            name="fasting_hours"
            unit="hours"
            placeholder="e.g. 16"
            step="0.5"
            min="0"
            max="24"
            tip="Time between suhoor end and iftar. Typical range: 14–18 hrs."
            form={form}
            errors={errors}
            onChange={handleChange}
          />
        </div>

        {/* Nutrition */}
        <div className="card p-4 space-y-3">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nutrition</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field
              label="Calories"
              name="calories"
              unit="kcal"
              min="0"
              max="10000"
              form={form}
              errors={errors}
              onChange={handleChange}
            />
            <Field
              label="Protein"
              name="protein_g"
              unit="g"
              min="0"
              form={form}
              errors={errors}
              onChange={handleChange}
            />
            <Field
              label="Carbs"
              name="carbs_g"
              unit="g"
              min="0"
              form={form}
              errors={errors}
              onChange={handleChange}
            />
            <Field
              label="Fat"
              name="fat_g"
              unit="g"
              min="0"
              form={form}
              errors={errors}
              onChange={handleChange}
            />
          </div>
          <Field
            label="Water"
            name="water_oz"
            unit="oz"
            min="0"
            max="500"
            tip="Counts suhoor to iftar, including iftar itself. ~8 cups = 64 oz."
            form={form}
            errors={errors}
            onChange={handleChange}
          />
        </div>

        {/* Activity */}
        <div className="card p-4 space-y-3">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Activity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Steps"
              name="steps"
              unit="steps"
              min="0"
              max="100000"
              form={form}
              errors={errors}
              onChange={handleChange}
            />
            <Field
              label="Workout duration"
              name="workout_minutes"
              unit="min"
              min="0"
              max="480"
              form={form}
              errors={errors}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="workout_type" className="label">
              Workout type
            </label>
            <select
              id="workout_type"
              value={form.workout_type}
              onChange={(e) => handleChange('workout_type', e.target.value)}
              className="select"
            >
              <option value="">— Not logged —</option>
              <option value="strength">Strength</option>
              <option value="cardio">Cardio</option>
              <option value="mixed">Mixed</option>
              <option value="rest">Rest day</option>
            </select>
            {errors.workout_type && (
              <p className="text-xs text-red-500">{errors.workout_type}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="card p-4 space-y-3">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Notes</h2>
          <div className="space-y-1">
            <label htmlFor="notes" className="label">
              Notes <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="How did the day go? Anything unusual?"
              rows={3}
              maxLength={1000}
              className="input resize-none"
            />
            <p className="text-xs text-neutral-400 text-right">{form.notes.length}/1000</p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className={cn(
              'btn-primary',
              saved && 'bg-emerald-600 hover:bg-emerald-600'
            )}
            disabled={saved}
          >
            {saved ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Saved
              </>
            ) : (
              isEditing ? 'Update entry' : 'Save entry'
            )}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate('/')}
          >
            Cancel
          </button>
          {Object.keys(errors).length > 0 && (
            <span className="text-xs text-red-500 ml-auto">
              Fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} above
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
