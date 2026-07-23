# HabitHabitat — Complete Project Summary (Updated 2026-07-23)

> **Purpose**: Exhaustive technical reference for continuing this codebase. Written for an AI assistant with zero prior context. Read this entire file before making any changes.

---

## 0. Quick Facts

| Field | Value |
|---|---|
| **Live URL** | https://habithabitat.vercel.app |
| **GitHub repo** | `vijitagarwal/habithabitat` (was: `bright-habit-view`) |
| **Local folder** | `e:\Desktop\operating system\all-in-one\bright-habit-view` |
| **Supabase project** | `umjrxaczrmcstwajtumh` (project name: `mission_control`) |
| **Supabase URL** | `https://umjrxaczrmcstwajtumh.supabase.co` |
| **Deployment** | Vercel (Hobby), env var `NITRO_PRESET=vercel` |
| **Auth** | Supabase magic link (email OTP) — magic link works; email+password sign-up is disabled |

### ⚠️ Both Folders Explanation

There are **two folders** in `all-in-one/`:
- **`bright-habit-view/`** ← **THE ACTIVE PROJECT** (deployed to habithabitat.vercel.app)
- **`mission-cat-pro/`** ← **ARCHIVED reference** — the old standalone CAT dashboard (separate repo `vijitagarwal/Mission-Control-and-tracking-2026..`), deployed separately on Vercel. It is NOT used in the current workflow. All CAT features have been merged into `bright-habit-view`.

**Only `bright-habit-view/` should be edited going forward.**

---

## 1. Stack & Tooling

| Concern | Choice |
|---|---|
| Framework | **TanStack Start** (SSR, Vite-based React meta-framework) |
| Language | TypeScript 5.8 |
| Bundler | Vite 8 |
| Router | `@tanstack/react-router` (file-based, type-safe) |
| Server | `@tanstack/react-start` + Nitro (preset: `vercel` at build time) |
| Auth + DB | **Supabase** (`@supabase/supabase-js` v2) |
| CSS | TailwindCSS v4 (`@tailwindcss/vite`) + CSS variables (OKLCH palette) |
| UI Primitives | **shadcn/ui** — Radix-UI components in `src/components/ui/` |
| Charts | **Recharts** |
| Icons | **lucide-react** |
| State | Custom `useSyncExternalStore` singleton (`src/lib/habits-store.ts`) — NO Redux, NO Zustand |
| Persistence | **localStorage only** — Supabase tables exist but data sync not yet wired (future work) |
| Config | `@lovable.dev/vite-tanstack-config` wraps vite.config.ts (defaults to Cloudflare Workers; override with `NITRO_PRESET=vercel`) |

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

| Key | Component | Description |
|---|---|---|
| `dashboard` | inline in `dashboard.tsx` | Home: StatCards + WeeklyProgress + CategoryBreakdown + TodaysHabits + Heatmap + TopHabits |
| `daily` | `DailyTracker` | Date nav + habit list for selected date |
| `calendar` | `CalendarView` | Month grid + DailyTracker for selected day |
| `analytics` | inline | StatCards + charts |
| `heatmap` | `Heatmap` | Monthly heatmap grid |
| `goals` | `GoalsView` | Monthly goal slider + per-habit bar charts |
| `achievements` | `Achievements` | Static badge grid |
| `journal` | `JournalView` | Daily notes textarea |
| `mood/sleep/water/weight` | `MetricTracker` | Input + LineChart |
| `settings` | `HabitManager` | Full habit CRUD + reset |

### Key Supporting Components

| Component | Purpose |
|---|---|
| `Sidebar.tsx` | Collapsible left nav (icon-only when collapsed), Level/XP widget at bottom |
| `Header.tsx` | Page title + dark/light toggle + **ProfileModal** trigger |
| `ProfileModal.tsx` | Avatar dropdown + view/edit user profile + sign-out button |
| `HabitRow.tsx` + `HabitRowConnected` | Single habit row; boolean toggle OR numeric benchmark input |
| `HabitManager.tsx` | CRUD for habits; DraftForm with all fields |
| `ScheduleEditor.tsx` | Schedule type picker + conditional day/date selectors |

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

