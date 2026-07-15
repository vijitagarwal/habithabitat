import { useEffect, useSyncExternalStore } from "react";

export type HabitCategory = "Health" | "Mind" | "Productivity" | "Learning" | "Lifestyle";

export interface Habit {
  id: string;
  name: string;
  icon: string; // lucide icon name key
  category: HabitCategory;
  color: string; // css var name
  createdAt: string; // ISO date
}

export interface HabitState {
  habits: Habit[];
  // completions[dateISO][habitId] = true
  completions: Record<string, Record<string, boolean>>;
  level: number;
  xp: number;
}

const KEY = "habit-tracker-v1";

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const seedHabits: Habit[] = [
  { id: "meditation", name: "Morning Meditation", icon: "Sparkles", category: "Mind", color: "brand", createdAt: daysAgoISO(60) },
  { id: "exercise", name: "Exercise", icon: "Dumbbell", category: "Health", color: "success", createdAt: daysAgoISO(60) },
  { id: "read", name: "Read 20 Pages", icon: "BookOpen", category: "Learning", color: "info", createdAt: daysAgoISO(60) },
  { id: "journal", name: "Daily Journal", icon: "NotebookPen", category: "Mind", color: "brand-2", createdAt: daysAgoISO(60) },
  { id: "code", name: "Code for 1 Hour", icon: "Code2", category: "Productivity", color: "warning", createdAt: daysAgoISO(60) },
  { id: "water", name: "Drink 3L Water", icon: "Droplets", category: "Health", color: "info", createdAt: daysAgoISO(60) },
  { id: "nosugar", name: "No Sugar", icon: "Ban", category: "Health", color: "danger", createdAt: daysAgoISO(60) },
  { id: "sleep", name: "Sleep by 11 PM", icon: "Moon", category: "Lifestyle", color: "brand", createdAt: daysAgoISO(60) },
  { id: "learn", name: "Learn Something New", icon: "GraduationCap", category: "Learning", color: "warning", createdAt: daysAgoISO(60) },
  { id: "walk", name: "Walk 10K Steps", icon: "Footprints", category: "Health", color: "success", createdAt: daysAgoISO(60) },
];

function seedCompletions(habits: Habit[]): Record<string, Record<string, boolean>> {
  const out: Record<string, Record<string, boolean>> = {};
  // seed 60 days with realistic completion rates per habit
  const rates: Record<string, number> = {
    meditation: 0.9, exercise: 0.95, read: 0.9, journal: 0.88,
    code: 0.85, water: 0.6, nosugar: 0.55, sleep: 0.8,
    learn: 0.75, walk: 0.55,
  };
  for (let i = 60; i >= 0; i--) {
    const day = daysAgoISO(i);
    out[day] = {};
    for (const h of habits) {
      const rate = rates[h.id] ?? 0.7;
      // stronger pseudo random using multiple prime mixes
      const hcode = h.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const mix = Math.abs(Math.sin((i + 1) * 9301 + hcode * 49297) * 233280) % 1;
      out[day][h.id] = mix < rate;
    }
  }
  // Today: partial – first 7 done to match reference
  const today = todayISO();
  out[today] = {};
  const doneToday = ["meditation", "exercise", "read", "journal", "code", "sleep", "learn"];
  for (const h of habits) out[today][h.id] = doneToday.includes(h.id);
  return out;
}

function load(): HabitState {
  if (typeof window === "undefined") {
    return { habits: seedHabits, completions: {}, level: 18, xp: 2450 };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const habits = seedHabits;
  const completions = seedCompletions(habits);
  const state: HabitState = { habits, completions, level: 18, xp: 2450 };
  localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}

let state: HabitState = { habits: seedHabits, completions: {}, level: 18, xp: 2450 };
let listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const serverState: HabitState = { habits: seedHabits, completions: {}, level: 18, xp: 2450 };
function getSnapshot() { return state; }
function getServerSnapshot(): HabitState { return serverState; }

export function useHabits() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    // Load once on client
    if (state.completions && Object.keys(state.completions).length === 0) {
      state = load();
      listeners.forEach((l) => l());
    }
  }, []);
  return s;
}

export function toggleHabit(dateISO: string, habitId: string) {
  const day = state.completions[dateISO] ?? {};
  const next = { ...day, [habitId]: !day[habitId] };
  state = { ...state, completions: { ...state.completions, [dateISO]: next } };
  // Award XP for completions
  if (next[habitId]) state = { ...state, xp: state.xp + 10 };
  persist();
}

export function setHabitStatus(dateISO: string, habitId: string, status: "done" | "progress" | "none") {
  const day = state.completions[dateISO] ?? {};
  const next = { ...day };
  if (status === "done") next[habitId] = true;
  else delete next[habitId];
  state = { ...state, completions: { ...state.completions, [dateISO]: next } };
  persist();
}

