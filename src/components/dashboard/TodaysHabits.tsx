import { useHabits, todayISO, habitsFor } from "@/lib/habits-store";
import { CheckCircle2, Circle } from "lucide-react";
import { HabitRowConnected } from "./HabitRow";
import { useScope, filterHabitsByScope } from "@/lib/scope";

export function TodaysHabits() {
  const s = useHabits();
  const scope = useScope();
  const today = todayISO();
  const scheduled = filterHabitsByScope(habitsFor(s, today), scope);
  const doneCount = scheduled.filter((h) => (s.completions[today] ?? []).includes(h.id)).length;
  const stats = { done: doneCount, total: scheduled.length };

  return (
    <div className="card-glass rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Today's Habits</h3>
        <span className="grid h-7 min-w-7 place-items-center rounded-full bg-primary/15 px-2 text-xs font-semibold text-primary">
          {stats.done}/{stats.total}
        </span>
      </div>
      {scheduled.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No habits scheduled today. Enjoy the break, or add one in Settings.
        </div>
      ) : (
        <ul className="space-y-2">
          {scheduled.map((h) => (
            <li key={h.id}>
              <HabitRowConnected habit={h} dateISO={today} />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex items-center justify-center gap-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Done</span>
        <span className="flex items-center gap-1.5"><Circle className="h-3.5 w-3.5 text-warning" /> In Progress</span>
        <span className="flex items-center gap-1.5"><Circle className="h-3.5 w-3.5" /> Not Done</span>
      </div>
    </div>
  );
}
