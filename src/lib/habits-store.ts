import { useEffect, useSyncExternalStore } from "react";

export type HabitCategory = "Health" | "Mind" | "Productivity" | "Learning" | "Lifestyle" | "CAT Prep";

export const CATEGORIES: HabitCategory[] = ["Health", "Mind", "Productivity", "Learning", "Lifestyle", "CAT Prep"];
export const ICON_CHOICES = [
  "Sparkles", "Dumbbell", "BookOpen", "NotebookPen", "Code2", "Droplets", "Ban",
  "Moon", "GraduationCap", "Footprints", "Heart", "Apple", "Bike", "Music",
  "Palette", "Sun", "Coffee", "Leaf", "Brain", "Star", "Target", "CheckCircle2",
  "Calculator", "PenTool", "Timer", "Trophy", "Flame",
];
export const COLOR_CHOICES = ["brand", "brand-2", "success", "warning", "danger", "info"];

export type HabitDirection = "build" | "break";
export type ScheduleType = "daily" | "weekdays" | "weekly" | "monthly" | "oneoff";

export interface Schedule {
  type: ScheduleType;
  /** For "weekdays": array of 0=Sun..6=Sat. For "weekly": use first entry. */
  weekdays?: number[];
  /** For "monthly": 1..28, or "last". */
  monthDay?: number | "last";
  /** For "oneoff": ISO date. */
  date?: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: HabitCategory;
  color: string;
  createdAt: string;
  /** "build" = accumulate toward top benchmark (e.g. water). "break" = stay under (e.g. sugar). */
  direction?: HabitDirection;
  /** e.g. "L", "g", "hrs", "pages". */
  unit?: string;
  /** Sorted ascending. Empty/undefined = simple boolean habit. */
  benchmarks?: number[];
  schedule?: Schedule;
}

export interface DailyMetrics {
  mood?: number;
  sleep?: number;
  water?: number;
  weight?: number;
}

export interface HabitState {
  habits: Habit[];
  completions: Record<string, Record<string, boolean>>;
  /** Numeric values for benchmarked habits. */
  values: Record<string, Record<string, number>>;
  notes: Record<string, string>;
  metrics: Record<string, DailyMetrics>;
  monthlyGoal: number;
  level: number;
  xp: number;
}

const BASE_KEY = "habit-tracker-v2";
let userKey: string | null = null;
function KEY() { return userKey ? `${BASE_KEY}::${userKey}` : BASE_KEY; }

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const dailySchedule: Schedule = { type: "daily" };

const seedHabits: Habit[] = [
  { id: "meditation", name: "Morning Meditation", icon: "Sparkles", category: "Mind", color: "brand", createdAt: daysAgoISO(60), schedule: dailySchedule },
  { id: "exercise", name: "Exercise", icon: "Dumbbell", category: "Health", color: "success", createdAt: daysAgoISO(60), schedule: dailySchedule },
  { id: "read", name: "Read 20 Pages", icon: "BookOpen", category: "Learning", color: "info", createdAt: daysAgoISO(60), schedule: dailySchedule },
  { id: "journal", name: "Daily Journal", icon: "NotebookPen", category: "Mind", color: "brand-2", createdAt: daysAgoISO(60), schedule: dailySchedule },
  { id: "code", name: "Code for 1 Hour", icon: "Code2", category: "Productivity", color: "warning", createdAt: daysAgoISO(60), schedule: dailySchedule },
  { id: "water", name: "Drink Water", icon: "Droplets", category: "Health", color: "info", createdAt: daysAgoISO(60), schedule: dailySchedule, direction: "build", unit: "L", benchmarks: [1, 2, 3] },
  { id: "nosugar", name: "Limit Sugar", icon: "Ban", category: "Health", color: "danger", createdAt: daysAgoISO(60), schedule: dailySchedule, direction: "break", unit: "g", benchmarks: [5, 10, 20] },
  { id: "sleep", name: "Sleep by 11 PM", icon: "Moon", category: "Lifestyle", color: "brand", createdAt: daysAgoISO(60), schedule: dailySchedule },
  { id: "learn", name: "Learn Something New", icon: "GraduationCap", category: "Learning", color: "warning", createdAt: daysAgoISO(60), schedule: dailySchedule },
  { id: "walk", name: "Walk 10K Steps", icon: "Footprints", category: "Health", color: "success", createdAt: daysAgoISO(60), schedule: dailySchedule },
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
      if (h.benchmarks && h.benchmarks.length) continue; // values-tracked
      const rate = rates[h.id] ?? 0.7;
      const hcode = h.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const mix = Math.abs(Math.sin((i + 1) * 9301 + hcode * 49297) * 233280) % 1;
      out[day][h.id] = mix < rate;
    }
  }
  const today = todayISO();
  out[today] = out[today] ?? {};
  const doneToday = ["meditation", "exercise", "read", "journal", "code", "sleep", "learn"];
  for (const h of habits) {
    if (h.benchmarks && h.benchmarks.length) continue;
    out[today][h.id] = doneToday.includes(h.id);
  }
  return out;
}

