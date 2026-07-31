# HabitHabitat — Complete Project Summary (Updated 2026-07-31)

> **Purpose**: Exhaustive technical reference for continuing this codebase. Written for an AI assistant with zero prior context. Read this entire file before making any changes.

---

## 0. Quick Facts

| Field                | Value                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------- |
| **Live URL**         | https://habithabitat.vercel.app                                                        |
| **GitHub repo**      | `vijitagarwal/habithabitat` (was: `bright-habit-view`)                                 |
| **Local folder**     | `e:\Desktop\operating system\all-in-one\bright-habit-view`                             |
| **Supabase project** | `umjrxaczrmcstwajtumh` (project name: `mission_control`)                               |
| **Supabase URL**     | `https://umjrxaczrmcstwajtumh.supabase.co`                                             |
| **Deployment**       | Vercel (Hobby), env var `NITRO_PRESET=vercel`                                          |
| **Auth**             | Supabase magic link (email OTP) — magic link works; email+password sign-up is disabled |

### ⚠️ Both Folders Explanation

There are **two folders** in `all-in-one/`:

- **`bright-habit-view/`** ← **THE ACTIVE PROJECT** (deployed to habithabitat.vercel.app)
- **`mission-cat-pro/`** ← **ARCHIVED reference** — the old standalone CAT dashboard (separate repo `vijitagarwal/Mission-Control-and-tracking-2026..`), deployed separately on Vercel. It is NOT used in the current workflow. All CAT features have been merged into `bright-habit-view`.

**Only `bright-habit-view/` should be edited going forward.**

---

## 1. Stack & Tooling

| Concern       | Choice                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Framework     | **TanStack Start** (SSR, Vite-based React meta-framework)                                                                      |
| Language      | TypeScript 5.8                                                                                                                 |
| Bundler       | Vite 8                                                                                                                         |
| Router        | `@tanstack/react-router` (file-based, type-safe)                                                                               |
| Server        | `@tanstack/react-start` + Nitro (preset: `vercel` at build time)                                                               |
| Auth + DB     | **Supabase** (`@supabase/supabase-js` v2)                                                                                      |
| CSS           | TailwindCSS v4 (`@tailwindcss/vite`) + CSS variables (OKLCH palette)                                                           |
| UI Primitives | **shadcn/ui** — Radix-UI components in `src/components/ui/`                                                                    |
| Charts        | **Recharts**                                                                                                                   |
| Icons         | **lucide-react**                                                                                                               |
| State         | Custom `useSyncExternalStore` singleton (`src/lib/habits-store.ts`) — NO Redux, NO Zustand                                     |
| Persistence   | **localStorage only** — Supabase tables exist but data sync not yet wired (future work)                                        |
| Config        | `@lovable.dev/vite-tanstack-config` wraps vite.config.ts (defaults to Cloudflare Workers; override with `NITRO_PRESET=vercel`) |

---

## 2. Full File Tree

```
bright-habit-view/            (GitHub: vijitagarwal/habithabitat)
├── .env                      # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_PUBLISHABLE_KEY
├── vercel.json               # { buildCommand, installCommand, framework: null }
├── vite.config.ts            # @lovable.dev/vite-tanstack-config; server entry: "server"
├── tsconfig.json
├── package.json
├── PROJECT_SUMMARY(habit_dashboard).md   ← THIS FILE
├── AGENTS.md                 # AI coding conventions
├── supabase/
│   └── migrations/
│       ├── 20260722_unified_habit_tables.sql   # items, completions, daily_metrics, journal_entries, user_settings
│       ├── 20260723_profiles_extended.sql       # profiles table with display_name, bio, target_college, etc.
│       └── (earlier migrations)
└── src/
    ├── start.ts              # TanStack Start entry
    ├── server.ts             # Nitro/SSR entry
    ├── router.tsx            # createRouter() — QueryClient + routeTree
    ├── routeTree.gen.ts      # Auto-generated
    ├── styles.css            # Global CSS: Tailwind @import + OKLCH token vars
    ├── lib/
    │   ├── habits-store.ts   # Core state module (530+ lines) — all types, store, actions, aggregates
    │   ├── scope.ts          # ScopeCtx + filterHabitsByScope()
    │   ├── utils.ts          # cn() helper
    │   └── (other utils)
    ├── integrations/supabase/
    │   ├── client.ts         # createClient singleton
    │   └── types.ts          # Auto-generated DB types (profiles table not yet typed here — use `(supabase as any)`)
    ├── routes/
    │   ├── __root.tsx        # Root: QueryClientProvider, head/meta, error boundary
    │   ├── index.tsx         # "/" — redirects to /dashboard or /auth
    │   ├── auth.tsx          # "/auth" — magic link sign-in page
    │   └── _authenticated/
    │       ├── route.tsx     # Layout guard: getUser() or redirect /auth
    │       └── dashboard.tsx # "/dashboard" — main app shell with scope toggle
    └── components/
        ├── ui/               # 46 shadcn/ui components
        ├── dashboard/        # Habit dashboard components (see Section 5)
        └── cat-dashboard/    # CAT Prep dashboard (see Section 6)
```

