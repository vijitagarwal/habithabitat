# Agent Prompt — HabitHabitat: Phase 2 Build

> **Read this entire file before writing a single line of code.**
> Then read `PROJECT_SUMMARY(habit_dashboard).md` in full.
> Only after both are understood should you begin work.

---

## 0. Who You Are and What This Is

You are a senior full-stack coding agent continuing development of **HabitHabitat** — a personal productivity and exam-prep dashboard that is already live at **https://habithabitat.vercel.app**.

The user is **Vijit**, a CAT 2026 aspirant who is also building tech skills (FlyRank, DSA) alongside exam prep. This app is their daily mission control. It must feel premium, fast, and deeply personal — not generic.

**Your job is to improve, polish, and extend the app.** You are NOT rebuilding it. Respect what exists. Only add, fix, or enhance.

---

## 1. Mandatory First Steps

Before touching any code:

1. **Read `PROJECT_SUMMARY(habit_dashboard).md`** — this is the single source of truth for architecture, patterns, file locations, and known issues.
2. **Read `AGENTS.md`** — coding conventions.
3. **Run `npx tsc --noEmit`** — confirm the codebase is currently error-free before you start.
4. **Check git status** — confirm working tree is clean.

Only then proceed.

---

## 2. The Stack (Do Not Change These)

| Layer           | Choice                                                           |
| --------------- | ---------------------------------------------------------------- |
| Framework       | TanStack Start (SSR) + Vite 8                                    |
| Language        | TypeScript 5.8 — **strict, no `any` shortcuts**                  |
| CSS             | TailwindCSS v4 + OKLCH CSS variable tokens                       |
| State           | `habits-store.ts` singleton (localStorage) — respect the pattern |
| DB              | Supabase (magic link auth works; email+password not wired yet)   |
| Deployment      | Vercel — push to `main` branch triggers auto-deploy              |
| Package manager | `npm` (or `bun`)                                                 |

**CAT dashboard** uses its own `cat-styles.css`, `bridge.ts`, and `useKV` hook — keep them isolated from the habit dashboard styles.

---

## 3. Critical Patterns — Never Break These

### 3a. Date Handling — The UTC Trap

```ts
// ❌ WRONG — breaks in IST (+5:30) and all UTC+ timezones
const iso = new Date(year, month, day).toISOString().slice(0, 10);

// ✅ CORRECT — always format local dates as strings
const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

// ✅ CORRECT — for adding days
function addDays(iso: string, delta: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
```

### 3b. Habit Scheduling — Never Filter Raw

```ts
// ❌ WRONG
const habits = s.habits.filter(...);

// ✅ CORRECT — respects schedule + createdAt guard
const habits = habitsFor(s, dateISO);
```

### 3c. useKV — Always Object Destructure

```ts
// ❌ WRONG (array destructuring doesn't work)
const [items, setItems] = useKV("key", []);

// ✅ CORRECT
const { value: items, setValue: setItems } = useKV<MyType[]>("key", []);
```

### 3d. Habit Toggle — Check for Benchmarks First

```ts
// Never call toggleHabit on a benchmarked habit
if (!h.benchmarks?.length) toggleHabit(dateISO, h.id);
else setHabitValue(dateISO, h.id, numericValue);
```

### 3e. Overflow Containment in Grids

```tsx
// All grid items that contain habit cards MUST have min-w-0
<ul className="grid grid-cols-2 gap-2 [&>*]:min-w-0">
  <li className="min-w-0"><HabitRowConnected ... /></li>
</ul>
// And the card itself:
<div className="rounded-xl border ... min-w-0 overflow-hidden">
```

---

## 4. What Is Currently Working

- ✅ Magic link login (Supabase OTP)
- ✅ Habit CRUD (add, edit, delete, schedule)
- ✅ Daily tracker with date navigation (timezone fixed)
- ✅ Calendar view with month grid + daily panel
- ✅ Analytics: streaks, heatmap, weekly progress, category breakdown
- ✅ CAT dashboard: countdown, topic tracker, error log, checklist (categorized, editable), tech ladder (CRUD), breathwork, meditation, weekly board
- ✅ CAT Prep habits visible in CAT Overview with toggle
- ✅ Profile modal (view + edit name, bio, target, etc.)
- ✅ Scope toggle: Habits vs CAT Prep views
- ✅ Dark mode / light mode toggle
- ✅ HabitHabitat favicon + branding
- ✅ Deployed on Vercel at habithabitat.vercel.app

