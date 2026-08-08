import { useHabits, setMonthlyGoal, overallProgress } from "@/lib/habits-store";
import { Target } from "lucide-react";

export function GoalsView() {
  const s = useHabits();
  const overall = overallProgress(s);
  const onTrack = overall >= s.monthlyGoal;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="card-glass rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-pink-500/20 to-red-500/20">
            <Target className="h-6 w-6 text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Monthly Goal</h3>
            <p className="text-xs text-muted-foreground">
              Set the completion rate you want to hit each month.
            </p>
          </div>
        </div>

        <div className="mb-3 flex items-end justify-between">
          <span className="text-4xl font-bold">{s.monthlyGoal}%</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${onTrack ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}
          >
            {onTrack ? "On Track" : "Behind"}
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={s.monthlyGoal}
          onChange={(e) => setMonthlyGoal(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="mt-4 rounded-xl border border-border bg-background/40 p-4">
          <div className="text-xs text-muted-foreground">Current 30-day progress</div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full gradient-brand" style={{ width: `${overall}%` }} />
          </div>
          <div className="mt-2 text-xs">
            {overall}% of {s.monthlyGoal}% goal
          </div>
        </div>
      </div>

      <div className="card-glass rounded-2xl p-6">
        <h3 className="mb-4 text-lg font-semibold">Per-Habit 30-Day Performance</h3>
        {s.habits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No habits yet.</p>
        ) : (
          <ul className="space-y-6">
            {s.habits.map((h) => {
              let sum = 0;
              let valSum = 0;
              for (let i = 0; i < 30; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const iso = d.toISOString().slice(0, 10);
                if (s.completions[iso]?.[h.id]) sum++;
                if (s.values[iso]?.[h.id]) valSum += s.values[iso][h.id];
              }
              const pct = Math.round((sum / 30) * 100);
              
              const isNumeric = h.unit || h.benchmarks?.length;
              const actual = isNumeric ? valSum : sum;
              const hasTarget = !!h.monthlyTarget;
              const targetPct = hasTarget ? Math.min(100, Math.round((actual / h.monthlyTarget!) * 100)) : pct;
              const targetPace = hasTarget ? (actual >= (h.monthlyTarget! / 30) * 30 ? "Yes" : "No") : null;

              return (
                <li key={h.id}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `var(--color-${h.color})` }} />
                      {h.name}
                    </span>
                    <span className="text-muted-foreground font-semibold">
                      {hasTarget ? `${targetPct}% of Target` : `${pct}%`}
                    </span>
                  </div>
                  
                  {hasTarget && (
                    <div className="mb-2 flex items-center gap-4 text-[11px] text-muted-foreground">
                      <div>Target: <span className="font-medium text-foreground">{h.monthlyTarget} {isNumeric ? h.unit : "sessions"}</span></div>
                      <div>Completed: <span className="font-medium text-foreground">{actual}</span></div>
                      <div>On pace: <span className={`font-medium ${targetPace === "Yes" ? "text-success" : "text-amber-500"}`}>{targetPace}</span></div>
                    </div>
                  )}

                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${hasTarget ? targetPct : pct}%`, backgroundColor: `var(--color-${h.color})` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