---

## 3. Routing Architecture

```
/ (root)
  /                     → redirect: session? /dashboard : /auth
  /auth                 → Magic link sign-in (Google OAuth via lovable SDK also present)
  /_authenticated       → Layout guard (supabase.auth.getUser())
    /dashboard          → DashboardPage (?scope=habit|cat)
```

**Search param**: `scope: "habit" | "cat"` (zod-validated). Controls which dashboard shell renders.

---

## 4. Dual Dashboard Architecture

The app has **two separate dashboard shells** toggled by `?scope=`:

### 4a. Habit Dashboard (`scope=habit`)

- Renders: Sidebar + Header + view content via `renderView(activeKey)`
- Side bar is collapsible with icon-only mode
- Views: Dashboard Home, Daily Tracker, Calendar, Analytics, Heatmap, Goals, Achievements, Journal, Mood/Sleep/Water/Weight trackers, Habit Manager (Settings)
- **Habit data**: localStorage via `habits-store.ts`

### 4b. CAT Dashboard (`scope=cat`)

- Renders: `CatDashboardShell` — a completely separate layout with its own sidebar and sections
- CAT sidebar has icon-only collapsed mode (same style as habit sidebar)
- Sections (navigated by `#anchor` scroll or sidebar click):
  - **Overview** — countdown timer, campaign progress, metrics cards, + **Today's CAT Prep habits widget**
  - **Topic Tracker** — per-topic study progress with Supabase DB backend
  - **Weekly Board** — kanban-style task board (useKV persisted)
  - **Error Log** — mistake log with Supabase DB backend
  - **Checklist** — categorized checklist, fully editable (useKV)
  - **Breathwork** — guided breathing timer
  - **Meditation** — guided meditation timer
  - **Tech Ladder** — chronological tech commitments, fully editable (useKV)
  - **Standing Orders** — static principles display
- Imports `cat-styles.css` which is **scoped** inside `CatDashboardShell` to avoid leaking to the habit dashboard
- CAT data: mix of `useKV` (localStorage via bridge) and Supabase direct queries

---

## 5. Habit Dashboard Components (`src/components/dashboard/`)

### View Components (rendered by `renderView()`)

| Key                       | Component                 | Description                                                                               |
| ------------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| `dashboard`               | inline in `dashboard.tsx` | Home: StatCards + WeeklyProgress + CategoryBreakdown + TodaysHabits + Heatmap + TopHabits |
| `daily`                   | `DailyTracker`            | Date nav + habit list for selected date                                                   |
| `calendar`                | `CalendarView`            | Month grid + DailyTracker for selected day                                                |
| `analytics`               | inline                    | StatCards + charts                                                                        |
| `heatmap`                 | `Heatmap`                 | Monthly heatmap grid                                                                      |
| `goals`                   | `GoalsView`               | Monthly goal slider + per-habit bar charts                                                |
| `achievements`            | `Achievements`            | Static badge grid                                                                         |
| `journal`                 | `JournalView`             | Daily notes textarea                                                                      |
| `mood/sleep/water/weight` | `MetricTracker`           | Input + LineChart                                                                         |
| `settings`                | `HabitManager`            | Full habit CRUD + reset                                                                   |

### Key Supporting Components

| Component                            | Purpose                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `Sidebar.tsx`                        | Collapsible left nav (icon-only when collapsed), Level/XP widget at bottom |
| `Header.tsx`                         | Page title + dark/light toggle + **ProfileModal** trigger                  |
| `ProfileModal.tsx`                   | Avatar dropdown + view/edit user profile + sign-out button                 |
| `HabitRow.tsx` + `HabitRowConnected` | Single habit row; boolean toggle OR numeric benchmark input                |
| `HabitManager.tsx`                   | CRUD for habits; DraftForm with all fields                                 |
| `ScheduleEditor.tsx`                 | Schedule type picker + conditional day/date selectors                      |