---

## 5. Known Issues to Fix (Priority Order)

### P0 — Completed ✅

1. **Email+password signup/login is now working.** Both `signInWithPassword` and `signUp` are fully wired and tested. Magic link remains the primary auth path, but email+password is now fully functional.

2. **Habit data is now synced with Supabase.** Data persists across devices and browser clears. Supabase is the source of truth, with localStorage acting as a write-through cache for offline/speed. Tables (`items`, `completions`, `daily_metrics`, `journal_entries`, `user_settings`) are fully utilized with real-time sync via Supabase Realtime channels.

### P1 — High Priority

3. **Achievements are static.** The 4 badges in `Achievements.tsx` are hardcoded. Wire them to real computed milestones: "7-day streak", "30-day streak", "Perfect week", "100 habits completed", "First CAT topic finished", "All checklist done", etc. Make them unlock dynamically.

4. **CAT Topic Tracker progress is manual.** Topics have a % slider. Add a smarter flow — maybe auto-track based on number of questions done that day, or at minimum add visual polish (per-topic sparklines for the last 7 days).

5. **No push notifications / reminders.** Add a lightweight reminder system — either browser notifications (Notification API) or a simple daily email reminder via Supabase Edge Functions. At minimum, a "Daily Reminder" toggle in Settings that fires a browser notification at a user-set time.

6. **Journal has no search/filter.** The `JournalView` is a textarea per day. Add a search bar to find past entries, and a "Recent entries" sidebar that shows last 7 journal snippets with dates clickable to navigate there.

### P2 — Nice to Have

7. **Insights panel is generic.** `Insights.tsx` shows static motivational text. Replace with real computed insights: "You've completed Sugar limit 5 days in a row 🎉", "Your best habit this week is Reading (100%)", "Sleep dropped on Tuesdays — is there a pattern?", etc.

8. **Goals view is sparse.** Improve the visual design — add per-habit trend lines, completion streaks alongside the goal bar.

9. **No mobile layout.** The app is desktop-first. Make it fully responsive. The sidebar should collapse to a bottom tab bar on mobile.

10. **Weekly Board drag-and-drop.** The CAT Weekly Board (kanban) has no drag-and-drop between columns. Add `@dnd-kit/core` for smooth column-to-column drag.

---

## 6. New Features to Build

### 6a. Supabase Real-time Sync (Biggest Feature)

**Goal**: Data survives device switches, browser clears, and supports multi-tab.

Implementation plan:

- On `setStoreUser(uid)`: fetch habits from `items` WHERE `user_id = uid AND archived = false`; fetch completions from `completions` WHERE `user_id = uid`; load into store
- On `addHabit`: INSERT into `items`; also update localStorage
- On `deleteHabit`: UPDATE `items` SET `archived = true`; remove from localStorage
- On `toggleHabit` / `setHabitValue`: UPSERT into `completions`
- Subscribe to Supabase Realtime on `items` and `completions` channels → sync on change
- Show a "Syncing..." / "Synced ✓" indicator in the sidebar

Keep backwards-compatible with existing localStorage data — on first sync, migrate existing localStorage habits to Supabase.

### 6b. Streak Freeze / Habit Flexibility

- Add a "rest day" concept — users can mark a day as "rest" and it won't break their streak
- Add a "vacation mode" — pause all habits for N days without penalty
- Show streak recovery tips: "You broke a 12-day streak. Log yesterday to recover it."

### 6c. Quick Log Widget

A floating bottom-right button (or a widget on the Dashboard Home) that opens a fast-input modal:

- Shows today's incomplete habits in a compact checklist
- One-tap to check off
- Closes automatically when all done with confetti

### 6d. CAT Mock Test Tracker

Under the CAT dashboard, add a new section "Mock Tests":

