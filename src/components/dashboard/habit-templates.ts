import { Habit } from "@/lib/habits-store";
import { HabitCategory } from "@/lib/habits-store";

export type HabitTemplate = Omit<Habit, "id" | "createdAt">;

export const HABIT_TEMPLATES: Record<string, { name: string; habits: HabitTemplate[] }> = {
  CAT: {
    name: "CAT Prep Pack",
    habits: [
      { name: "Read 1 AEON Essay", icon: "BookOpen", category: "CAT Prep", color: "brand", direction: "build", schedule: { type: "daily" } },
      { name: "Solve 3 DILR sets", icon: "Brain", category: "CAT Prep", color: "brand", direction: "build", schedule: { type: "daily" } },
      { name: "Give 1 Sectional Mock", icon: "GraduationCap", category: "CAT Prep", color: "brand", direction: "build", schedule: { type: "daily" } },
    ],
  },
  DEEP_WORK: {
    name: "Deep Work Pack",
    habits: [
      { name: "No Phone until Noon", icon: "Smartphone", category: "Productivity", color: "warning", direction: "break", benchmarks: [0], unit: "hr", schedule: { type: "daily" } },
      { name: "2 Hours Deep Work", icon: "Laptop", category: "Productivity", color: "brand", direction: "build", benchmarks: [120], unit: "min", schedule: { type: "daily" }, isTimer: true },
      { name: "Plan tomorrow", icon: "CalendarCheck", category: "Productivity", color: "info", direction: "build", schedule: { type: "daily" } },
    ],
  },
};