---

## 6. CAT Dashboard: `src/components/cat-dashboard/`

### Bridge Pattern

`bridge.ts` re-exports Supabase client, auth hook, toast hook, and a `useKV` hook:

- `useKV<T>(key, default)` → `{ value: T, setValue: (v: T) => Promise<void>, loading: boolean }` — localStorage-backed with SSR safety

### Key Data Files

- `data/static.ts` — static seed data: TECH_LADDER (now overridden by useKV), CHECKLIST (now overridden by checklist_v2 KV key), STANDING_ORDERS, BREATH_PATTERNS
- `data/dates.ts` — DATE_CFG: campaign dates (CAMPAIGN_START, EXAM_DATE, phase dates)
- `engine/schedule.ts` — getCampaignProgress, getStatus, pad2

### CAT Sections (files in `sections/`)

| Section         | File                 | Data source                     | Notes                                                                                                                |
| --------------- | -------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Overview        | `Overview.tsx`       | useKV + Supabase + habits-store | Campaign countdown, metrics, **CAT Prep habits strip** (shows today's CAT Prep habits from habits-store, toggleable) |
| Topic Tracker   | `TopicTracker.tsx`   | Supabase `topic_tracker` table  | Auto-seeds DEFAULT_TOPICS on first load                                                                              |
| Weekly Board    | `WeeklyBoard.tsx`    | useKV `weekly_board`            | Kanban board                                                                                                         |
| Error Log       | `ErrorLog.tsx`       | Supabase `error_log` table      | Mistake logger                                                                                                       |
| Checklist       | `Checklist.tsx`      | useKV `checklist_v2`            | **Fully rewritten**: categorized items, add/edit/delete all items, add custom categories                             |
| Breathwork      | `Breathwork.tsx`     | useKV `breath_log`              | Guided breathing with pattern selector                                                                               |
| Meditation      | `Meditation.tsx`     | useKV `meditate_log`            | Guided meditation timer                                                                                              |
| Tech Ladder     | `TechLadder.tsx`     | useKV `tech_ladder`             | **Fully rewritten**: chronological, fully editable (add/edit/delete), sorted by startDate                            |
| Standing Orders | `StandingOrders.tsx` | static                          | Principles display                                                                                                   |

---

## 7. Core State: `src/lib/habits-store.ts`

### Key Types

```ts
type HabitCategory = "Health" | "Mind" | "Productivity" | "Learning" | "Lifestyle" | "CAT Prep";
type HabitDirection = "build" | "break";

interface Habit {
  id: string;
  name: string;
  icon: string; // lucide-react icon name
  category: HabitCategory;
  color: string; // CSS token: "brand"|"brand-2"|"success"|"warning"|"danger"|"info"
  createdAt: string; // ISO date — CRITICAL: habits never appear on dates before createdAt
  direction?: HabitDirection;
  unit?: string;
  benchmarks?: number[]; // sorted ascending; empty = boolean habit
  schedule?: Schedule;
}

interface HabitState {
  habits: Habit[];
  completions: Record<string, Record<string, boolean>>;
  values: Record<string, Record<string, number>>;
  notes: Record<string, string>;
  metrics: Record<string, DailyMetrics>;
  monthlyGoal: number;
  level: number;
  xp: number;
}
```

### localStorage Key Scheme

```
"habit-tracker-v2"         → unauthenticated/demo user
"habit-tracker-v2::<uuid>" → signed-in user (bound by setStoreUser(uid))
```

### Critical Fix: `isScheduledOn` createdAt guard

```ts
// IMPORTANT: habits never show on dates before they were created
if (h.createdAt && iso < h.createdAt) return false;
```

This prevents break/limit habits (e.g. Sugar) from retroactively showing as "completed" for historical days before the habit was added.

### Key Exports

- `useHabits()` — React hook (useSyncExternalStore)
- `setStoreUser(uid | null)` — bind store to user's localStorage bucket
- `toggleHabit(dateISO, habitId)` — boolean habits only; +10 XP when done
- `setHabitValue(dateISO, habitId, value)` — numeric habits
- `addHabit(input)` — sets `createdAt: todayISO()`
- `isScheduledOn(h, iso)` — schedule + createdAt check
- `habitsFor(s, iso)` — scheduled habits for a date (respects createdAt)
- `filterHabitsByScope(habits, scope)` — scope="cat" returns only category==="CAT Prep"
- `completionsForDate(s, dateISO)` → `{ done, total, pct }`

---

## 8. Scope System

```ts
// src/lib/scope.ts
export type Scope = "habit" | "cat";
export const ScopeCtx = createContext<Scope>("habit");
export function useScope() {
  return useContext(ScopeCtx);
}

export function filterHabitsByScope<T extends Habit>(habits: T[], scope: Scope): T[] {
  if (scope === "cat") return habits.filter((h) => h.category === "CAT Prep");
  return habits; // "habit" scope shows all habits
}
```

**CAT Prep habits are visible in BOTH dashboards:**

- In Habit dashboard (scope=habit): all habits shown including CAT Prep
- In CAT dashboard (scope=cat): only CAT Prep habits in the habit tracker
- In CAT Overview: "Today's CAT Prep" widget shows CAT Prep habits with toggle

---

## 9. Auth System

### Working: Magic Link (Email OTP)

```
User enters email → supabase.auth.signInWithOtp({ email }) → Magic link sent to- ✅ HabitHabitat favicon + branding
- ✅ Deployed on Vercel at habithabitat.vercel.app
- ✅ **Dynamic Achievements** — milestone badges auto-unlock based on streaks/completions
- ✅ **Smart Focus Timer Linking** — timer automatically logs minutes to habits
- ✅ **Strict Habit Status Engine** — accurately grades End of Day statuses for Goal vs Limit habits
- ✅ **Journal Search & Filter** — fully searchable with recent entries sidebar
- ✅ **Dynamic Insights Panel** — real-time streaks, weekly MVP, and consistency stats
- ✅ **Push Notifications** — customizable daily browser reminders
- ✅ **CAT Mock Test Tracker** — dedicated UI in CAT dashboard linked to `mock_tests` Supabase table
- ✅ **Streak Freeze Economy** — token-based system to freeze streaks for past days without penalty
- ✅ **Robust Focus Timer** — uses absolute timestamps to prevent browser background throttling
```

### Not Working: Email+Password signup (disabled — future work)

### Route Guards

1. `/` → checks session → redirect to `/dashboard` or `/auth`
2. `/auth` → if session → redirect `/dashboard`
3. `/_authenticated` → `getUser()` or redirect `/auth`; all have `ssr: false`

### Profile System

- Table: `public.profiles` (created by `20260723_profiles_extended.sql`)
- Columns: `id` (uuid FK auth.users), `display_name`, `bio`, `target_college`, `target_percentile`, `city`, `phone`, `avatar_url`, `created_at`, `updated_at`
- Auto-created on signup via DB trigger
- UI: `ProfileModal.tsx` — avatar dropdown in both dashboards' headers; view/edit mode; sign-out button

---

## 10. Supabase Database Tables

All migrations are in `supabase/migrations/`. Run in Supabase SQL Editor for project `umjrxaczrmcstwajtumh`.

| Table             | Migration file                      | Purpose                                      |
| ----------------- | ----------------------------------- | -------------------------------------------- |
| `items`           | `20260722_unified_habit_tables.sql` | Habit definitions (future server sync)       |
| `completions`     | same                                | Habit completions (future server sync)       |
| `daily_metrics`   | same                                | Mood/sleep/water/weight (future server sync) |
| `journal_entries` | same                                | Journal notes (future server sync)           |
| `user_settings`   | same                                | monthly_goal, xp per user                    |
| `topic_tracker`   | CAT-specific                        | CAT study topics with progress               |
| `error_log`       | CAT-specific                        | CAT mistake/error log entries                |
| `profiles`        | `20260723_profiles_extended.sql`    | User profile info                            |

> **Current state**: Only `topic_tracker`, `error_log`, and `profiles` are actively read/written by components. All other tables have RLS but no app code writes to them yet. Data lives in localStorage.

### Supabase Types Caveat

`src/integrations/supabase/types.ts` is auto-generated and does NOT include the `profiles` table yet. Use `(supabase as any).from('profiles')` as a workaround until types are regenerated.

---

## 11. Deployment

### Vercel

- Project: `habithabitat` in `vijitagarwal123-4578's...` Hobby team
- Build command: `npm run build`
- Environment variables set in Vercel:
  - `NITRO_PRESET=vercel` ← **critical**, tells Nitro to output `.vercel/output` instead of Cloudflare Workers
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

### Supabase Auth URLs

In Supabase → Auth → URL Configuration:

- Site URL: `https://habithabitat.vercel.app`
- Redirect URLs include: `https://habithabitat.vercel.app/**`

### Local dev

```powershell
cd "e:\Desktop\operating system\all-in-one\bright-habit-view"
npm run dev   # starts on http://localhost:8081
```

---

## 12. localStorage Keys Summary

| Key                                  | Content                                           |
| ------------------------------------ | ------------------------------------------------- |
| `habit-tracker-v2`                   | Full HabitState (unauthenticated/demo)            |
| `habit-tracker-v2::<uuid>`           | Full HabitState (per signed-in user)              |
| `theme`                              | `"dark"` or `"light"`                             |
| `checklist_v2`                       | `ChecklistItem[]` — CAT checklist with categories |
| `checklist_categories`               | `string[]` — user-added custom categories         |
| `tech_ladder`                        | `TechItem[]` — CAT tech ladder entries            |
| `weekly_board`                       | Board cards for CAT weekly board                  |
| `breath_log`                         | `{ streak, total, lastDate }`                     |
| `meditate_log`                       | `{ streak, total, totalMinutes, lastDate }`       |
| `sb-umjrxaczrmcstwajtumh-auth-token` | Supabase JWT (managed by SDK)                     |

All `useKV` keys are namespaced per user via the bridge.

---

## 13. Recent Changes (2026-07-22 to 2026-07-23)

### Layout & CSS

- Fixed independent scroll: sidebar vs main content use `h-screen overflow-hidden` with `overflow-y-auto` on content
- Scoped `cat-styles.css` inside `CatDashboardShell` to prevent style leakage
- CAT sidebar: collapsible with icon-only mode matching Habit sidebar

### Data & State

- Merged legacy CAT tables into unified schema (`20260722_unified_habit_tables.sql`)
- `TopicTracker.tsx`: auto-seeds `DEFAULT_TOPICS` for new users
- **BUGFIX** `isScheduledOn()`: added `createdAt` guard — habits now never appear on dates before they were created. Fixes break/limit habits showing as "completed" retroactively.

### CAT Overview

- Added "Today's CAT Prep Habits" widget: shows habits with `category === "CAT Prep"` from the habits-store, with toggle checkboxes and progress bar

### Checklist (full rewrite)

- KV key changed: `checklist` → `checklist_v2`
- Items now grouped by **category** (Pre-Launch, Study, Health, Admin, Tech, Other + custom)
- Every item is **editable** (text + category change) and **deletable**
- Can add new **categories** (stored in `checklist_categories` KV)
- Per-category "Add Item" buttons

### Tech Ladder (full rewrite)

- Now stored in `tech_ladder` KV (was static `TECH_LADDER` array in `data/static.ts`)
- Full CRUD: add, edit, delete entries
- Sorted **chronologically** by `startDate` field (ISO date)
- Current/Past status still auto-detected from today's date vs entry date range

### Profile System

- New `profiles` table in Supabase (`20260723_profiles_extended.sql`)
- `ProfileModal.tsx`: dropdown avatar menu in both dashboard headers
- Fields: display_name, bio, target_college, target_percentile, city, phone
- Sign-out button moved into the Profile dropdown

### Branding (2026-07-23, commit 49e12e5)

- `public/favicon.ico`: replaced Lovable favicon with custom HabitHabitat icon (amber + teal bar chart on dark navy, multi-size ICO: 16/32/48/64/128px)
- `public/icon-192.png`, `icon-512.png`: PNG icons for Android/PWA
- `public/apple-touch-icon.png`: 180x180 for iOS home screen add-to-homescreen
- `src/routes/__root.tsx`: title changed to `"HabitHabitat"`, description updated, added `theme-color: #0f1117`, `apple-touch-icon` link, PNG icon link
- Vercel project display name: change manually in Vercel dashboard → Settings → General → Project Name

### Bug Fixes: Calendar, Date Navigation, Overflow (2026-07-23, commit 7119097)

#### UTC Timezone Off-by-One (Critical fix)

- **Root cause**: `new Date(year, month, day).toISOString().slice(0, 10)` converts local time to UTC. In IST (+5:30), midnight local = 6:30 PM previous day UTC → calendar showed yesterday's data when clicking any date.
- **Fix in `CalendarView.tsx`**: Build ISO strings manually: `` `${year}-${mm}-${dd}` `` — no timezone conversion.
- **Fix in `DailyTracker.tsx` `addDays()`**: Same fix — after `setDate()`, format result as local string. Day navigation arrows now move exactly ±1 day.
- **Pattern to remember**: NEVER use `new Date(y, m, d).toISOString()` for date comparisons — always format local dates as strings manually.

#### HabitRow Card Overflow

- Long unit/value stat text (e.g. `0c,ct,pyq,ques · 0%`) was bleeding outside card boundaries in the 2-column grid.
- `HabitRow.tsx`: Added `min-w-0 overflow-hidden` to outer `<div>`, `truncate max-w-[120px]` to stat `<span>`, `shrink-0` to input group.
- `DailyTracker.tsx`: Added `[&>*]:min-w-0` to `<ul>` and `className="min-w-0"` to each `<li>` to properly contain grid cells.

#### Header Date Button → Real Date Picker

- Was: clicking the date button in the top-right header navigated to Calendar view (`onNavigate("calendar")`)
- Now: replaced with a `<DatePicker>` popover — clicking opens an inline calendar, picking a date switches to Daily Tracker pre-loaded to that date.
- `Header.tsx`: Added `DatePicker` import + `onDateChange?: (iso: string) => void` prop; removed old date state/effect.
- `dashboard.tsx`: Added `headerDate` state, wired `onDateChange={(iso) => { setHeaderDate(iso); setActive("daily"); }}`, passes `headerDate` as `initialDate` to `DailyTracker`.

### Lovable UI Polish — Session 1 (2026-07-24, commits b45fb29)

Changes made by lovable.dev — all pure UI, zero logic impact:

- **`Sidebar.tsx`**: Grouped nav into **Overview / Insights / Wellness / System** sections with eyebrow labels. Active item now has a 3px amber gradient left accent bar + gradient-to-right background highlight. Collapsed mode shows horizontal dividers between groups.
- **`dashboard.tsx`** (topbar): Scope toggle now correctly highlights the active button (was hardcoded to Habits). Added "Signed in" indicator with animated green pulse dot. Topbar has increased blur + transparency.
- **`StatCards.tsx`**: Increased `min-h` to 104px, added hover lift (`-translate-y-0.5`).
- **`styles.css`**: Added `radial-gradient` ambient background on `<body>` (fixed, brand-colored orbs). Improved `card-glass` — more transparency, deeper shadow, inner highlight edge. Added `section-eyebrow` utility. Added `scrollbar-thin` utility.
- **`.env`** (⚠️ reverted): Lovable switched Supabase project to a different empty project. **Fixed and removed from git tracking** — `.env` is now in `.gitignore`.

### Lovable UI Polish — Session 2 (2026-07-24, commit c21b51f)

All pure visual changes — TypeScript clean (0 errors):

- **`StatCards.tsx`**: Each card now has a per-card colored gradient top-border line (`accent` prop). Numbers increased to `text-3xl font-bold tracking-tight`. Cards taller (`min-h-[120px]`, `p-6`).
- **`WeeklyProgress.tsx`**: Today's bar in the weekly chart has an amber glow (`drop-shadow`).
- **`CalendarView.tsx`**: Cells rounder (`rounded-xl`), today's cell gets amber glow ring (`shadow-[0_0_12px_...]`), selected cell scales up. Legend items styled as pill badges.
- **`DailyTracker.tsx`**: Progress bar thicker (`h-2.5`), uses new `gradient-amber-teal`, pulses when at 100% (`pulse-glow` class). Stats text uses `tabular-nums`.
- **`Heatmap.tsx`**: Cells slightly larger (20×20 → was 18×18), more rounded (r=6), hover scale + shadow.
- **`auth.tsx`**: Three-orb animated aurora background (`aurora-orb` class with `aurora-shift` keyframes). Auth card now uses `card-glass`. Submit button uses `gradient-amber-teal` with hover glow and brightness.
- **`styles.css`**: Added `scroll-behavior: smooth` globally. All `button` elements get `transition: all 0.15s ease` by default. New utilities: `gradient-amber-teal`, `aurora-orb`, `pulse-glow`, `skeleton` (shimmer animation).

### Security Fix (2026-07-24, commit ada05e5)

- `.env` removed from git tracking (`git rm --cached .env`)
- `.env` and `.env.*` added to `.gitignore` — credentials can never be committed again
- Correct Supabase project (`umjrxaczrmcstwajtumh`) restored in local `.env`
- Vercel env vars (set in Vercel dashboard) were unaffected throughout

### In-Progress States & Duration Stopwatch Habits (2026-07-25, commit 2cbf099)

- **`habitStatus()` in `habits-store.ts`**: Introduced explicit `HabitStatus = "completed" | "in_progress" | "not_started" | "failed"`.
- **Break / Limit Habits (e.g. Limit Sugar)**:
  - Future dates (`iso > today`): Marked as `not_started` (Scheduled 0%).
  - Current date (`iso === today`): Marked as `in_progress` (On Track · Amber tone) until the day finishes at midnight.
  - Past dates (`iso < today`): Automatically locks into `completed` (100% Green) if within limit, or `failed` (0% Red) if limit exceeded.
- **Partial Completion / In-Progress Badges**:
  - Benchmarked habits with `0 < pct < 100` show an explicit Amber **IN PROGRESS** badge and warning border tone (`border-warning/40 bg-warning/5`).
- **Duration / Stopwatch Habits**:
  - `Habit` interface extended with `isTimer?: boolean`.
  - Added live built-in stopwatch timer (`startTimer`, `pauseTimer`, `resumeTimer`, `stopAndSaveTimer`, `cancelTimer`, `getActiveTimer`).
  - `HabitRow.tsx`: Render interactive stopwatch controls (`⏱️ Start Timer`, `Pause`, `Resume`, `Save Time`).
  - Active running timer displays live ticking time (`00:14:20`) with glowing pulsing Amber styling (`pulse-glow`).
  - Saving the timer automatically logs minutes/hours to the habit value and transitions status to `completed` if target benchmark is hit.
  - `HabitManager.tsx`: Added `⏱ Stopwatch / Duration Habit` toggle checkbox in habit creation/edit draft form.

### Cross-Device Supabase Cloud Sync (2026-07-25)

- **`habits-store.ts`**: Connected store to Supabase `kv_store` database table (`key = "habit_state_v2"`).
- **Multi-Device Data Mobility**: Logging in on mobile/other devices using magic link email automatically fetches the user's habits, completions, values, notes, metrics, and timers from Supabase.
- **Instant Local + Async Cloud Sync**: Local modifications (`persist()`) update `localStorage` instantly for zero UI latency, then debounced-upserts to Supabase in the background.
- **Realtime Sync Channel**: Subscribed to Supabase `postgres_changes` on `kv_store`. Checking off a habit on mobile updates desktop in real-time.
- **Auto-Upload Initial Data**: If a user has existing local habits on desktop and signs in on mobile for the first time, local habits are automatically uploaded to Supabase so they immediately appear on mobile.

---

## 14. Known Issues & Future Work

| Issue                                          | Priority | Notes                                                                    |
| ---------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| Supabase types.ts missing `profiles` table     | Low      | Use `(supabase as any)` workaround                                       |
| Achievements are static                        | Low      | 4 hardcoded badges, not computed from real data                          |
| Seed habits have old `createdAt` (60 days ago) | Info     | Demo users see full 60-day history. Real users start from today          |

---

## 15. Key Code Patterns

### 1. Adding a new habit — always sets `createdAt: todayISO()`

```ts
export function addHabit(input: Omit<Habit, "id" | "createdAt">) {
  const h: Habit = { ...input, id: generateId(), createdAt: todayISO() };
  ...
}
```

### 2. Reading habits for a date — always go through `habitsFor` (respects schedule + createdAt)

```ts
const scheduled = habitsFor(s, dateISO); // NOT s.habits.filter(...)
```

### 3. CAT vs Habit scope filtering

```ts
const habits = filterHabitsByScope(habitsFor(s, today), "cat"); // only CAT Prep
const habits = filterHabitsByScope(habitsFor(s, today), "habit"); // all habits
```

### 4. useKV — always object destructure (NOT array)

```ts
const { value: items, setValue: setItems } = useKV<MyType[]>("my_key", []);
// NOT: const [items, setItems] = useKV(...)  ← WRONG
```

### 5. Toggle habit (boolean only)

```ts
// Never call toggleHabit on a benchmarked habit
if (!h.benchmarks?.length) toggleHabit(dateISO, h.id);
```

### 6. Supabase profiles workaround

```ts
// types.ts doesn't know about profiles yet
const { data } = await (supabase as any).from("profiles").select("*").eq("id", user.id);
```

---

## 16. Git History (latest commits)

```
08a04de feat(FocusTimer): add pause and resume functionality
563c0e2 fix: missing closing div in ProfileModal portal and Sidebar import indent
e8aea0f feat(Sidebar): hover-only float expand, remove lock toggle button
1063634 fix(ProfileModal): fix z-index clipping, portal outside-click, add hover-open (300ms)
7648129 feat(CatSidebar): hover-only float expand, remove lock toggle button
5460fee feat(ProfileModal): convert to fixed modal overlay and improve trigger layout
5bcc271 fix(Sidebar): hide close button on desktop
b59925f feat: layout uniformity and cat dashboard theme mapping
5cb8874 feat: sync theme hook and profile persistence
6b4ea3f style: custom scrollbars and hidden overflow-x
e9b6b90 feat(Overview): use HabitRowConnected for CAT Prep widget
e1056dc feat: update CAT Prep widget with HabitRowConnected
a07361d feat(QuickLogWidget): use habitStatus for accuracy
1927688 feat(cat-dashboard): implement reactive dashboard cards with live sync
b05f4dd fix(cat-dashboard): resolve ProfileModal layout clipping and click conflict in sidebar
```

### Phase 2 Completion (2026-07-28)

- **QuickLogWidget**: Added a floating action button for quickly logging today's incomplete habits from anywhere in the app.
- **WeeklyReviewBanner**: Integrated a Sunday evening prompt (shows after 6 PM) to remind users to review their week.
- **Habit Templates**: Added predefined habit packs (CAT Prep, Deep Work) in `HabitManager` with one-click installation functionality.

### Phase 3 Completion (2026-07-28)

- **UI Refinements & Fixes**: 
  - Made the 'Your Habits' section in `HabitManager` collapsible to reduce clutter.
  - Added new `AnalogueClock` (Dashboard Home) and `DigitalClock` (CAT & Habit headers) components.
  - Completely rebuilt the `Heatmap` row-mapping logic to map 1:1 to user habits instead of arbitrarily grouping by 7 days.
  - Fixed the `ProfileModal` open/close state toggling to prevent bubbling issues on the CAT Dashboard.
  - Fixed the end-of-day completion logic for "Break/Limit" habits (e.g. Limit Sugar) to accurately reflect their benchmark state based on past days instead of defaulting to 100%.

### Phase 4 Completion (2026-07-31)

- **Sidebar Architecture Overhaul**: Replaced the static/locked sidebar functionality with a modern, hover-only float expanding layout for both `Sidebar` and `CatSidebar`. This eliminates main content layout shifts entirely while providing a clean 60px gutter for navigation.
- **Profile Modal Enhancements**: Extracted the modal into a fixed portal overlay (`createPortal` with `z-[200]`) to solve global layout clipping across both dashboards. Added 300ms hover-to-open interaction (with click fallback) and intelligent outside-click detection.
- **CAT Dashboard Polish**: The CAT Prep widget was fully wired to use the interactive `HabitRowConnected` component for live toggle capabilities. Dashboard cards were made reactive with live synchronization.
- **Focus Timer Overhaul**: Implemented robust Pause/Resume functionality for the built-in timer, preserving absolute time deltas via the Web Worker without losing current session state.
- **QuickLog Accuracy**: `QuickLogWidget` now uses the strict `habitStatus` engine to accurately reflect the progress of Break/Limit and Stopwatch habits.

Push command: `git push origin main` from `e:\Desktop\operating system\all-in-one\bright-habit-view`

---

## 17. Contacts & External Services

| Service           | Detail                                             |
| ----------------- | -------------------------------------------------- |
| Supabase project  | `umjrxaczrmcstwajtumh` — project "mission_control" |
| Supabase anon key | in local `.env` only — never in git                |
| Vercel team       | `vijitagarwal123-4578's... (Hobby)`                |
| GitHub            | `vijitagarwal/habithabitat`                        |
| Live URL          | `https://habithabitat.vercel.app`                  |
