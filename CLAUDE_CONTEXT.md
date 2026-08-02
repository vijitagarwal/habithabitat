# HabitHabitat — AI Context File for Claude

> This file is the complete, structured brief for Claude (or any AI assistant) to understand this project deeply and give accurate, contextual advice.
> Read this entire file before answering any question or suggesting any code.

---

## TL;DR — What Is This?

**HabitHabitat** is a personal productivity app (live at `https://habithabitat.vercel.app`, GitHub: `vijitagarwal/habithabitat`) built as a single web application with **two distinct dashboards in one shell**:

1. **Habit Tracker** — A flexible, analytics-first habit tracker with build/break habits, numeric benchmarks, stopwatch timers, scheduling, gamification (XP/levels/streak freezes), journaling, health metrics, heatmaps, achievements, and push notifications.

2. **CAT 2026 Prep Dashboard** — A dedicated exam prep cockpit for the CAT business school entrance exam (India). Includes countdown timer, topic tracker, kanban board, error log, mock test analytics, focus timer, breathwork/meditation, and more.

The developer is **Vijit Agarwal**, who is simultaneously preparing for the CAT 2026 exam and building this app as a personal tool. The exam is November 29, 2026.

---

## Tech Stack — What You're Working With

| Layer | Technology | Notes |
|---|---|---|
| Framework | **TanStack Start** | SSR React meta-framework, similar to Next.js but TanStack-specific |
| Language | **TypeScript 5.8** | Strict typing throughout |
| Router | **@tanstack/react-router** | File-based routing; zod-validated search params |
| Server | **Nitro** | Must use `NITRO_PRESET=vercel` env var |
| Database + Auth | **Supabase** (@supabase/supabase-js v2) | PostgreSQL + Auth; magic link only |
| Styling | **TailwindCSS v4** + custom CSS | OKLCH CSS variables; utility classes in styles.css |
| UI Components | **shadcn/ui** (Radix-UI) | 46 components in `src/components/ui/` |
| Charts | **Recharts** | Used for weekly progress, metrics |
| Animations | **Framer Motion** | Used for motion effects |
| Drag & Drop | **@dnd-kit** | Used in kanban board (WeeklyBoard) |
| Icons | **Lucide React** | Icon names stored as strings in Habit.icon |
| State | **Custom useSyncExternalStore** | No Redux, no Zustand — custom singleton |
| Bundler | **Vite 8** | via @lovable.dev/vite-tanstack-config wrapper |
| Deployment | **Vercel** | Auto-deploys on push to main |

**Key additional packages**: `date-fns`, `canvas-confetti`, `react-hook-form`, `zod`, `sonner` (toasts), `react-day-picker`, `framer-motion`

---

## Project Structure — File Map

```
src/
├── routes/
│   ├── __root.tsx              # App root: QueryClientProvider, head/meta/title/favicon
│   ├── index.tsx               # / → redirects to /dashboard or /auth
│   ├── auth.tsx                # /auth — magic link sign-in page (aurora animated bg)
│   └── _authenticated/
│       ├── route.tsx           # Auth guard (ssr: false) — redirects to /auth if no session
│       └── dashboard.tsx       # /dashboard — THE main app page (both dashboards live here)
├── lib/
│   ├── habits-store.ts         # 1431-line core state singleton — ALL habit logic here
│   ├── scope.ts                # ScopeCtx React context + filterHabitsByScope()
│   ├── scope-aware-stats.ts    # Statistics helpers filtered by scope
│   └── utils.ts                # cn() (classnames helper)
├── components/
│   ├── ui/                     # 46 shadcn/ui primitive components
│   ├── dashboard/              # 26 habit dashboard components (see below)
│   └── cat-dashboard/          # CAT prep dashboard (shell + sections + bridge)
└── integrations/supabase/
    ├── client.ts               # Supabase client singleton
    └── types.ts                # Auto-generated DB types (INCOMPLETE — see caveats)
```

---

## The Core State: `habits-store.ts`

This is the most important file. Everything about habits lives here.

### TypeScript Types

