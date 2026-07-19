import { useEffect, useState } from "react";
import { useHabits, completionsForDate, todayISO, habitsFor } from "@/lib/habits-store";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DatePicker } from "./DatePicker";
import { HabitRowConnected } from "./HabitRow";

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
  const scheduled = habitsFor(s, date);
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
          <DatePicker value={date} onChange={setDate} />
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

      {scheduled.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No habits scheduled for this date.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {scheduled.map((h) => (
            <li key={h.id}>
              <HabitRowConnected habit={h} dateISO={date} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
