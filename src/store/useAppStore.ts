import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DailyEntry, Settings, FilterState, AppStore } from '../types';
import { dateRangeStart, dateRangeEnd } from '../lib/utils';

// ─── Increment this whenever the data shape changes in a breaking way ────────
// Version 0: original release (had hardcoded seed data)
// Version 1: seed data removed — all entries must come from real user input
const STORE_VERSION = 1;

const DEFAULT_SETTINGS: Settings = {
  protein_target_g: 180,
  calories_target: 2200,
  water_target_oz: 80,
  steps_target: 8000,
  workout_minutes_target: 45,
  name: '',
  ramadan_mode: true,
  weight_unit: 'lbs',
};

const DEFAULT_FILTERS: FilterState = {
  dateRange: {
    start: dateRangeStart(30),
    end: dateRangeEnd(),
    preset: '30d',
  },
  workoutType: 'all',
  showMovingAverage: true,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      entries: [],
      settings: DEFAULT_SETTINGS,
      filters: DEFAULT_FILTERS,
      isLoaded: false,

      addEntry: (entry: DailyEntry) => {
        const { entries } = get();
        const existing = entries.findIndex((e) => e.date === entry.date);
        if (existing >= 0) {
          set({ entries: entries.map((e, i) => (i === existing ? entry : e)) });
        } else {
          set({ entries: [...entries, entry].sort((a, b) => a.date.localeCompare(b.date)) });
        }
      },

      updateEntry: (date: string, entry: DailyEntry) => {
        set({
          entries: get().entries.map((e) => (e.date === date ? entry : e)),
        });
      },

      deleteEntry: (date: string) => {
        set({ entries: get().entries.filter((e) => e.date !== date) });
      },

      setSettings: (settings: Settings) => {
        set({ settings });
      },

      setFilters: (partial: Partial<FilterState>) => {
        set({ filters: { ...get().filters, ...partial } });
      },

      importEntries: (newEntries: DailyEntry[]) => {
        const { entries } = get();
        const merged = [...entries];
        newEntries.forEach((entry) => {
          const idx = merged.findIndex((e) => e.date === entry.date);
          if (idx >= 0) {
            merged[idx] = entry;
          } else {
            merged.push(entry);
          }
        });
        set({ entries: merged.sort((a, b) => a.date.localeCompare(b.date)) });
      },

      clearAllData: () => {
        set({ entries: [], settings: DEFAULT_SETTINGS, filters: DEFAULT_FILTERS });
      },
    }),
    {
      name: 'ramadan-fitness-tracker',
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Called when the stored version doesn't match STORE_VERSION.
      // Wipes seed-era entries; preserves any real user-entered settings.
      migrate: (persisted, fromVersion) => {
        if (fromVersion < 1) {
          // v0 → v1: discard the hardcoded seed data, keep user settings if any
          const old = persisted as Partial<AppStore>;
          return {
            entries: [],
            settings: old.settings ?? DEFAULT_SETTINGS,
            filters: DEFAULT_FILTERS,
            isLoaded: false,
          };
        }
        return persisted as AppStore;
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoaded = true;
      },
    }
  )
);

// Convenience selectors
export const useEntries = () => useAppStore((s) => s.entries);
export const useSettings = () => useAppStore((s) => s.settings);
export const useFilters = () => useAppStore((s) => s.filters);
