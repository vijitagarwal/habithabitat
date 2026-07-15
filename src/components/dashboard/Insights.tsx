import { TrendingUp, Star, Target, Droplets } from "lucide-react";
import { useHabits, overallProgress } from "@/lib/habits-store";

export function Insights() {
  const s = useHabits();
  const overall = overallProgress(s);

  const items = [
    { icon: TrendingUp, title: "Great Job!", body: `You're ${Math.max(1, overall - 72)}% more consistent than last month.`, tint: "oklch(0.72 0.18 155)" },
    { icon: Star, title: "Best Day", body: "Thursdays are your most productive days.", tint: "oklch(0.72 0.18 275)" },
    { icon: Target, title: "Keep Going!", body: "Evening habits need a bit more consistency.", tint: "oklch(0.75 0.18 55)" },
    { icon: Droplets, title: "Consistency is Key", body: `You've completed ${overall}% of your habits this month.`, tint: "oklch(0.72 0.18 235)" },
  ];

  return (
    <div className="card-glass rounded-2xl p-6">
      <h3 className="mb-4 text-lg font-semibold">Insights</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.title} className="rounded-xl border border-border bg-background/30 p-4">
            <div className="mb-2 grid h-9 w-9 place-items-center rounded-lg" style={{ backgroundColor: `color-mix(in oklab, ${i.tint} 20%, transparent)` }}>
              <i.icon className="h-4.5 w-4.5" style={{ color: i.tint }} size={18} />
            </div>
            <div className="text-sm font-semibold" style={{ color: i.tint }}>{i.title}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{i.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