function seedValues(habits: Habit[]): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (let i = 60; i >= 0; i--) {
    const day = daysAgoISO(i);
    for (const h of habits) {
      if (!h.benchmarks || !h.benchmarks.length) continue;
      const target = Math.max(...h.benchmarks);
      const hcode = h.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const mix = Math.abs(Math.sin((i + 1) * 7919 + hcode * 31337) * 100000) % 1;
      const v = h.direction === "break"
        ? Math.round(mix * target * 0.6 * 10) / 10
        : Math.round(mix * target * 10) / 10;
      out[day] = out[day] ?? {};
      out[day][h.id] = v;
    }
  }
  return out;
}

function defaultState(): HabitState {
  const habits = seedHabits;
  return {
    habits,
    completions: seedCompletions(habits),
    values: seedValues(habits),
    notes: {},
    metrics: {},
    monthlyGoal: 90,
    level: 18,
    xp: 2450,
  };
}

function emptyState(): HabitState {
  return { habits: [], completions: {}, values: {}, notes: {}, metrics: {}, monthlyGoal: 80, level: 1, xp: 0 };
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
        values: parsed.values ?? {},
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

// ---------- Scheduling ----------

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function isScheduledOn(h: Habit, iso: string): boolean {
  const sch = h.schedule ?? { type: "daily" };
  const d = new Date(iso + "T00:00:00");
  const dow = d.getDay();
  switch (sch.type) {
    case "daily": return true;
    case "weekdays": return (sch.weekdays ?? []).includes(dow);
    case "weekly": return (sch.weekdays?.[0] ?? 0) === dow;
    case "monthly": {
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      if (sch.monthDay === "last") return d.getDate() === last;
      return d.getDate() === (typeof sch.monthDay === "number" ? sch.monthDay : 1);
    }
    case "oneoff": return sch.date === iso;
    default: return true;
  }
}

export function scheduleLabel(h: Habit): string {
  const sch = h.schedule ?? { type: "daily" };
  switch (sch.type) {
    case "daily": return "Daily";
    case "weekdays": return (sch.weekdays ?? []).map((d) => WEEKDAY_LABELS[d]).join(", ") || "Weekdays";
    case "weekly": return `Every ${WEEKDAY_LABELS[sch.weekdays?.[0] ?? 0]}`;
    case "monthly": return sch.monthDay === "last" ? "Last of month" : `Day ${sch.monthDay ?? 1}`;
    case "oneoff": return sch.date ? `On ${sch.date}` : "One-off";
  }
}

export function habitsFor(s: HabitState, iso: string): Habit[] {
  return s.habits.filter((h) => isScheduledOn(h, iso));
}

// ---------- Values & completion ----------

export function habitTarget(h: Habit): number {
  return h.benchmarks && h.benchmarks.length ? Math.max(...h.benchmarks) : 0;
}

export function habitPct(s: HabitState, h: Habit, iso: string): number {
  if (h.benchmarks && h.benchmarks.length) {
    const t = habitTarget(h);
    const v = s.values?.[iso]?.[h.id] ?? 0;
    if (t <= 0) return 0;
    if (h.direction === "break") return Math.max(0, Math.min(100, 100 - (v / t) * 100));
    return Math.max(0, Math.min(100, (v / t) * 100));
  }
  return s.completions[iso]?.[h.id] ? 100 : 0;
}

export function habitValue(s: HabitState, h: Habit, iso: string): number {
  return s.values?.[iso]?.[h.id] ?? 0;
}

export function setHabitValue(iso: string, habitId: string, value: number) {
  const day = { ...(state.values[iso] ?? {}) };
  if (Number.isFinite(value) && value > 0) day[habitId] = Math.round(value * 100) / 100;
  else delete day[habitId];
  const values = { ...state.values, [iso]: day };
  if (Object.keys(day).length === 0) delete values[iso];
  state = { ...state, values };
  persist();
}

export function toggleHabit(dateISO: string, habitId: string) {
  const h = state.habits.find((x) => x.id === habitId);
  if (h && h.benchmarks && h.benchmarks.length) return; // benchmarked; use setHabitValue
  const day = state.completions[dateISO] ?? {};
  const next = { ...day, [habitId]: !day[habitId] };
  state = { ...state, completions: { ...state.completions, [dateISO]: next } };
  if (next[habitId]) state = { ...state, xp: state.xp + 10 };
  persist();
}

// ---------- CRUD ----------

export function addHabit(input: Omit<Habit, "id" | "createdAt">) {
  const id = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
  const h: Habit = { schedule: { type: "daily" }, ...input, id, createdAt: todayISO() };
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
  const values: HabitState["values"] = {};
  for (const [d, day] of Object.entries(state.values)) {
    const { [id]: _removed, ...rest } = day;
    values[d] = rest;
  }
  state = { ...state, habits: state.habits.filter((h) => h.id !== id), completions, values };
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
  state = { ...state, completions: {}, values: {}, notes: {}, metrics: {}, xp: 0 };
  persist();
}

// ---------- Aggregate stats (all scheduling-aware) ----------

export function completionsForDate(s: HabitState, dateISO: string) {
  const scheduled = habitsFor(s, dateISO);
  if (scheduled.length === 0) return { done: 0, total: 0, pct: 0 };
  let sum = 0, done = 0;
  for (const h of scheduled) {
    const p = habitPct(s, h, dateISO);
    sum += p;
    if (p >= 100) done++;
  }
  return { done, total: scheduled.length, pct: Math.round(sum / scheduled.length) };
}

export function currentStreak(s: HabitState): number {
  if (s.habits.length === 0) return 0;
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const day = daysAgoISO(i);
    const scheduled = habitsFor(s, day);
    if (scheduled.length === 0) continue; // skip off-days
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
    const scheduled = habitsFor(s, day);
    if (scheduled.length === 0) continue;
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
    "CAT Prep": "oklch(0.7 0.22 25)",
  };
  return CATEGORIES.map((cat) => {
    const catHabits = s.habits.filter((h) => h.category === cat);
    if (catHabits.length === 0) return { cat, pct: 0, color: colors[cat] };
    let sum = 0, n = 0;
    for (let i = 0; i < 30; i++) {
      const iso = daysAgoISO(i);
      for (const h of catHabits) {
        if (!isScheduledOn(h, iso)) continue;
        sum += habitPct(s, h, iso);
        n++;
      }
    }
    return { cat, pct: n ? Math.round(sum / n) : 0, color: colors[cat] };
  });
}

