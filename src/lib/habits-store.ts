import { useEffect, useSyncExternalStore } from "react";

export type HabitCategory = "Health" | "Mind" | "Productivity" | "Learning" | "Lifestyle";

export const CATEGORIES: HabitCategory[] = ["Health", "Mind", "Productivity", "Learning", "Lifestyle"];
export const ICON_CHOICES = [
  "Sparkles", "Dumbbell", "BookOpen", "NotebookPen", "Code2", "Droplets", "Ban",
  "Moon", "GraduationCap", "Footprints", "Heart", "Apple", "Bike", "Music",
  "Palette", "Sun", "Coffee", "Leaf", "Brain", "Star", "Target", "CheckCircle2",
];
export const COLOR_CHOICES = ["brand", "brand-2", "success", "warning", "danger", "info"];

export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: HabitCategory;
  color: string;
  createdAt: string;
}

export interface DailyMetrics {
  mood?: number;    // 1-5
  sleep?: number;   // hours
  water?: number;   // glasses
  weight?: number;  // kg
}

export interface HabitState {
  habits: Habit[];
  completions: Record<string, Record<string, boolean>>;
  notes: Record<string, string>;
  metrics: Record<string, DailyMetrics>;
  monthlyGoal: number;
  level: number;
  xp: number;
}

const KEY = "habit-tracker-v2";

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
      const hcode = h.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const mix = Math.abs(Math.sin((i + 1) * 9301 + hcode * 49297) * 233280) % 1;
      out[day][h.id] = mix < rate;
    }
  }
  const today = todayISO();
  out[today] = {};
  const doneToday = ["meditation", "exercise", "read", "journal", "code", "sleep", "learn"];
  for (const h of habits) out[today][h.id] = doneToday.includes(h.id);
  return out;
}

function defaultState(): HabitState {
  const habits = seedHabits;
  return {
    habits,
    completions: seedCompletions(habits),
    notes: {},
    metrics: {},
    monthlyGoal: 90,
    level: 18,
    xp: 2450,
  };
}

function emptyState(): HabitState {
  return { habits: [], completions: {}, notes: {}, metrics: {}, monthlyGoal: 80, level: 1, xp: 0 };
}

function load(): HabitState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaultState(),
        ...parsed,
        notes: parsed.notes ?? {},
        metrics: parsed.metrics ?? {},
        monthlyGoal: parsed.monthlyGoal ?? 90,
      };
    }
  } catch {}
  const state = defaultState();
  localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}

let state: HabitState = defaultState();
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
const serverState: HabitState = emptyState();
function getSnapshot() { return state; }
function getServerSnapshot(): HabitState { return serverState; }

export function useHabits() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    if (!hydrated) {
      hydrated = true;
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
  if (next[habitId]) state = { ...state, xp: state.xp + 10 };
  persist();
}

export function addHabit(input: Omit<Habit, "id" | "createdAt">) {
  const id = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
  const h: Habit = { ...input, id, createdAt: todayISO() };
  state = { ...state, habits: [...state.habits, h] };
  persist();
}

export function updateHabit(id: string, patch: Partial<Omit<Habit, "id" | "createdAt">>) {
  state = { ...state, habits: state.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) };
  persist();
}

export function deleteHabit(id: string) {
  const completions: HabitState["completions"] = {};
  for (const [d, day] of Object.entries(state.completions)) {
    const { [id]: _removed, ...rest } = day;
    completions[d] = rest;
  }
  state = { ...state, habits: state.habits.filter((h) => h.id !== id), completions };
  persist();
}

export function setNote(dateISO: string, text: string) {
  const notes = { ...state.notes };
  if (text) notes[dateISO] = text;
  else delete notes[dateISO];
  state = { ...state, notes };
  persist();
}

