import { TrendingUp, Flame, Trophy, AlertCircle } from "lucide-react";
import { useHabits, overallProgress, currentStreak, bestHabitThisWeek, mostMissedHabit } from "@/lib/habits-store";

export function Insights() {
  const s = useHabits();
  const overall = overallProgress(s);
  const streak = currentStreak(s);
  const bestHabit = bestHabitThisWeek(s);
  const worstHabit = mostMissedHabit(s);

  const items = [
    {
      icon: Flame,
      title: "Current Streak",
      body: streak > 0 ? `You're on a ${streak}-day streak! Keep it up.` : "Start a habit today to begin your streak!",
      tint: "var(--amber)",
    },
    {
      icon: Trophy,
      title: "Weekly MVP",
      body: bestHabit.pct > 0 ? `${bestHabit.name} is your best performer at ${bestHabit.pct}%.` : "Complete habits to see your weekly MVP.",
      tint: "var(--teal)",
    },
    {
      icon: AlertCircle,
      title: "Needs Focus",
      body: worstHabit.pct < 100 && worstHabit.name !== "None" ? `${worstHabit.name} was missed most this week (${worstHabit.pct}%).` : "You're crushing all your habits!",
      tint: "var(--coral)",
    },
    {
      icon: TrendingUp,
      title: "Consistency",
      body: `You've completed ${overall}% of your habits this month.`,
      tint: "var(--lav)",
    },
  ];

  return (
    <div className="card-glass rounded-2xl p-6">
      <h3 className="mb-4 text-lg font-semibold">Insights</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.title} className="rounded-xl border border-border bg-background/30 p-4">
            <div
              className="mb-2 grid h-9 w-9 place-items-center rounded-lg"
              style={{ backgroundColor: `color-mix(in oklab, ${i.tint} 20%, transparent)` }}
            >
              <i.icon className="h-4.5 w-4.5" style={{ color: i.tint }} size={18} />
            </div>
            <div className="text-sm font-semibold" style={{ color: i.tint }}>
              {i.title}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{i.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
