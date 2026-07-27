import { useEffect, useState } from "react";
import { useHabits, completionsForDate, todayISO, habitsFor } from "@/lib/habits-store";
import { ChevronLeft, ChevronRight, Snowflake } from "lucide-react";
import { DatePicker } from "./DatePicker";
import { HabitRowConnected } from "./HabitRow";
import { useScope, filterHabitsByScope } from "@/lib/scope";

function addDays(iso: string, delta: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

interface Props {
  initialDate?: string;
}

export function DailyTracker({ initialDate }: Props) {
  const s = useHabits();
  const scope = useScope();
  const [date, setDate] = useState(initialDate ?? todayISO());
  useEffect(() => {
    if (initialDate) setDate(initialDate);
  }, [initialDate]);
  const scheduled = filterHabitsByScope(habitsFor(s, date), scope);
  const stats = completionsForDate(s, date);
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(
      new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    );
  }, [date]);

  return (
    <div className="card-glass rounded-2xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Daily Tracker</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground" suppressHydrationWarning>
            <span>{label}</span>
            <span className="flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-cyan-500">
              <Snowflake className="h-3 w-3" /> {s.freezeTokens} Freezes Available
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDate(addDays(date, -1))}
            className="rounded-lg border border-border bg-background p-2 hover:border-primary/40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <DatePicker value={date} onChange={setDate} />
          <button
            onClick={() => setDate(addDays(date, 1))}
            className="rounded-lg border border-border bg-background p-2 hover:border-primary/40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDate(todayISO())}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-primary/40"
          >
            Today
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div
          className={`h-2.5 w-full overflow-hidden rounded-full bg-muted ${stats.pct === 100 ? "pulse-glow" : ""}`}
        >
          <div
            className="h-full gradient-amber-teal transition-all duration-500"
            style={{ width: `${stats.pct}%` }}
          />
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums">
          {stats.done}/{stats.total} · {stats.pct}%
        </span>
      </div>

      {scheduled.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No habits scheduled for this date.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2 [&>*]:min-w-0">
          {scheduled.map((h) => (
            <li key={h.id} className="min-w-0">
              <HabitRowConnected habit={h} dateISO={date} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