```typescript
type HabitCategory = "Health" | "Mind" | "Productivity" | "Learning" | "Lifestyle" | "CAT Prep";
type HabitDirection = "build" | "break";
type ScheduleType = "daily" | "weekdays" | "weekly" | "monthly" | "oneoff";
type HabitStatus = "completed" | "in_progress" | "not_started" | "failed";

interface Habit {
  id: string;
  name: string;
  icon: string;           // lucide-react icon name string
  category: HabitCategory;
  color: string;          // "brand" | "brand-2" | "success" | "warning" | "danger" | "info"
  createdAt: string;      // ISO date "YYYY-MM-DD" — CRITICAL guard
  direction?: "build" | "break";
  unit?: string;
  benchmarks?: number[];  // sorted ascending; empty = boolean habit
  schedule?: Schedule;
  isTimer?: boolean;      // true = stopwatch/duration habit
}

interface Schedule {
  type: ScheduleType;
  weekdays?: number[];    // 0=Sun..6=Sat
  monthDay?: number | "last";
  date?: string;          // ISO date for "oneoff"
}

interface HabitState {
  habits: Habit[];
  completions: Record<string, Record<string, boolean>>;  // [dateISO][habitId]
  values: Record<string, Record<string, number>>;         // [dateISO][habitId]
  notes: Record<string, string>;                          // [dateISO]
  metrics: Record<string, DailyMetrics>;                  // [dateISO]
  monthlyGoal: number;
  level: number;
  xp: number;
  freezeTokens: number;
  freezes: Record<string, Record<string, boolean>>;
  reminderSettings: ReminderSettings;
}
```

### How the Store Works

1. **React hook**: `const state = useHabits()` — uses `useSyncExternalStore`
2. **Mutations**: Direct function calls like `toggleHabit(dateISO, habitId)` — these update state, re-notify subscribers, write to localStorage, and debounce a Supabase upsert
3. **localStorage**: Two keys — `"habit-tracker-v2"` (unauth) and `"habit-tracker-v2::<uuid>"` (signed-in)
4. **Cloud sync**: Full state serialized to Supabase `kv_store` table as JSON blob under key `"habit_state_v2"`. Real-time channel syncs across devices instantly.

### All Store Exports (functions available to call)

```typescript
useHabits()                           // React hook
setStoreUser(uid: string | null)      // Called on auth state change
toggleHabit(dateISO, habitId)         // Boolean habits only (+10 XP)
setHabitValue(dateISO, habitId, v)    // Numeric habits
addHabit(input)                       // createdAt auto-set to today
updateHabit(id, patch)                // Partial update
deleteHabit(id)                       // Removes habit + all data
setNote(dateISO, text)                // Journal entry
setMetric(dateISO, key, value)        // mood/sleep/water/weight
setMonthlyGoal(n)                     // Monthly target %
freezeStreak(habitId, dateISO)        // Spend freeze token
startTimer(habitId, dateISO)
pauseTimer(habitId)
resumeTimer(habitId)
stopAndSaveTimer(habitId, dateISO)    // Saves to habit value
cancelTimer(habitId)
getActiveTimer(habitId)               // Returns ActiveTimer | null
// Helpers (pure, no state change):
habitsFor(state, dateISO)             // Scheduled habits for a date
isScheduledOn(habit, dateISO)         // Boolean schedule check
filterHabitsByScope(habits, scope)    // "cat" = only CAT Prep category
completionsForDate(state, dateISO)    // { done, total, pct }
habitStatus(state, habit, dateISO)    // HabitStatus enum
```

### Critical Rules for Store Usage

1. **NEVER** call `toggleHabit` on a numeric (benchmarked) habit — use `setHabitValue` instead
2. **ALWAYS** get habits via `habitsFor(state, dateISO)` — never `state.habits.filter(...)`
3. **`createdAt` guard**: habits never appear on dates before `habit.createdAt`. This is enforced in `isScheduledOn`.
4. **Date strings**: Always format as `"YYYY-MM-DD"` using local timezone. **NEVER** use `new Date().toISOString()` for this — it converts to UTC and causes off-by-one bugs in IST (+5:30).

```typescript
// CORRECT date formatting:
const today = new Date().toLocaleDateString('en-CA'); // "YYYY-MM-DD" local TZ
const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

// WRONG (UTC conversion bug):
new Date(year, month, day).toISOString().slice(0, 10); // ← NEVER DO THIS
```

---

## The Two Dashboards

### How Routing Works

`/dashboard?scope=habit` → Habit dashboard  
`/dashboard?scope=cat` → CAT dashboard

In `dashboard.tsx`:
```typescript
const { scope = "habit" } = Route.useSearch();
if (scope === "cat") {
  return <CatDashboardShell />;  // Completely separate React tree
}
// else: render habit dashboard with Sidebar + Header + views
```

### Habit Dashboard Views (`renderView(activeKey)`)