export function overallProgress(s: HabitState): number {
  if (s.habits.length === 0) return 0;
  let sum = 0, n = 0;
  for (let i = 0; i < 30; i++) {
    const iso = daysAgoISO(i);
    for (const h of s.habits) {
      if (!isScheduledOn(h, iso)) continue;
      sum += habitPct(s, h, iso);
      n++;
    }
  }
  return n ? Math.round(sum / n) : 0;
}

export function topHabits(s: HabitState) {
  return s.habits.map((h) => {
    let sum = 0, n = 0;
    for (let i = 0; i < 30; i++) {
      const iso = daysAgoISO(i);
      if (!isScheduledOn(h, iso)) continue;
      sum += habitPct(s, h, iso);
      n++;
    }
    return { habit: h, pct: n ? Math.round(sum / n) : 0 };
  }).sort((a, b) => b.pct - a.pct).slice(0, 5);
}

export function monthlyHeatmap(s: HabitState, year?: number, month?: number) {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth();
  const todayD = now.getDate();
  const rowHabits: Habit[][] = Array.from({ length: 7 }, () => []);
  s.habits.forEach((h, i) => rowHabits[i % 7].push(h));

  const cells: { day: number; row: number; level: number; hasData: boolean }[] = [];
  for (let r = 0; r < 7; r++) {
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d);
      const iso = date.toISOString().slice(0, 10);
      const isFuture = isCurrentMonth && d > todayD;
      const rowHs = rowHabits[r].filter((h) => isScheduledOn(h, iso));
      if (isFuture || rowHs.length === 0) { cells.push({ day: d, row: r, level: -1, hasData: false }); continue; }
      let sum = 0;
      for (const h of rowHs) sum += habitPct(s, h, iso);
      const pct = sum / rowHs.length;
      let level = 0;
      if (pct >= 100) level = 4;
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
  // count benchmarked days that hit 100%
  for (const [iso, day] of Object.entries(s.values ?? {})) {
    for (const h of s.habits) {
      if (!h.benchmarks || !h.benchmarks.length) continue;
      if (!(h.id in day)) continue;
      const p = habitPct(s, h, iso);
      if (p >= 100) n++;
    }
  }
  return n;
}

export function perfectDays(s: HabitState): number {
  let n = 0;
  const dates = new Set<string>([...Object.keys(s.completions), ...Object.keys(s.values ?? {})]);
  for (const iso of dates) {
    const { pct, total } = completionsForDate(s, iso);
    if (total > 0 && pct === 100) n++;
  }
  return n;
}

export { todayISO, daysAgoISO };