// ---- Analytics helpers ----
export function completionsForDate(s: HabitState, dateISO: string) {
  const day = s.completions[dateISO] ?? {};
  const done = s.habits.filter((h) => day[h.id]).length;
  return { done, total: s.habits.length, pct: s.habits.length ? Math.round((done / s.habits.length) * 100) : 0 };
}

export function currentStreak(s: HabitState): number {
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const day = daysAgoISO(i);
    const { pct } = completionsForDate(s, day);
    if (pct >= 60) streak++;
    else break;
  }
  return streak;
}

export function longestStreak(s: HabitState): { days: number; from: string; to: string } {
  let best = 0, cur = 0, bestEnd = "", curEnd = "";
  const daysBack = 200;
  for (let i = daysBack; i >= 0; i--) {
    const day = daysAgoISO(i);
    const { pct } = completionsForDate(s, day);
    if (pct >= 60) {
      if (cur === 0) curEnd = day;
      cur++;
      if (cur > best) { best = cur; bestEnd = day; }
    } else {
      cur = 0;
    }
  }
  const end = new Date(bestEnd || todayISO());
  const start = new Date(end); start.setDate(end.getDate() - best + 1);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { days: best, from: fmt(start), to: fmt(end) };
}

export function weeklyProgress(s: HabitState) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // Mon=0
  const monday = new Date(now); monday.setDate(now.getDate() - dow);
  return labels.map((label, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const { pct } = completionsForDate(s, iso);
    return { day: label, pct, date: iso };
  });
}

export function categoryBreakdown(s: HabitState) {
  const cats: HabitCategory[] = ["Health", "Mind", "Productivity", "Learning", "Lifestyle"];
  const colors: Record<HabitCategory, string> = {
    Health: "oklch(0.72 0.18 155)",
    Mind: "oklch(0.68 0.22 350)",
    Productivity: "oklch(0.75 0.18 55)",
    Learning: "oklch(0.72 0.18 235)",
    Lifestyle: "oklch(0.65 0.22 320)",
  };
  return cats.map((cat) => {
    const habits = s.habits.filter((h) => h.category === cat);
    if (habits.length === 0) return { cat, pct: 0, color: colors[cat] };
    // avg completion over last 30 days
    let sum = 0, n = 0;
    for (let i = 0; i < 30; i++) {
      const iso = daysAgoISO(i);
      const day = s.completions[iso] ?? {};
      for (const h of habits) { sum += day[h.id] ? 1 : 0; n++; }
    }
    return { cat, pct: n ? Math.round((sum / n) * 100) : 0, color: colors[cat] };
  });
}

export function overallProgress(s: HabitState): number {
  let sum = 0, n = 0;
  for (let i = 0; i < 30; i++) {
    const iso = daysAgoISO(i);
    const day = s.completions[iso] ?? {};
    for (const h of s.habits) { sum += day[h.id] ? 1 : 0; n++; }
  }
  return n ? Math.round((sum / n) * 100) : 0;
}

export function topHabits(s: HabitState) {
  return s.habits.map((h) => {
    let sum = 0;
    for (let i = 0; i < 30; i++) {
      const iso = daysAgoISO(i);
      if (s.completions[iso]?.[h.id]) sum++;
    }
    return { habit: h, pct: Math.round((sum / 30) * 100) };
  }).sort((a, b) => b.pct - a.pct).slice(0, 5);
}

export function monthlyHeatmap(s: HabitState) {
  // 7 rows (Mon..Sun) x daysInMonth cols. Each row shows a habit family / group.
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayD = now.getDate();
  // Split habits across 7 rows (some rows may share)
  const rowHabits: string[][] = Array.from({ length: 7 }, () => []);
  s.habits.forEach((h, i) => rowHabits[i % 7].push(h.id));

  const cells: { day: number; row: number; level: number; hasData: boolean }[] = [];
  for (let r = 0; r < 7; r++) {
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const iso = date.toISOString().slice(0, 10);
      const dayData = s.completions[iso];
      if (!dayData || d > todayD) {
        cells.push({ day: d, row: r, level: -1, hasData: false });
        continue;
      }
      const ids = rowHabits[r];
      const done = ids.filter((id) => dayData[id]).length;
      const pct = ids.length ? (done / ids.length) * 100 : 0;
      let level = 0;
      if (pct === 100) level = 4;
      else if (pct >= 66) level = 3;
      else if (pct >= 34) level = 2;
      else if (pct > 0) level = 1;
      else level = 0;
      cells.push({ day: d, row: r, level, hasData: true });
    }
  }
  return { cells, daysInMonth };
}

export function totalCompleted(s: HabitState): number {
  let n = 0;
  for (const day of Object.values(s.completions)) for (const v of Object.values(day)) if (v) n++;
  return n;
}

export function perfectDays(s: HabitState): number {
  let n = 0;
  for (const iso of Object.keys(s.completions)) {
    const { pct } = completionsForDate(s, iso);
    if (pct === 100) n++;
  }
  return n;
}

export { todayISO };