| Key | Component | What it shows |
|---|---|---|
| `dashboard` | DashboardHome | Stats, clock, weekly chart, heatmap, top habits, insights, achievements |
| `daily` | DailyTracker | Date navigation + today's habit list |
| `calendar` | CalendarView | Month grid + day detail |
| `analytics` | AnalyticsView | Same stats cards + charts as dashboard |
| `heatmap` | Heatmap | Per-habit consistency grid |
| `goals` | GoalsView | Monthly goal + per-habit bars |
| `achievements` | Achievements | Badge grid |
| `journal` | JournalView | Daily notes with search |
| `mood/sleep/water/weight` | MetricTracker | Metric input + line chart |
| `settings` | HabitManager | Full habit CRUD |

### CAT Dashboard Sections (19 total)

Located in `src/components/cat-dashboard/sections/`:

`Overview`, `Analytics`, `CampaignMap`, `CatCore`, `TopicTracker`, `MockTracker`, `WeeklyBoard`, `ErrorLog`, `Checklist`, `Breathwork`, `Meditation`, `FocusTimer`, `TechLadder`, `RightNow`, `Health`, `Heatmap`, `Contingency`, `DataExport`, `StandingOrders`

---

## CAT Dashboard: The Bridge Pattern

CAT sections import from `src/components/cat-dashboard/bridge/` instead of directly from app hooks. This decouples them.

```typescript
// Import pattern used in ALL CAT section files:
import { supabase, useKV, useAuth, useToast } from "../bridge";

// useKV usage — ALWAYS object destructure, never array:
const { value: items, setValue: setItems, loading } = useKV<Item[]>("my_key", []);
// ❌ WRONG: const [items, setItems] = useKV(...)

// supabase is typed as `any` to allow CAT-specific tables without TS errors:
const { data } = await supabase.from("topic_tracker").select("*");
```

---

## Database (Supabase)

**Project ID**: `umjrxaczrmcstwajtumh`  
**Project name**: `mission_control`

### Active Tables (used by app code)

| Table | Who uses it | Purpose |
|---|---|---|
| `kv_store` | habits-store.ts | Full HabitState JSON blob. Key = `"habit_state_v2"`. Powers cross-device sync. |
| `profiles` | ProfileModal.tsx | User profile (display_name, bio, target_college, target_percentile, city, phone, avatar_url) |
| `topic_tracker` | TopicTracker.tsx | CAT topics with progress. Auto-seeded from DEFAULT_TOPICS for new users. |
| `error_log` | ErrorLog.tsx | CAT mistake log entries |
| `mock_tests` | MockTracker.tsx | CAT mock test scores and analytics |

### Tables Present But Not Yet App-Wired

`items`, `completions`, `daily_metrics`, `journal_entries`, `user_settings`, `topic_history`, `topic_progress_history` — All exist with RLS but app uses kv_store blob instead.

### ⚠️ Critical Type Caveat

`src/integrations/supabase/types.ts` is auto-generated and **does NOT include** `profiles`, `kv_store`, or any CAT tables. Always use `(supabase as any).from(...)` for these tables:

```typescript
// Required pattern for non-typed tables:
await (supabase as any).from("profiles").select("*").eq("id", userId);
await (supabase as any).from("kv_store").upsert({ key: "habit_state_v2", value: state });
```

---

## Auth System

- **Method**: Supabase Magic Link (email OTP) only
- **Email+Password**: Disabled
- **Route protection**: `/_authenticated/route.tsx` calls `supabase.auth.getUser()` client-side (`ssr: false`). If no user → redirect to `/auth`.
- **Store binding**: On auth state change → `setStoreUser(userId)` switches the localStorage key to the user's personal bucket

---

## CSS & Design System

### Color Tokens (OKLCH-based, defined in `styles.css`)

- `brand` — Primary accent (amber/gold tones)
- `brand-2` — Secondary accent (teal tones)
- `success` — Green
- `warning` — Amber/yellow
- `danger` — Red
- `info` — Blue

### Key Custom Utility Classes

| Class | What it does |
|---|---|
| `card-glass` | Glassmorphism card (backdrop-blur, subtle border) |
| `gradient-amber-teal` | Amber→teal gradient (buttons, progress bars) |
| `gradient-brand` | Primary brand gradient |
| `section-eyebrow` | Small uppercase label |
| `pulse-glow` | Pulsing glow (used on active timer, 100% progress) |
| `aurora-orb` | Animated ambient orb (auth page background) |
| `skeleton` | Shimmer loading animation |

---

## HabitStatus Logic (Important for UI)

The `habitStatus(state, habit, dateISO)` function returns one of:

```
"completed"   → boolean done, OR numeric >= max benchmark
"in_progress" → numeric > 0 but < max benchmark, OR break/limit habit on today's date
"not_started" → no data logged for this habit on this date
"failed"      → break/limit habit on past date where limit was exceeded
```

