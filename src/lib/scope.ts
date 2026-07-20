import { createContext, useContext } from "react";
import type { Habit } from "@/lib/habits-store";

export type Scope = "habit" | "cat";
export const ScopeCtx = createContext<Scope>("habit");
export function useScope() { return useContext(ScopeCtx); }

export function filterHabitsByScope<T extends Habit>(habits: T[], scope: Scope): T[] {
  if (scope === "cat") return habits.filter((h) => h.category === "CAT Prep");
  return habits;
}
