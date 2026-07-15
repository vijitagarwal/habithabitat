import { ClipboardList, CheckCircle2, Star, TrendingUp } from "lucide-react";
import { useHabits, totalCompleted, perfectDays, overallProgress } from "@/lib/habits-store";

export function QuickStats() {
  const s = useHabits();
  const totalHabits = s.habits.length;
  const completed = totalCompleted(s);
  const perfect = perfectDays(s);
  const rate = overallProgress(s);

  const items = [
    { label: "Total Habits", value: totalHabits, icon: ClipboardList, tint: "oklch(0.72 0.18 235)" },
    { label: "Total Completed", value: completed.toLocaleString(), icon: CheckCircle2, tint: "oklch(0.72 0.18 155)" },
    { label: "Perfect Days", value: perfect, icon: Star, tint: "oklch(0.8 0.17 75)" },
    { label: "Success Rate", value: `${rate}%`, icon: TrendingUp, tint: "oklch(0.72 0.18 275)" },
  ];

  return (
    <div className="card-glass rounded-2xl p-5">
      <h3 className="mb-3 text-base font-semibold">Quick Stats</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((i) => (
          <div key={i.label} className="rounded-xl border border-border bg-background/30 p-3">
            <div className="mb-2 grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundColor: `color-mix(in oklab, ${i.tint} 20%, transparent)` }}>
              <i.icon className="h-4 w-4" style={{ color: i.tint }} />
            </div>
            <div className="text-xs text-muted-foreground">{i.label}</div>
            <div className="text-lg font-bold">{i.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