**Break/Limit habits**: On today they're always `in_progress` (amber "On Track") until midnight. On past days they lock into `completed` or `failed` based on actual value vs benchmark.

---

## Sidebar Architecture

Both sidebars (Habit and CAT) use the same pattern:
- **60px collapsed width** — icon-only, always visible
- **Hover to expand** — floats over content (does NOT shift main content)
- No lock toggle button
- Profile modal is a separate `createPortal` overlay at `z-[200]`

---

## What's Working vs. Not Working

### ✅ Working
- Magic link auth (sign in, sign out)
- Habit CRUD (add, edit, delete, all types)
- Boolean, numeric, and stopwatch habit tracking
- Break/Limit habit status engine
- Streak freeze economy
- Cross-device sync via kv_store
- Real-time sync across devices
- User profiles (view and edit)
- All CAT sections (topic tracker, error log, mock tracker, checklist, tech ladder, breathwork, meditation, focus timer, kanban board, etc.)
- Push notifications (browser, with permission)
- Dynamic achievements
- Journal with search
- Health metrics (mood, sleep, water, weight)
- Heatmap, analytics, calendar, goal tracking
- Hover-only floating sidebars
- Dark mode (only — app is dark-only currently)

### ❌ Not Working / Future Work
- Email+password signup (disabled in Supabase)
- Onboarding flow for new users (drops into empty dashboard)
- Direct DB sync for items/completions/metrics tables (uses kv_store blob instead)
- `supabase/types.ts` regeneration (profiles + kv_store missing)
- Performance optimization for >100 habits

---

## Development Workflow

```powershell
# Local dev
cd "d:\UOS\operating system\all-in-one\bright-habit-view"
npm run dev       # http://localhost:8081

# Deploy (auto via Vercel)
git push origin main

# Format code
npm run format

# Lint
npm run lint
```

---

## Gotchas & Anti-Patterns to Avoid

1. **Date formatting**: Never `new Date(y, m, d).toISOString()`. Always build ISO strings manually or use `toLocaleDateString('en-CA')`.

2. **useKV**: Always `{ value, setValue } = useKV(...)`. Never `[value, setValue] = useKV(...)`.

3. **Toggle vs setValue**: Boolean habits → `toggleHabit()`. Numeric habits → `setHabitValue()`. Mixing these corrupts state.

4. **habitsFor() not state.habits**: Always `habitsFor(s, dateISO)` to get scheduled habits. `state.habits` gives you ALL habits without schedule/createdAt filtering.

5. **Supabase types**: `(supabase as any).from('profiles')` until types.ts is regenerated.

6. **CAT styles**: `cat-styles.css` is scoped inside `CatDashboardShell` via a CSS class wrapper. Don't move this pattern — prevents style leakage.

7. **NITRO_PRESET**: Must be `vercel` in environment. Without it, build outputs Cloudflare Workers format.

8. **ProfileModal portal**: Must use `createPortal(modal, document.body)` with `z-[200]`. Rendering inside either dashboard's DOM tree causes z-index clipping.

9. **Realtime subscription**: The kv_store realtime channel is managed inside `habits-store.ts`. Don't add duplicate subscriptions elsewhere.

10. **SSR**: All authenticated routes have `ssr: false`. Supabase auth needs the browser's localStorage — SSR will break auth.

---

## Current Project Status (as of 2026-08-02)

The app is **production-ready and actively used** for daily habit tracking and CAT exam prep. All core features are working. The main gaps are:

1. No onboarding for new users
2. Supabase types.ts needs regeneration
3. The individual Supabase tables (items, completions, etc.) are set up but the app uses kv_store blob sync instead
4. No mobile-native PWA features beyond the icons (notifications are browser-based)

The developer is actively using this app daily while also studying for CAT. Future work is driven by personal pain points encountered during daily use.

---

## How to Advise This Developer

- **Context**: Solo developer, using the app personally, iterating quickly based on daily use
- **Priorities**: Reliability > Features > Polish (the app must work for daily use)
- **Style preferences**: Dark mode, glassmorphism, amber+teal color scheme, smooth animations, desktop-first
- **Code preferences**: TypeScript strict, no external state managers (prefers the custom store pattern), shadcn/ui for UI components
- **CAT exam context**: The exam is November 29, 2026. Features related to CAT prep have deadline-driven urgency
- **Local path**: `d:\UOS\operating system\all-in-one\bright-habit-view` (NOT `e:\Desktop\...` — that was an old path)
