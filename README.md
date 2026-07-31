# HabitHabitat

**HabitHabitat** is a rigorous, desktop-first "mission control" application designed for serious goals and relentless consistency. It features a complete dual-dashboard architecture: a highly flexible **Habit Tracker** and a dedicated, hardcore **CAT 2026 Preparation Workspace**. 

This app abandons generic gamification in favor of a clutter-free, analytical approach to self-improvement and exam preparation.

---

## 🌟 Key Features

### 1. Dual-Workspace Architecture
HabitHabitat contains two distinct workspaces, toggleable from the main sidebar:
- **Habit Tracker**: A generalized, highly customizable tracker for life, health, and productivity.
- **CAT Prep Dashboard**: A targeted "mission control" cockpit dedicated specifically to preparing for the CAT 2026 examination, featuring a countdown timer, study checklists, topic trackers, and mock test analytics.

*Both workspaces feature a modern, hover-only expanding sidebar architecture that prevents main content layout shifts, creating a seamless app-like experience.*

### 2. Powerful Habit Engine
- **Flexible Habit Types**: Support for Boolean (Yes/No), Numeric (e.g., Pages Read), and Stopwatch (Duration) habits.
- **Smart Tracking**: Create "Build" (positive) or "Break/Limit" (negative) habits. Break habits automatically compute success based on whether you stayed under your specified limits.
- **Live Stopwatch**: Built-in timers for duration habits with **pause/resume functionality**. Running a timer pulses visually and automatically logs time to your daily progress when saved.
- **Granular Scheduling**: Schedule habits daily, on specific weekdays, or at custom intervals.
- **Quick Logging**: Floating QuickLog widget to rapidly check off today's pending habits without navigating away.

### 3. Comprehensive Analytics & Visualization
- **Daily & Calendar Views**: Jump to any specific date in the past or future to log activity using the intuitive calendar interface.
- **Dynamic Heatmap**: A custom 1:1 heatmap visualizing your consistency across all your active habits simultaneously.
- **Goal Tracking**: Track your monthly completion percentage against your customized goal.
- **Streak Freeze Economy**: Use earned streak freezes to cover missed days and preserve your momentum without penalty.

### 4. Cross-Device Cloud Sync
- Built with **Supabase**, the app syncs your local state seamlessly across devices.
- Uses `useSyncExternalStore` for immediate, zero-latency local updates which are then automatically and safely debounced to the cloud.

---

## 🛠 Tech Stack

- **Framework**: TanStack Start (SSR, Vite-based React)
- **Language**: TypeScript 5.8
- **Styling**: TailwindCSS v4 + OKLCH color palettes
- **UI Primitives**: shadcn/ui & Radix-UI
- **Icons**: Lucide React
- **Backend/Auth/DB**: Supabase (PostgreSQL + Auth)
- **Deployment**: Vercel

---

## 🚀 Getting Started Locally

### Prerequisites
Make sure you have Node.js and `npm` installed.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vijitagarwal/habithabitat.git
   cd habithabitat
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   You will need a `.env` file at the root of the project with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   NITRO_PRESET=vercel
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:8081`.

---

## 📖 Architecture Notes for Developers

- **State Management**: We do not use Redux or Zustand. The core application state is driven by a highly optimized, custom `useSyncExternalStore` singleton located in `src/lib/habits-store.ts`.
- **Database Architecture**: The app heavily utilizes `localStorage` for immediate, optimistic UI rendering. Supabase serves as a persistent cross-device backup and auth provider.
- **Project Scope**: The `bright-habit-view` folder is the active project directory. All development should take place here. 

---

*Designed for discipline. Built for results.*
