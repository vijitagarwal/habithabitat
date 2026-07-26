import { ClipboardList, CheckCircle2, Star, TrendingUp } from "lucide-react";
import { useScopedStats } from "@/lib/scope-aware-stats";

export function QuickStats() {
  const { habits, totalDone, perfect, overall, isCat } = useScopedStats();

  const items = [
    {
      label: isCat ? "CAT Prep Habits" : "Total Habits",
      value: habits.length,
      icon: ClipboardList,
      tint: "oklch(0.72 0.18 235)",
    },
    {
      label: "Total Completed",
      value: totalDone.toLocaleString(),
      icon: CheckCircle2,
      tint: "oklch(0.72 0.18 155)",
    },
    {
      label: "Perfect Days",
      value: perfect,
      icon: Star,
      tint: "oklch(0.8 0.17 75)",
    },
    {
      label: isCat ? "CAT Success Rate" : "Success Rate",
      value: `${overall}%`,
      icon: TrendingUp,
      tint: isCat ? "oklch(0.7 0.22 25)" : "oklch(0.72 0.18 275)",
    },
  ];

  return (
    <div className="card-glass rounded-2xl p-5">
      <h3 className="mb-3 text-base font-semibold">{isCat ? "CAT Quick Stats" : "Quick Stats"}</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((i) => (
          <div key={i.label} className="rounded-xl border border-border bg-background/30 p-3">
            <div
              className="mb-2 grid h-8 w-8 place-items-center rounded-lg"
              style={{ backgroundColor: `color-mix(in oklab, ${i.tint} 20%, transparent)` }}
            >
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
