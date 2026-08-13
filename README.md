# HabitHabitat 🏠

> A rigorous, desktop-first "mission control" application designed for serious goals and relentless consistency — not just another habit tracker.

[![Live App](https://img.shields.io/badge/Live%20App-habithabitat.vercel.app-brightgreen?style=flat-square)](https://habithabitat.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![Status](https://img.shields.io/badge/Status-Personal%20Use%20%2F%20Frozen-orange?style=flat-square)]()

---

> 🔒 **Status: Personal Tool — FROZEN (2026-08-13)**
>
> This repository is a **personal CAT 2026 exam preparation dashboard** in active use by its owner. The codebase is now locked to prevent disruption to ongoing exam prep. No new features will be added here. See [Companion Project](#-companion-project-examhabitat) for the multi-exam platform being built separately.

---

## What is HabitHabitat?

HabitHabitat combines two powerful productivity tools in a single unified app:

1. **Habit Tracker** — A flexible, analytically focused tracker for health, productivity, and life goals. Goes far beyond simple checkboxes: supports build/break habits, numeric benchmarks, duration stopwatches, granular scheduling, and a full gamification system (XP, levels, streak freezes).

2. **CAT 2026 Prep Dashboard** — A dedicated "mission control" cockpit for the CAT exam. Features a campaign countdown timer, topic-by-topic study progress, kanban weekly board, mock test analytics, error logging, guided breathwork, and meditation timers — all purpose-built for an intense exam campaign.

Both workspaces share the same auth system and run within a single seamless app shell.

---

## ✨ Key Features

### Habit Tracker
- **Three habit types**: Boolean (yes/no), Numeric (benchmarked with multiple levels), and Stopwatch/Duration (with live pause/resume timer)
- **Build & Break habits**: "Build" habits reward accumulation; "Break/Limit" habits auto-compute success based on staying under defined thresholds
- **Smart scheduling**: Daily, weekdays only, specific weekly day, monthly, or one-off
- **createdAt guard**: Habits never retroactively appear on dates before they were created
- **Full CRUD via Habit Manager**: Add, edit, delete habits; one-click predefined habit template packs (CAT Prep, Deep Work)
- **Quick Log Widget**: Floating overlay to log remaining habits without navigating away
- **XP & Levels**: +10 XP per habit completion; level up over time
- **Streak Freeze Economy**: Earn and spend freeze tokens to protect streaks from missed days
- **Weekly Review Banner**: Sunday evening prompt to conduct a weekly reflection
- **Push Notifications**: Browser-native daily reminders (configurable time)
- **Analytics**: Stats cards, weekly bar chart, category breakdown, per-habit progress, insights panel
- **Dynamic Heatmap**: 1:1 per-habit heatmap grid (not grouped arbitrarily by 7 days)
- **Dynamic Achievements**: Auto-unlocking badges based on streaks, completions, and milestones
- **Journal**: Daily notes with search and recent entries sidebar
- **Health Metrics**: Mood, sleep, water, and weight trackers with line charts
- **Goal Tracking**: Monthly completion percentage vs. custom target with per-habit bar charts
- **Analogue + Digital Clocks**: Live clocks in the dashboard home and headers

### CAT 2026 Dashboard
- **Campaign Countdown**: Live days-to-exam counter with progress through defined campaign phases
- **Topic Tracker**: Per-topic study progress with Supabase persistence and auto-seeding of default topics
- **Mock Test Tracker**: Log, track, and analyze mock exam scores (Supabase `mock_tests` table)
- **Weekly Kanban Board**: Task cards organized by status (persisted via `useKV`)
- **Error Log**: Mistake logger for reviewing and learning from errors (Supabase `error_log`)
- **Checklist**: Fully editable categorized checklist (Pre-Launch, Study, Health, Admin, Tech, Other + custom categories)
- **Tech Ladder**: Chronological log of technology commitments, fully editable with CRUD
- **Focus Timer**: Stopwatch/timer with Web Worker-based pause/resume that survives browser tab backgrounding
- **Breathwork**: Guided breathing exercises with multiple pattern options and session streak
- **Meditation**: Guided meditation timer with session logging and total minutes tracked
- **Right Now Engine**: "What to do next" recommendation based on scheduled habits and topics
- **Campaign Map**: Visual representation of syllabus progression and milestones
- **Contingency Tracker**: Backup plan and alternative exam tracker
- **Data Export**: Export all CAT and habit data
- **Standing Orders**: Static principles display
- **Health Integration**: Health habits widget integrated with study performance

### Core Infrastructure
- **Cross-device cloud sync** via Supabase `kv_store` with real-time sync channel
- **Zero-latency optimistic UI**: Local state updates instantly; cloud sync is debounced in background
- **Real-time multiplayer**: Changes on one device reflect on another via Supabase `postgres_changes`
- **User profiles**: Avatar, bio, target college/percentile, city, phone (Supabase `profiles` table)
- **Hover-only expanding sidebar** on both dashboards — no layout shifts when sidebar opens/closes
- **Profile Modal**: Fixed `createPortal` overlay for viewing/editing profile and sign-out
- **Scope system**: `?scope=habit` or `?scope=cat` URL parameter controls which dashboard is active

---

## 🛠 Tech Stack

| Concern | Choice |
|---|---|
| Framework | TanStack Start (SSR + Vite-based React meta-framework) |
| Language | TypeScript 5.8 |
| Router | `@tanstack/react-router` (file-based, type-safe, zod-validated search params) |
| Server | Nitro (preset: `vercel`) |
| Backend / Auth | Supabase (`@supabase/supabase-js` v2) — PostgreSQL + Auth |
| Styling | TailwindCSS v4 (`@tailwindcss/vite`) + OKLCH CSS custom properties |
| UI Components | shadcn/ui (Radix-UI primitives) |
| Charts | Recharts |
| Animations | Framer Motion |
| Drag & Drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Icons | Lucide React |
| State | Custom `useSyncExternalStore` singleton (no Redux, no Zustand) |
| Deployment | Vercel (Hobby plan) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project (for auth and cloud sync)

### 1. Clone the repository

```bash
git clone https://github.com/vijitagarwal/habithabitat.git
cd habithabitat
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file at the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
NITRO_PRESET=vercel
```

> **Never commit `.env` to git.** It is listed in `.gitignore`.

### 4. Apply database migrations

In your Supabase SQL Editor, run all `.sql` files from `supabase/migrations/` in chronological order. The key migrations are:
- `20260722_unified_habit_tables.sql` — Core tables (items, completions, daily_metrics, journal_entries, user_settings, kv_store)
- `20260723_profiles_extended.sql` — User profiles table
- `20260727_mock_tests.sql` — Mock test results table

### 5. Start the development server

```bash
npm run dev
```

The app runs at `http://localhost:8081`.

---

## 🏗 Architecture Overview

### State Management

No Redux, no Zustand. The core habit state is a custom `useSyncExternalStore` singleton in `src/lib/habits-store.ts`. It:
- Updates `localStorage` instantly (zero-latency UI)
- Debounce-upserts the full state to Supabase `kv_store` in the background
- Subscribes to Supabase real-time changes to sync across devices
- Uses per-user localStorage keys (`habit-tracker-v2::<uuid>`) when signed in

### Routing

```
/                     → redirect to /dashboard or /auth (checks session)
/auth                 → Magic link sign-in page
/_authenticated       → Auth guard layout
  /dashboard          → Main app (?scope=habit | ?scope=cat)
```

### Dual Dashboard Architecture

The `?scope` URL param routes to either the **Habit Dashboard** or the **CAT Dashboard Shell**. Both are separate React trees with their own sidebars, but share:
- The same Supabase auth and user profile
- The same habits store (CAT Prep habits are a category within the shared habit store)
- The `ScopeCtx` React context for filtered data views

### Data Flow

```
User action
  → store action (habits-store.ts)
    → localStorage update (instant)
    → React re-render via useSyncExternalStore
    → debounced Supabase upsert (background, ~2s)
    → Supabase real-time broadcast → syncs other devices
```

---

## 📁 Project Structure

```
bright-habit-view/
├── src/
│   ├── routes/
│   │   ├── __root.tsx             # QueryClientProvider, head/meta, branding
│   │   ├── index.tsx              # Redirect root
│   │   ├── auth.tsx               # Magic link sign-in (aurora background)
│   │   └── _authenticated/
│   │       ├── route.tsx          # Auth guard
│   │       └── dashboard.tsx      # Main app shell (scope toggle, sidebar, header)
│   ├── lib/
│   │   ├── habits-store.ts        # Core state singleton (1400+ lines)
│   │   ├── scope.ts               # ScopeCtx + filterHabitsByScope()
│   │   ├── scope-aware-stats.ts   # Scope-filtered statistics helpers
│   │   └── utils.ts               # cn() helper
│   ├── components/
│   │   ├── dashboard/             # 26 habit dashboard components
│   │   ├── cat-dashboard/         # CAT dashboard (shell + 19 sections + bridge)
│   │   └── ui/                    # 46 shadcn/ui primitives
│   └── integrations/supabase/     # Supabase client singleton + generated DB types
├── supabase/migrations/           # SQL migration files (chronological)
├── public/                        # Static assets, PWA icons, favicon.ico
└── vite.config.ts                 # Build config via @lovable.dev/vite-tanstack-config
```

---

## 🗄 Database Tables

| Table | Purpose |
|---|---|
| `kv_store` | Full serialized habit state (key = `"habit_state_v2"`) — powers cross-device sync |
| `profiles` | User profile info (display_name, bio, target_college, target_percentile, etc.) |
| `topic_tracker` | CAT study topics with per-topic progress (auto-seeded for new users) |
| `error_log` | CAT mistake log entries |
| `mock_tests` | CAT mock test scores and session analytics |
| `items` | Habit definitions (present, future direct DB sync) |
| `completions` | Habit completions log (present, future direct DB sync) |
| `daily_metrics` | Mood/sleep/water/weight daily logs (present, future direct DB sync) |
| `journal_entries` | Journal notes (present, future direct DB sync) |
| `user_settings` | Monthly goal, XP per user (present, future direct DB sync) |

---

## 🔐 Authentication

- **Magic Link (Email OTP)** — fully working. User enters email → receives one-click sign-in link.
- **Email + Password signup** — disabled (future work)
- Session is managed automatically by the Supabase SDK (JWT in `localStorage`)

---

## 🌎 Deployment

The app is deployed on **Vercel** at [habithabitat.vercel.app](https://habithabitat.vercel.app).

**Critical**: Set `NITRO_PRESET=vercel` in Vercel's environment variables. Without it, Nitro defaults to a Cloudflare Workers output format which will not work on Vercel.

Supabase Auth URL configuration:
- Site URL: `https://habithabitat.vercel.app`
- Redirect URLs: `https://habithabitat.vercel.app/**`

---

## 📘 Companion Project: ExamHabitat

A **new multi-exam competitive preparation platform** is planned to be built from scratch using this project as a reference. It will support NEET, JEE Main/Advanced, UPSC CSE, CAT, GATE, CLAT and more, with:

- **Exam Registry**: Per-exam syllabus, sections, scoring rules, and phase timelines
- **Onboarding flow**: Exam selection on first login
- **Dynamic Dashboard**: All sections (Topic Tracker, Mock Tracker, Error Log, Exam Core) adapt to the chosen exam
- **Multi-exam data isolation**: `exam_id` scoping in Supabase schema from Day 1
- **Fresh Supabase project**: New DB designed for multi-exam from the start

This project (`HabitHabitat`) will serve as the reference codebase for the habit tracker engine, auth system, bridge pattern, and UI components.

---

## 📅 Changelog (recent)

| Date | Change |
|---|---|
| 2026-08-13 | Project frozen for personal CAT 2026 prep. README updated. ExamHabitat companion project planned. |
| 2026-08-13 | CAT registration deadline confirmed: **Sep 15, 2026** (urgent: Sep 8). |
| 2026-08-02 | Topic time tracking migration added (`topic_time_spent`). |
| 2026-07-31 | Hover-only sidebar float expand (both dashboards); ProfileModal createPortal fix. |
| 2026-07-28 | QuickLogWidget; WeeklyReviewBanner; Habit Templates added. |
| 2026-07-25 | HabitStatus engine; Break/Limit habits; Stopwatch/Duration habits; cross-device sync. |

---

*Designed for discipline. Built for results.*
