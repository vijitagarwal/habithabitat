import * as Icons from "lucide-react";
import { useEffect, useState } from "react";
import {
  CheckCircle2, Circle, RotateCcw, Play, Pause, Square, AlertCircle, Clock, Timer, X
} from "lucide-react";
import {
  type Habit, type HabitStatus,
  habitPct, habitValue, habitTarget, habitStatus, scheduleLabel,
  setHabitValue, toggleHabit, useHabits,
  getActiveTimer, startTimer, pauseTimer, resumeTimer, stopAndSaveTimer, cancelTimer
} from "@/lib/habits-store";

function IconOf(name: string) {
  return (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.CheckCircle2;
}

function formatTimerSec(sec: number): string {
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface Props {
  habit: Habit;
  dateISO: string;
  status: HabitStatus;
  pct: number;
  value: number;
  compact?: boolean;
}

export function HabitRow({ habit: h, dateISO, status, pct, value, compact }: Props) {
  const Icon = IconOf(h.icon);
  const hasBenchmarks = !!(h.benchmarks && h.benchmarks.length);
  const target = habitTarget(h);
  const unit = h.unit ?? "";
  const isBreak = h.direction === "break";
  const isTimeHabit = h.isTimer || ["mins", "hrs", "min", "hr", "minutes", "hours"].includes(unit.toLowerCase());

  const [draft, setDraft] = useState<string>(value ? String(value) : "");
  useEffect(() => { setDraft(value ? String(value) : ""); }, [value, dateISO, h.id]);

  const activeTimer = getActiveTimer();
  const isMyTimer = activeTimer?.habitId === h.id && activeTimer?.dateISO === dateISO;

  const [elapsedSec, setElapsedSec] = useState<number>(0);

  useEffect(() => {
    if (!isMyTimer || !activeTimer) {
      setElapsedSec(0);
      return;
    }
    const updateSec = () => {
      const currentElapsed = activeTimer.isRunning
        ? Math.floor((Date.now() - activeTimer.startTime) / 1000)
        : 0;
      setElapsedSec(activeTimer.accumulatedSec + currentElapsed);
    };
    updateSec();
    if (!activeTimer.isRunning) return;

    const interval = setInterval(updateSec, 1000);
    return () => clearInterval(interval);
  }, [isMyTimer, activeTimer]);

  const commitNumber = (raw: string) => {
    const n = parseFloat(raw);
    setHabitValue(dateISO, h.id, isNaN(n) ? 0 : n);
  };

  const rowTone = isMyTimer
    ? "border-amber-500/60 bg-amber-500/10 ring-2 ring-amber-500/30 pulse-glow"
    : status === "completed"
      ? "border-success/40 bg-success/5"
      : status === "in_progress"
        ? "border-warning/40 bg-warning/5 ring-1 ring-warning/20"
        : status === "failed"
          ? "border-danger/40 bg-danger/5"
          : "border-border bg-background/30 hover:border-primary/40";

  return (
    <div className={`rounded-xl border ${rowTone} px-3 py-2.5 transition-all min-w-0 overflow-hidden`}>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <button
          onClick={() => { if (!hasBenchmarks) toggleHabit(dateISO, h.id); }}
          className="flex flex-1 items-center gap-3 text-left min-w-0"
          disabled={hasBenchmarks}
        >
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
            style={{ backgroundColor: `color-mix(in oklab, var(--color-${h.color}) 20%, transparent)` }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="block truncate text-sm font-medium">{h.name}</span>
              {status === "in_progress" && (
                <span className="rounded-full bg-warning/20 border border-warning/40 px-1.5 py-0.2 text-[9px] font-bold text-warning shrink-0">
                  IN PROGRESS
                </span>
              )}
              {status === "failed" && (
                <span className="rounded-full bg-danger/20 border border-danger/40 px-1.5 py-0.2 text-[9px] font-bold text-danger shrink-0">
                  EXCEEDED
                </span>
              )}
            </div>
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
            <div className="text-right">
              <span className={`text-xs font-semibold truncate max-w-[140px] block ${
                status === "completed" ? "text-success" : status === "in_progress" ? "text-warning" : status === "failed" ? "text-danger" : "text-muted-foreground"
              }`}>
                {isBreak
                  ? `${value || 0}${unit} / max ${target}${unit}`
                  : `${value || 0}${unit} · ${Math.round(pct)}%`}
              </span>
            </div>
          ) : status === "completed" ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Timer Bar or Benchmark Controls */}
      {isMyTimer && activeTimer ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/40 bg-card/80 p-2 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-amber-400">
            <Timer className="h-4 w-4 animate-spin text-amber-400" />
            {formatTimerSec(elapsedSec)}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {activeTimer.isRunning ? (
              <button
                onClick={() => pauseTimer()}
                className="flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/20 px-2 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/30"
              >
                <Pause className="h-3 w-3" /> Pause
              </button>
            ) : (
              <button
                onClick={() => resumeTimer()}
                className="flex items-center gap-1 rounded-md border border-success/40 bg-success/20 px-2 py-1 text-[11px] font-semibold text-success hover:bg-success/30"
              >
                <Play className="h-3 w-3" /> Resume
              </button>
            )}
            <button
              onClick={() => stopAndSaveTimer(unit)}
              className="flex items-center gap-1 rounded-md gradient-brand px-2.5 py-1 text-[11px] font-semibold text-white shadow"
            >
              <Square className="h-3 w-3 fill-current" /> Save Time
            </button>
            <button
              onClick={() => cancelTimer()}
              title="Cancel Timer"
              className="rounded-md border border-border bg-background p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : hasBenchmarks ? (
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

          {(isTimeHabit || hasBenchmarks) && !isMyTimer && (
            <button
              onClick={() => startTimer(h.id, dateISO)}
              title="Start Timer Stopwatch"
              className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400 hover:bg-amber-500/20"
            >
              <Play className="h-3 w-3 fill-current" /> Timer
            </button>
          )}

          <div className="ml-auto flex items-center gap-1 shrink-0">
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
      ) : null}
    </div>
  );
}

// Convenience wrapper: given full state, render row
export function HabitRowConnected({ habit, dateISO, compact }: { habit: Habit; dateISO: string; compact?: boolean }) {
  const s = useHabits();
  const pct = habitPct(s, habit, dateISO);
  const value = habitValue(s, habit, dateISO);
  const status = habitStatus(s, habit, dateISO);
  return <HabitRow habit={habit} dateISO={dateISO} status={status} pct={pct} value={value} compact={compact} />;
}