- Log each mock test: date, total score, section-wise scores (VARC, DILR, QA), time taken, notes on mistakes
- Show score progression chart (LineChart via Recharts)
- Compare against target percentile
- Stored in Supabase `mock_tests` table (create migration)

### 6e. Weekly Review Prompt (Sunday feature)

Every Sunday, after 8 PM, show a banner/modal: "Time for your weekly review 📋"

- Auto-fills last week's stats: habits completed, streak, best/worst habit
- Text area for weekly reflection notes
- Stored as a special journal entry tagged `weekly_review`

### 6f. Habit Templates

In HabitManager (Settings), add a "Templates" section with pre-built habit packs:

- **CAT Prep Pack**: Daily RC (4 sets), Daily DILR (4 sets), QA topic, Vocab
- **Health Pack**: Water (3L), Sleep by 11PM, Walk 8K steps, No Junk
- **Deep Work Pack**: Code for 1hr, Reading (20 pages), No Phone before 10 AM
  One-click install adds all habits in the pack. User can customize after.

---

## 7. Design Principles — Maintain and Elevate

The current design uses:

- Dark mode first (dark navy background `#0f1117`)
- OKLCH color palette — amber (`var(--amber)`), teal (`var(--teal)`), coral (`var(--coral)`), lavender (`var(--lav)`)
- Space Grotesk for headings, Inter for body, JetBrains Mono for numbers
- Glassmorphism cards (`card-glass`), subtle gradients, smooth Framer Motion transitions
- Micro-animations on state changes (completion toggles, progress bars, confetti)

**Rules:**

- Every new component must use the existing CSS variable tokens. No hardcoded hex colors in new code.
- All new cards must use `card` or `card-glass` class from the existing styles.
- No new external UI libraries without a strong reason. Use what's already installed.
- All animations must use Framer Motion (already installed).
- CAT dashboard sections must import from `../bridge` — never import Supabase or auth hooks directly.
- New sections in the habit dashboard must work in both `scope=habit` and respect `filterHabitsByScope`.

---

## 8. Code Quality Rules

1. **TypeScript strict** — no `any`, no `@ts-ignore`. Use proper interfaces.
2. **Run `npx tsc --noEmit` before every commit** — zero errors required.
3. **Commit message format**: `feat:`, `fix:`, `style:`, `refactor:`, `docs:` prefixes.
4. **Push to `main`** — Vercel auto-deploys. Do not push broken builds.
5. **No console.log in production code** — use proper error handling.
6. **Component files**: one default export per file. Keep files under 300 lines; split if larger.
7. **Every new Supabase table** needs a migration file in `supabase/migrations/` with a timestamp prefix (e.g. `20260724_mock_tests.sql`) and must include RLS policies.
8. **Update `PROJECT_SUMMARY(habit_dashboard).md`** after completing any significant feature or fix. Future agents depend on it being accurate.

---

## 9. Working with the Codebase

### File locations for common tasks

| Task                           | File(s) to edit                                                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Add a new habit dashboard view | `src/routes/_authenticated/dashboard.tsx` (add to `renderView` switch + `TITLES`) + new component in `src/components/dashboard/` |
| Add a new CAT section          | New file in `src/components/cat-dashboard/sections/` + register in `CatDashboardShell.tsx` sidebar/scroll                        |
| Change habit data logic        | `src/lib/habits-store.ts`                                                                                                        |
| Change scope filtering         | `src/lib/scope.ts`                                                                                                               |
| Add Supabase table             | New migration in `supabase/migrations/` + run in Supabase SQL Editor                                                             |
| Add a new useKV key            | Just use it — `useKV<T>('new_key', defaultValue)` — self-initializing                                                            |
| CAT data that needs DB         | Use `supabase` from `../bridge` directly in the section component                                                                |
| Global styles / tokens         | `src/styles.css`                                                                                                                 |
| CAT-specific styles            | `src/components/cat-dashboard/cat-styles.css`                                                                                    |

### Environment

- Local dev: `npm run dev` → `http://localhost:8081`
- Type check: `npx tsc --noEmit`
- Deploy: `git push origin main` → Vercel auto-builds

### Supabase credentials (already in `.env`)

```
VITE_SUPABASE_URL=https://umjrxaczrmcstwajtumh.supabase.co
VITE_SUPABASE_ANON_KEY=<in .env file>
```

