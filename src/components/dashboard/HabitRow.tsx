import * as Icons from "lucide-react";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, RotateCcw } from "lucide-react";
import {
  type Habit,
  habitPct, habitValue, habitTarget, scheduleLabel,
  setHabitValue, toggleHabit,
} from "@/lib/habits-store";

function IconOf(name: string) {
  return (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.CheckCircle2;
}

interface Props {
  habit: Habit;
  dateISO: string;
  done: boolean;
  pct: number;
  value: number;
  compact?: boolean;
}

export function HabitRow({ habit: h, dateISO, done, pct, value, compact }: Props) {
  const Icon = IconOf(h.icon);
  const hasBenchmarks = !!(h.benchmarks && h.benchmarks.length);
  const target = habitTarget(h);
  const unit = h.unit ?? "";
  const isBreak = h.direction === "break";

  const [draft, setDraft] = useState<string>(value ? String(value) : "");
  useEffect(() => { setDraft(value ? String(value) : ""); }, [value, dateISO, h.id]);

  const commitNumber = (raw: string) => {
    const n = parseFloat(raw);
    setHabitValue(dateISO, h.id, isNaN(n) ? 0 : n);
  };

  const rowTone = hasBenchmarks
    ? pct >= 100 ? "border-success/30 bg-success/5"
      : pct > 0 ? "border-warning/30 bg-warning/5"
      : "border-border bg-background/30"
    : done ? "border-success/30 bg-success/5" : "border-border bg-background/30 hover:border-primary/40";

  return (
    <div className={`rounded-xl border ${rowTone} px-3 py-2.5 transition`}>
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => { if (!hasBenchmarks) toggleHabit(dateISO, h.id); }}
          className="flex flex-1 items-center gap-3 text-left"
          disabled={hasBenchmarks}
        >
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
            style={{ backgroundColor: `color-mix(in oklab, var(--color-${h.color}) 20%, transparent)` }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{h.name}</span>
            {!compact && (
              <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="rounded-full border border-border px-1.5 py-0.5">{scheduleLabel(h)}</span>
                {hasBenchmarks && (
                  <span className="rounded-full border border-border px-1.5 py-0.5">
                    {isBreak ? "Limit" : "Goal"} {target}{unit}
                  </span>
                )}
              </span>
            )}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {hasBenchmarks ? (
            <span className={`text-xs font-semibold ${pct >= 100 ? "text-success" : pct > 0 ? "text-warning" : "text-muted-foreground"}`}>
              {value || 0}{unit} · {Math.round(pct)}%
            </span>
          ) : done ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {hasBenchmarks && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {isBreak && (
            <button
              onClick={() => setHabitValue(dateISO, h.id, 0)}
              className={`rounded-full border px-2 py-1 text-[11px] font-medium transition ${value === 0 ? "border-success bg-success/15 text-success" : "border-border bg-background hover:border-success/40"}`}
            >
              0{unit}
            </button>
          )}
          {h.benchmarks!.map((b) => {
            const active = isBreak ? value >= b : value >= b;
            const good = isBreak ? !active : active;
            return (
              <button
                key={b}
                onClick={() => setHabitValue(dateISO, h.id, b)}
                className={`rounded-full border px-2 py-1 text-[11px] font-medium transition ${
                  active
                    ? good
                      ? "border-success bg-success/15 text-success"
                      : "border-warning bg-warning/15 text-warning"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                {b}{unit}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={(e) => commitNumber(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              placeholder="0"
              className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-right text-xs outline-none focus:border-primary"
            />
            {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
            <button
              onClick={() => setHabitValue(dateISO, h.id, 0)}
              title="Reset"
              className="rounded-lg border border-border bg-background p-1 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function HabitList({ dateISO, empty }: { dateISO: string; empty?: React.ReactNode }) {
  return null; // reserved for future consolidation
}

// Convenience wrapper: given full state, render row
import { useHabits } from "@/lib/habits-store";
export function HabitRowConnected({ habit, dateISO, compact }: { habit: Habit; dateISO: string; compact?: boolean }) {
  const s = useHabits();
  const pct = habitPct(s, habit, dateISO);
  const value = habitValue(s, habit, dateISO);
  const done = pct >= 100;
  return <HabitRow habit={habit} dateISO={dateISO} done={done} pct={pct} value={value} compact={compact} />;
}
