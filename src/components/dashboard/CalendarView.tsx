import { useState } from "react";
import { useHabits, completionsForDate, todayISO } from "@/lib/habits-store";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DailyTracker } from "./DailyTracker";

const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarView() {
  const s = useHabits();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(todayISO());

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = (first.getDay() + 6) % 7; // Mon start
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const title = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const nav = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear()); setMonth(d.getMonth());
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 [&>*]:min-w-0">
      <div className="card-glass min-w-0 rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center gap-1">
            <button onClick={() => nav(-1)} className="rounded-lg border border-border bg-background p-2 hover:border-primary/40"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelected(todayISO()); }} className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-primary/40">Today</button>
            <button onClick={() => nav(1)} className="rounded-lg border border-border bg-background p-2 hover:border-primary/40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
          {dow.map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const iso = new Date(year, month, d).toISOString().slice(0, 10);
            const { pct, done, total } = completionsForDate(s, iso);
            const isSelected = iso === selected;
            const isToday = iso === todayISO();
            const bg = pct >= 80 ? "oklch(0.62 0.2 155)" : pct >= 50 ? "oklch(0.72 0.18 55)" : pct > 0 ? "oklch(0.55 0.18 25)" : "oklch(0.28 0.02 265)";
            return (
              <button
                key={i} onClick={() => setSelected(iso)}
                className={`aspect-square rounded-lg border p-1 text-left transition hover:border-primary ${isSelected ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
                style={{ backgroundColor: `color-mix(in oklab, ${bg} ${pct > 0 ? 35 : 60}%, transparent)` }}
                title={`${done}/${total} completed`}
              >
                <div className={`text-xs font-semibold ${isToday ? "text-primary" : ""}`}>{d}</div>
                {total > 0 && <div className="text-[9px] text-muted-foreground">{pct}%</div>}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ backgroundColor: "oklch(0.62 0.2 155)" }} /> 80%+</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ backgroundColor: "oklch(0.72 0.18 55)" }} /> 50-79%</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ backgroundColor: "oklch(0.55 0.18 25)" }} /> Under 50%</span>
        </div>
      </div>
      <DailyTracker initialDate={selected} />
    </div>
  );
}
