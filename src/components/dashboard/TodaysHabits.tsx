import * as Icons from "lucide-react";
import { useHabits, toggleHabit, todayISO, completionsForDate } from "@/lib/habits-store";
import { CheckCircle2, Circle } from "lucide-react";

export function TodaysHabits() {
  const s = useHabits();
  const day = s.completions[todayISO()] ?? {};
  const stats = completionsForDate(s, todayISO());

  return (
    <div className="card-glass rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Today's Habits</h3>
        <span className="grid h-7 min-w-7 place-items-center rounded-full bg-primary/15 px-2 text-xs font-semibold text-primary">
          {stats.total}
        </span>
      </div>
      <ul className="space-y-2">
        {s.habits.map((h) => {
          const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[h.icon] ?? Icons.CheckCircle2;
          const done = day[h.id];
          return (
            <li key={h.id}>
              <button
                onClick={() => toggleHabit(todayISO(), h.id)}
                className={`group flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                  done
                    ? "border-success/30 bg-success/5 hover:bg-success/10"
                    : "border-border bg-background/30 hover:border-primary/40 hover:bg-accent/50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-lg"
                    style={{ backgroundColor: `color-mix(in oklab, var(--color-${h.color}) 20%, transparent)` }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium">{h.name}</span>
                </span>
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-success" fill="currentColor" stroke="oklch(0.15 0.02 260)" strokeWidth={2} />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex items-center justify-center gap-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Done</span>
        <span className="flex items-center gap-1.5"><Circle className="h-3.5 w-3.5 text-warning" /> In Progress</span>
        <span className="flex items-center gap-1.5"><Circle className="h-3.5 w-3.5" /> Not Done</span>
      </div>
    </div>
  );
}
