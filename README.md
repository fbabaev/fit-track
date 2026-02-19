# Ramadan Fitness Tracker

A production-quality fitness tracking dashboard built for the Ramadan fasting context. Track body weight, macros, steps, sleep, and workout performance across a 30-day window — with charts, adherence scoring, and automated insights.

All data is stored locally in your browser. Nothing is sent to a server.

---

## Features

### Dashboard
- **KPI cards** — 7-day averages for calories, protein, steps, workout minutes, and weight change vs. prior 7 days
- **Adherence score** — composite 0–100 score based on hitting protein, water, steps, workout, and calorie targets
- **Interactive charts:**
  - Body weight trend with 7-day moving average overlay and brush/zoom
  - Calories + protein dual-axis chart with target reference lines
  - Steps (color-coded against target) + workout minutes
  - Macro breakdown (protein/carbs/fat stacked area)
- **Filters** — date range (7d / 14d / 30d / custom), workout type, toggle moving average
- **Automated narrative insights** — rule-based bullet points covering protein, weight trend, steps, hydration, and fasting window
- **Entry log table** — sortable, scrollable, shows all entries in selected range

### Log Entry
- Form for adding or editing a `DailyEntry`
- Inline Zod validation with field-level error messages
- "Copy yesterday" prefill — copies prior day's values with a clean date/weight
- Overwrites existing entries on the same date with a warning

### Insights
- **Weekly summaries** — adherence days, avg calories/protein/steps with sparklines per week
- **Scatter plot** — calories vs. next-day weight change; outlier days highlighted in amber
- **Pattern callouts** — high-calorie days, low-calorie days, rest day frequency
- **Best/worst week** — highlighted by adherence score

### Settings
- Configurable daily targets: protein (g), calories (kcal), water (oz), steps, workout (min)
- Targets drive adherence score computation with transparent weighting breakdown
- Weight unit display toggle (lbs/kg)
- Ramadan mode toggle for fasting-specific copy in insights

### Export & Import
- **Export CSV** — all entries, opens in Excel/Sheets/Numbers
- **Export JSON** — full backup including settings, timestamped filename
- **Import JSON** — drag-and-drop or file picker; validated with Zod; errors shown inline
- **Clear all data** — two-click confirmation required

---

## How to Run

```bash
npm install
npm run dev
```

App runs at [http://localhost:5173](http://localhost:5173).

To build for production:

```bash
npm run build
npm run preview
```

---

## Tech Stack

| Layer | Tool |
|---|---|
| Build | Vite 7 + TypeScript |
| UI | React 19 + Tailwind CSS 3 |
| Charts | Recharts |
| State | Zustand (with persist middleware) |
| Validation | Zod |
| Dates | date-fns |
| Routing | React Router DOM v7 |

---

## Data Model

Each `DailyEntry` is keyed by `date` (ISO `YYYY-MM-DD`). All numeric fields are nullable — missing data renders gracefully as gaps in charts.

```typescript
type DailyEntry = {
  date: string;             // YYYY-MM-DD, unique
  weight_lbs: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  water_oz: number | null;
  steps: number | null;
  workout_minutes: number | null;
  workout_type: 'strength' | 'cardio' | 'mixed' | 'rest' | null;
  sleep_hours: number | null;
  fasting_hours: number | null;
  notes: string | null;
}
```

### Derived metrics (computed in selectors, not stored)

- `calories_7d_avg`, `weight_7d_avg`, `protein_7d_avg`
- `weekly_change_weight` — last 7d avg vs. prior 7d avg
- `adherence_score` (0–100) based on protein (30%), workout (25%), water (20%), steps (15%), calorie proximity (10%)

---

## Data Storage

Data is persisted to `localStorage` under the key `ramadan-fitness-tracker` using Zustand's `persist` middleware. No backend, no account, no network requests.

The app ships with 30 days of realistic seed data (Ramadan 2025) including intentional nulls to demonstrate missing-data handling.

---

## How to Export / Import

**Exporting:**
1. Navigate to **Export** in the sidebar
2. Click **Export JSON** for a full backup (entries + settings) or **Export CSV** for spreadsheet use
3. File is saved as `ramadan-fitness-YYYY-MM-DD.json` or `.csv`

**Importing:**
1. Navigate to **Export**
2. Drag a JSON export onto the drop zone, or click to browse
3. The file is validated with Zod before import — errors are shown if the schema doesn't match
4. Existing entries with the same date are overwritten; new dates are added

---

## File Structure

```
src/
├── components/
│   ├── charts/         # WeightChart, CaloriesProteinChart, StepsWorkoutChart, MacroChart
│   ├── layout/         # AppLayout, Sidebar, TopNav
│   └── ui/             # KPICard, ChartContainer, DataTable, DateRangePicker
├── lib/
│   ├── schemas.ts      # Zod schemas (DailyEntry, Settings, Import)
│   ├── seed.ts         # 30-day realistic Ramadan seed data
│   ├── selectors.ts    # Derived metrics, chart data, narrative insights
│   └── utils.ts        # Formatting, CSV export, class helpers
├── pages/
│   ├── Dashboard.tsx
│   ├── LogEntry.tsx
│   ├── Insights.tsx
│   ├── Settings.tsx
│   └── Export.tsx
├── store/
│   └── useAppStore.ts  # Zustand store with localStorage persistence
└── types/
    └── index.ts        # TypeScript types
```