---

## 10. Session Checklist

At the end of every coding session, confirm:

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `git status` is clean (all changes committed)
- [ ] `git push origin main` is done
- [ ] `PROJECT_SUMMARY(habit_dashboard).md` updated with anything significant
- [ ] No hardcoded hex colors in new components (use CSS var tokens)
- [ ] No raw `s.habits.filter(...)` — always use `habitsFor(s, date)` for date-aware queries
- [ ] No `new Date(...).toISOString()` for building date strings — use local string formatting
- [ ] All new CAT features use the bridge pattern (import from `../bridge`)
- [ ] New Supabase tables have migration files + RLS policies

---

## 11. Vijit's Context (Read This — It Matters for Design Decisions)

- **CAT 2026**: exam is November 29, 2026. Every feature should reinforce urgency and discipline.
- **Tech ambition**: FlyRank (embeddings/ML project), DSA practice, portfolio building.
- **Health**: building habits around sleep, exercise, sugar limit, water.
- **Philosophy**: The app should feel like a cockpit — serious, clear, zero clutter. Not a game. Not a social app. A tool that respects focus.
- **Usage pattern**: checks dashboard first thing in the morning and logs habits throughout the day. Weekly review on Sundays.
- **Pain points expressed so far**: wants data persistence across devices, wants CAT mock test logging, wants the app to feel more "alive" with real insights.

When designing new features, ask: **"Does this help Vijit stay on track for CAT 2026 and build his skills?"** If yes, build it. If it's just cosmetic noise, skip it.

---

_This prompt was written on 2026-07-24. The project has been continuously developed since 2026-07-22._
_Always check `PROJECT_SUMMARY(habit_dashboard).md` for the most current state._

---

## 12. Final Mission: Complete Phase 2

**Your immediate task in this chat is to build the final three core features of Phase 2.**

Read the implementation details below carefully. Build them one by one, test them, and commit them.

### ✅ Task 1: The Quick Log Widget (Feature 6c)
**Goal:** Allow users to quickly check off their daily habits from *anywhere* in the app (like the CAT Dashboard or Analytics view) without having to navigate back to the main Daily Tracker.
- Create a new component `src/components/dashboard/QuickLogWidget.tsx`.
- Render a floating action button (FAB) fixed to the bottom-right of the screen.
- Clicking the button opens a clean, glassmorphism modal containing a simplified checklist of **only today's incomplete Goal habits** (filter out completed habits).
- Integrate it into the main layout or root shell so it is accessible from all routes.
- Commit this when finished.

### ✅ Task 2: The Weekly Review Prompt (Feature 6e)
**Goal:** Enforce a weekly reflection habit by intercepting the user on Sunday evenings.
- Create a new component `src/components/dashboard/WeeklyReviewBanner.tsx` and place it at the top of the main dashboard views.
- **Logic:** Show the banner ONLY if `new Date().getDay() === 0` (Sunday) and the time is after 18:00 (6 PM).
- **UI:** A prominent, beautifully styled banner: "It's Sunday evening. Time for your Weekly Review."
- **Action:** Clicking it opens a pre-filled Journal entry in the Journal tab. The entry should auto-fill the week's stats (Habit consistency %, Mocks taken, Focus hours logged) and provide prompts: "What went well this week?", "What didn't go well?", "Focus for next week?".
- Commit this when finished.

### ✅ Task 3: Habit Templates (Feature 6f)
**Goal:** Allow users to instantly install pre-made stacks of habits.
- Create a new "Templates" tab or section inside `src/components/dashboard/HabitManager.tsx`.
- Provide hardcoded JSON templates for:
  - **The CAT Prep Pack**: (e.g. "Read 1 AEON Essay", "Solve 3 DILR sets", "Give 1 Sectional Mock").
  - **The Deep Work Pack**: (e.g. "No Phone until Noon", "2 Hours Deep Work", "Plan tomorrow").
- Add an "Install Pack" button next to each that loops through the array and calls `addHabit()` to auto-add these habits to the user's global state.
- Commit this when finished.

**Phase 2 is Complete! (As of 2026-07-28)**
