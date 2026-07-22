/**
 * scope-aware-stats.ts
 *
 * Scope-aware wrappers around the habits-store aggregate functions.
 * When scope is "cat", all stats are computed only over CAT Prep habits.
 * When scope is "habit", all habits are included (same as before).
 *
 * Usage in components:
 *   import { useScopedStats } from "@/lib/scope-aware-stats";
 *   const stats = useScopedStats();
 *   // stats.overall, stats.streak, stats.today, etc.
 */

import { useMemo } from "react";
import { useHabits, type HabitState, type Habit } from "@/lib/habits-store";
import { useScope, filterHabitsByScope } from "@/lib/scope";
import {
  overallProgress,
  currentStreak,
  longestStreak,
  completionsForDate,
  weeklyProgress,
  categoryBreakdown,
  topHabits,
  totalCompleted,
  perfectDays,
  habitsFor,
  habitPct,
  isScheduledOn,
  daysAgoISO,
  todayISO,
} from "@/lib/habits-store";

// ── Helper: create a scoped HabitState ────────────────────────────────

/**
 * Returns a HabitState where `habits` is already filtered by scope.
 * All aggregate functions that iterate over `s.habits` will naturally
 * only see the scoped subset.
 */
function scopedState(s: HabitState, scope: "habit" | "cat"): HabitState {
  return { ...s, habits: filterHabitsByScope(s.habits, scope) };
}

// ── Scope-aware aggregate wrappers ────────────────────────────────────

export function scopedOverallProgress(s: HabitState, scope: "habit" | "cat"): number {
  return overallProgress(scopedState(s, scope));
}

export function scopedCurrentStreak(s: HabitState, scope: "habit" | "cat"): number {
  return currentStreak(scopedState(s, scope));
}

export function scopedLongestStreak(s: HabitState, scope: "habit" | "cat") {
  return longestStreak(scopedState(s, scope));
}

export function scopedCompletionsForDate(s: HabitState, scope: "habit" | "cat", dateISO: string) {
  return completionsForDate(scopedState(s, scope), dateISO);
}

export function scopedWeeklyProgress(s: HabitState, scope: "habit" | "cat") {
  return weeklyProgress(scopedState(s, scope));
}

export function scopedCategoryBreakdown(s: HabitState, scope: "habit" | "cat") {
  // In CAT scope: only show CAT Prep category
  return categoryBreakdown(scopedState(s, scope)).filter(
    (d) => scope === "habit" || d.cat === "CAT Prep"
  );
}

export function scopedTopHabits(s: HabitState, scope: "habit" | "cat") {
  return topHabits(scopedState(s, scope));
}

export function scopedTotalCompleted(s: HabitState, scope: "habit" | "cat"): number {
  return totalCompleted(scopedState(s, scope));
}

export function scopedPerfectDays(s: HabitState, scope: "habit" | "cat"): number {
  return perfectDays(scopedState(s, scope));
}

// ── React hook: useScopedStats ─────────────────────────────────────────

/**
 * All-in-one hook for scope-aware statistics.
 * Components should use this instead of calling individual aggregate
 * functions directly when they need to respect the Habit/CAT scope.
 */
export function useScopedStats() {
  const s = useHabits();
  const scope = useScope();
  const today = todayISO();

  return useMemo(() => {
    const ss = scopedState(s, scope);
    const isCat = scope === "cat";
    return {
      scope,
      isCat,
      habits: ss.habits,
      overall: overallProgress(ss),
      streak: currentStreak(ss),
      longest: longestStreak(ss),
      todayStats: completionsForDate(ss, today),
      weeklyData: weeklyProgress(ss),
      categories: categoryBreakdown(ss).filter((d) => !isCat || d.cat === "CAT Prep"),
      topList: topHabits(ss),
      totalDone: totalCompleted(ss),
      perfect: perfectDays(ss),
      monthlyGoal: s.monthlyGoal,
      level: s.level,
      xp: s.xp,
    };
  }, [s, scope, today]);
}

export { todayISO, daysAgoISO, habitsFor, habitPct, isScheduledOn };
