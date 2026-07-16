import * as Icons from "lucide-react";
import { useEffect, useState } from "react";
import { useHabits, toggleHabit, completionsForDate, todayISO } from "@/lib/habits-store";
import { CheckCircle2, Circle, ChevronLeft, ChevronRight } from "lucide-react";
import { DatePicker } from "./DatePicker";

function addDays(iso: string, delta: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

interface Props { initialDate?: string; }

export function DailyTracker({ initialDate }: Props) {
  const s = useHabits();
  const [date, setDate] = useState(initialDate ?? todayISO());
  useEffect(() => { if (initialDate) setDate(initialDate); }, [initialDate]);
  const day = s.completions[date] ?? {};
  const stats = completionsForDate(s, date);
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
  }, [date]);

  return (
    <div className="card-glass rounded-2xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Daily Tracker</h3>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>{label}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(addDays(date, -1))} className="rounded-lg border border-border bg-background p-2 hover:border-primary/40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
          />
          <button onClick={() => setDate(addDays(date, 1))} className="rounded-lg border border-border bg-background p-2 hover:border-primary/40">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={() => setDate(todayISO())} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-primary/40">
            Today
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full gradient-brand transition-all" style={{ width: `${stats.pct}%` }} />
        </div>
        <span className="shrink-0 text-sm font-semibold">{stats.done}/{stats.total} · {stats.pct}%</span>
      </div>

      {s.habits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No habits yet. Add some from Settings to start tracking.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {s.habits.map((h) => {
            const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[h.icon] ?? Icons.CheckCircle2;
            const done = day[h.id];
            return (
              <li key={h.id}>
                <button
                  onClick={() => toggleHabit(date, h.id)}
                  className={`group flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                    done ? "border-success/30 bg-success/5" : "border-border bg-background/30 hover:border-primary/40"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="grid h-8 w-8 place-items-center rounded-lg"
                      style={{ backgroundColor: `color-mix(in oklab, var(--color-${h.color}) 20%, transparent)` }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium">{h.name}</span>
                  </span>
                  {done ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