export function setMetric<K extends keyof DailyMetrics>(dateISO: string, key: K, value: DailyMetrics[K] | undefined) {
  const existing = state.metrics[dateISO] ?? {};
  const next: DailyMetrics = { ...existing };
  if (value === undefined || value === null || Number.isNaN(value)) delete next[key];
  else next[key] = value;
  const metrics = { ...state.metrics, [dateISO]: next };
  if (Object.keys(next).length === 0) delete metrics[dateISO];
  state = { ...state, metrics };
  persist();
}

export function setMonthlyGoal(pct: number) {
  state = { ...state, monthlyGoal: Math.max(0, Math.min(100, Math.round(pct))) };
  persist();
}

export function resetAll(mode: "seed" | "empty" = "empty") {
  state = mode === "seed" ? defaultState() : emptyState();
  persist();
}

export function clearHistory() {
  state = { ...state, completions: {}, notes: {}, metrics: {}, xp: 0 };
  persist();
}

export function completionsForDate(s: HabitState, dateISO: string) {
  const day = s.completions[dateISO] ?? {};
  const done = s.habits.filter((h) => day[h.id]).length;
  return { done, total: s.habits.length, pct: s.habits.length ? Math.round((done / s.habits.length) * 100) : 0 };
}

export function currentStreak(s: HabitState): number {
  if (s.habits.length === 0) return 0;
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
  let best = 0, cur = 0, bestEnd = "";
  const daysBack = 200;
  for (let i = daysBack; i >= 0; i--) {
    const day = daysAgoISO(i);
    const { pct } = completionsForDate(s, day);
    if (pct >= 60) {
      cur++;
      if (cur > best) { best = cur; bestEnd = day; }
    } else cur = 0;
  }
  const end = new Date(bestEnd || todayISO());
  const start = new Date(end); start.setDate(end.getDate() - best + 1);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { days: best, from: best ? fmt(start) : "—", to: best ? fmt(end) : "—" };
}

export function weeklyProgress(s: HabitState) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  const monday = new Date(now); monday.setDate(now.getDate() - dow);
  return labels.map((label, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const { pct } = completionsForDate(s, iso);
    return { day: label, pct, date: iso };
  });
}

export function categoryBreakdown(s: HabitState) {
  const colors: Record<HabitCategory, string> = {
    Health: "oklch(0.72 0.18 155)",
    Mind: "oklch(0.68 0.22 350)",
    Productivity: "oklch(0.75 0.18 55)",
    Learning: "oklch(0.72 0.18 235)",
    Lifestyle: "oklch(0.65 0.22 320)",
  };
  return CATEGORIES.map((cat) => {
    const habits = s.habits.filter((h) => h.category === cat);
    if (habits.length === 0) return { cat, pct: 0, color: colors[cat] };
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
  if (s.habits.length === 0) return 0;
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

export function monthlyHeatmap(s: HabitState, year?: number, month?: number) {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth();
  const todayD = now.getDate();
  const rowHabits: string[][] = Array.from({ length: 7 }, () => []);
  s.habits.forEach((h, i) => rowHabits[i % 7].push(h.id));

  const cells: { day: number; row: number; level: number; hasData: boolean }[] = [];
  for (let r = 0; r < 7; r++) {
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d);
      const iso = date.toISOString().slice(0, 10);
      const dayData = s.completions[iso];
      const isFuture = isCurrentMonth && d > todayD;
      if (!dayData || isFuture) { cells.push({ day: d, row: r, level: -1, hasData: false }); continue; }
      const ids = rowHabits[r];
      const done = ids.filter((id) => dayData[id]).length;
      const pct = ids.length ? (done / ids.length) * 100 : 0;
      let level = 0;
      if (pct === 100) level = 4;
      else if (pct >= 66) level = 3;
      else if (pct >= 34) level = 2;
      else if (pct > 0) level = 1;
      cells.push({ day: d, row: r, level, hasData: true });
    }
  }
  return { cells, daysInMonth, year: y, month: m };
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

export { todayISO, daysAgoISO };
