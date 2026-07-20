
# Plan: Unified Habit + CAT Prep Dashboard

One Lovable app, one URL, one Supabase database (Lovable Cloud for now, exportable to your own Supabase later). A top-nav toggle switches between the **Habit** view (all items) and the **CAT** view (items tagged `cat`). Marking done in either view updates the same row — so sync is automatic, not a background job.

## 1. Data model (single source of truth)

One unified `items` table with a `category` tag drives both dashboards. Completions live in a separate table so streaks/heatmap logic still works.

```text
items                          completions
─────                          ───────────
id            uuid pk          id           uuid pk
user_id       uuid → auth      user_id      uuid → auth
name          text             item_id      uuid → items
category      text             date         date
              ('general'|      value        numeric  -- for benchmarked items
               'cat'|          done         bool
               ...custom)      note         text
kind          text             UNIQUE(user_id, item_id, date)
              ('habit'|
               'task'|         daily_metrics, journal_entries: unchanged
               'study')
direction     text ('build'|'break')
unit          text             -- 'g','L','pages','mins',...
benchmarks    numeric[]        -- e.g. [1,2,3]
schedule      jsonb            -- reuses current schedule shape
priority      int              -- higher = pinned in CAT view
icon, color   text
one_off_date  date null        -- for study session on a specific day
created_at, updated_at
```

Category is a free-form tag, not just a boolean, so you can add `mock-test`, `revision`, `mocks`, etc. later. The Habit dashboard shows everything; the CAT dashboard filters `category = 'cat'`.

RLS: every row scoped to `auth.uid() = user_id`. GRANTs to `authenticated` + `service_role`.

## 2. Auth

Email + password (matches CAT), plus Google as the secondary option (Lovable default). Public routes: `/` (landing → sign-in) and `/auth`. Everything else lives under `_authenticated/`. When you eventually migrate CAT users in, Supabase's admin API imports users with their existing password hashes so nobody has to reset.

## 3. Routes

```text
src/routes/
  index.tsx                          → redirect to /auth or /habit
  auth.tsx                           → sign in / sign up
  _authenticated/route.tsx           → gate (integration-managed)
  _authenticated/habit.tsx           → current dashboard, unchanged UX
  _authenticated/habit.$view.tsx     → daily, calendar, analytics, ... (existing sub-views)
  _authenticated/cat.tsx             → CAT dashboard (filtered items + study-specific widgets)
  _authenticated/cat.$view.tsx       → CAT sub-views (topics, mocks, schedule)
```

Top nav gets a **Habit ⇄ CAT** segmented toggle (persists via URL, not just state), plus the existing sidebar underneath.

## 4. Migrate the current localStorage store to Supabase

The current `habits-store.ts` uses `useSyncExternalStore` on localStorage. Replace it with a TanStack Query–backed store that reads/writes Supabase:

- `useItems()` — `useSuspenseQuery` over `items`
- `useCompletions(dateRange)` — same for `completions`
- Mutations (`toggle`, `setValue`, `addHabit`, `updateHabit`, `deleteHabit`, `clearHistory`) hit server functions with `requireSupabaseAuth`, then invalidate queries
- Optional one-time "Import from localStorage" button on first sign-in so you don't lose current demo data

All existing components (`HabitRow`, `TodaysHabits`, `DailyTracker`, `Heatmap`, `WeeklyProgress`, etc.) keep the same shape — only the store hook signatures change. Visual UI is untouched.

## 5. CAT dashboard (v1)

Reuses the same primitives:
- **Today's CAT tasks** — `HabitRow` filtered to `category='cat'`, sorted by `priority desc`
- **Weekly study progress** — same `WeeklyProgress` bar chart but scoped
- **Topic heatmap** — same `Heatmap`, scoped
- **Study streak + Mocks left** stat cards
- **Add CAT task** button opens `HabitManager` with `category='cat'` preselected

Once you paste the CAT app's schema, we add a **one-time SQL migration** that imports its rows into `items` (mapping its columns to ours) and, if the CAT app on Vercel must keep working during the transition, a **Postgres view** in the CAT Supabase named like the old table so its queries keep resolving. Long-term you retire the Vercel app and only the Lovable app remains.

## 6. Keeping the Vercel CAT app in sync (transition period)

If you want the current Vercel deployment to stay live while we build the merged app:

- Option A (simplest): both apps point at the *same* Supabase instance. Since we're using Lovable Cloud here, the CAT app on Vercel gets its `SUPABASE_URL`/`ANON_KEY` swapped to Lovable Cloud's, then reads the same `items` table via the compatibility view.
- Option B: leave Vercel alone until we're ready to cut over, then export Lovable Cloud → self-host Supabase and point both at that.

Recommend A — one DB, zero drift, and the "sync" question disappears entirely.

## 7. Export path (for later)

When you want off Lovable:
1. Cloud → Advanced → Export data (SQL dump)
2. `supabase db push` into your own Supabase project (new or CAT's existing one)
3. Clone the GitHub repo, set `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` for the new project, deploy to Vercel
4. Update DNS. Done.

No proprietary bits — TanStack Start + Supabase + Tailwind is all portable.

## Build order

1. **Auth** — enable email + Google, add `/auth` and `_authenticated/` gate
2. **Schema migration** — `items` + `completions` tables, RLS, GRANTs, triggers
3. **Store swap** — replace `habits-store.ts` internals with Supabase-backed hooks; import-from-localStorage helper
4. **Category field + Habit Manager** — add `category` selector (with `cat` chip) and `priority` to add/edit form
5. **Top toggle + `/cat` route** — filtered view reusing existing components
6. **CAT-specific widgets** — study streak card, mocks-left card, priority sorting
7. **CAT data import** — once you paste the CAT schema, one-shot SQL migration + optional compatibility view

Stops after step 5 give you a working synced app; steps 6–7 are polish + the actual data merge.

## Questions to answer before step 7 only

- CAT schema (paste `CREATE TABLE` statements when ready)
- Do you want the Vercel CAT app to keep running during migration, or cut over immediately?

Everything up to step 6 doesn't need those answers — I can start now.