| Section | File | Data source | Notes |
|---|---|---|---|
| Overview | `Overview.tsx` | useKV + Supabase + habits-store | Campaign countdown, metrics, **CAT Prep habits strip** (shows today's CAT Prep habits from habits-store, toggleable) |
| Topic Tracker | `TopicTracker.tsx` | Supabase `topic_tracker` table | Auto-seeds DEFAULT_TOPICS on first load |
| Weekly Board | `WeeklyBoard.tsx` | useKV `weekly_board` | Kanban board |
| Error Log | `ErrorLog.tsx` | Supabase `error_log` table | Mistake logger |
| Checklist | `Checklist.tsx` | useKV `checklist_v2` | **Fully rewritten**: categorized items, add/edit/delete all items, add custom categories |
| Breathwork | `Breathwork.tsx` | useKV `breath_log` | Guided breathing with pattern selector |
| Meditation | `Meditation.tsx` | useKV `meditate_log` | Guided meditation timer |
| Tech Ladder | `TechLadder.tsx` | useKV `tech_ladder` | **Fully rewritten**: chronological, fully editable (add/edit/delete), sorted by startDate |
| Standing Orders | `StandingOrders.tsx` | static | Principles display |

---

## 7. Core State: `src/lib/habits-store.ts`

### Key Types

```ts
type HabitCategory = "Health" | "Mind" | "Productivity" | "Learning" | "Lifestyle" | "CAT Prep";
type HabitDirection = "build" | "break";

interface Habit {
  id: string;
  name: string;
  icon: string;          // lucide-react icon name
  category: HabitCategory;
  color: string;         // CSS token: "brand"|"brand-2"|"success"|"warning"|"danger"|"info"
  createdAt: string;     // ISO date — CRITICAL: habits never appear on dates before createdAt
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
export function useScope() { return useContext(ScopeCtx); }

export function filterHabitsByScope<T extends Habit>(habits: T[], scope: Scope): T[] {
  if (scope === "cat") return habits.filter((h) => h.category === "CAT Prep");
  return habits;  // "habit" scope shows all habits
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
User enters email → supabase.auth.signInWithOtp({ email }) → Magic link sent to inbox
→ User clicks link → Redirected to habithabitat.vercel.app → Logged in
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

| Table | Migration file | Purpose |
|---|---|---|
| `items` | `20260722_unified_habit_tables.sql` | Habit definitions (future server sync) |
| `completions` | same | Habit completions (future server sync) |
| `daily_metrics` | same | Mood/sleep/water/weight (future server sync) |
| `journal_entries` | same | Journal notes (future server sync) |
| `user_settings` | same | monthly_goal, xp per user |
| `topic_tracker` | CAT-specific | CAT study topics with progress |
| `error_log` | CAT-specific | CAT mistake/error log entries |
| `profiles` | `20260723_profiles_extended.sql` | User profile info |

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

| Key | Content |
|---|---|
| `habit-tracker-v2` | Full HabitState (unauthenticated/demo) |
| `habit-tracker-v2::<uuid>` | Full HabitState (per signed-in user) |
| `theme` | `"dark"` or `"light"` |
| `checklist_v2` | `ChecklistItem[]` — CAT checklist with categories |
| `checklist_categories` | `string[]` — user-added custom categories |
| `tech_ladder` | `TechItem[]` — CAT tech ladder entries |
| `weekly_board` | Board cards for CAT weekly board |
| `breath_log` | `{ streak, total, lastDate }` |
| `meditate_log` | `{ streak, total, totalMinutes, lastDate }` |
| `sb-umjrxaczrmcstwajtumh-auth-token` | Supabase JWT (managed by SDK) |

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

---

## 14. Known Issues & Future Work

| Issue | Priority | Notes |
|---|---|---|
| Email+password signup not working | Medium | Magic link works fine. Email OTP is the primary auth path |
| Supabase types.ts missing `profiles` table | Low | Use `(supabase as any)` workaround |
| No Supabase data sync for habits | Future | localStorage is the single source of truth. Tables exist for future sync |
| Achievements are static | Low | 4 hardcoded badges, not computed from real data |
| Seed habits have old `createdAt` (60 days ago) | Info | Demo users see full 60-day history. Real users start from today |

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
const scheduled = habitsFor(s, dateISO);  // NOT s.habits.filter(...)
```

### 3. CAT vs Habit scope filtering
```ts
const habits = filterHabitsByScope(habitsFor(s, today), 'cat');  // only CAT Prep
const habits = filterHabitsByScope(habitsFor(s, today), 'habit'); // all habits
```

### 4. useKV — always object destructure (NOT array)
```ts
const { value: items, setValue: setItems } = useKV<MyType[]>('my_key', []);
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
const { data } = await (supabase as any).from('profiles').select('*').eq('id', user.id);
```

---

## 16. Git History (latest commits)

```
ca5c6da  chore: add vercel.json for Vercel deployment
bfba8dd  feat: profile modal + extended profiles migration
9ba83d9  feat: TopicTracker auto-seed DEFAULT_TOPICS
c77c69e  feat: unified CAT + Habit dashboard (57 files)
```

Push command: `git push origin main` from `e:\Desktop\operating system\all-in-one\bright-habit-view`

---

## 17. Contacts & External Services

| Service | Detail |
|---|---|
| Supabase project | `umjrxaczrmcstwajtumh` — project "mission_control" |
| Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtanJ4YWN6cm1jc3R3YWp0dW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNjQ2ODQsImV4cCI6MjA5ODg0MDY4NH0.Qt5_GmJXtSoeXjeJJFRS8Aefy1F6aZZlc5N1-Vns4c4` |
| Vercel team | `vijitagarwal123-4578's... (Hobby)` |
| GitHub | `vijitagarwal/habithabitat` |
