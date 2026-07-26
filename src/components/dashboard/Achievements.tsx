import {
  Bird,
  Flame,
  ShieldCheck,
  Award,
  CheckCircle2,
  Star,
  GraduationCap,
  Trophy,
  ListCheck,
  Calculator,
} from "lucide-react";
import { useHabits, getAchievements, type Achievement } from "../../lib/habits-store";

export function Achievements({ onViewAll }: { onViewAll?: () => void } = {}) {
  const s = useHabits();
  const achievements = s ? getAchievements(s) : [];

  // Get the 4 most recently unlocked achievements
  const recentAchievements = achievements
    .filter((a: Achievement) => a.unlocked)
    .sort((a: Achievement, b: Achievement) => {
      // Simple sorting - in a real app you might track unlock dates
      return a.id.localeCompare(b.id);
    })
    .slice(0, 4);

  // Map icon names to actual icons
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Bird: Bird,
    Flame: Flame,
    ShieldCheck: ShieldCheck,
    Award: Award,
    CheckCircle2: CheckCircle2,
    Star: Star,
    GraduationCap: GraduationCap,
    Trophy: Trophy,
    ListCheck: ListCheck,
    Calculator: Calculator,
  };

  return (
    <div className="card-glass min-w-0 rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">Recent Achievements</h3>
        <button onClick={onViewAll} className="text-xs font-medium text-primary hover:underline">
          View All
        </button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {recentAchievements.length > 0
          ? recentAchievements.map((i: Achievement) => {
              const Icon = iconMap[i.icon];
              return (
                <div key={i.id} className="flex flex-col items-center gap-1.5 text-center">
                  <div
                    className="grid h-14 w-14 place-items-center rounded-2xl shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${i.from}, ${i.to})`,
                      boxShadow: `0 8px 24px -8px ${i.from}`,
                      filter: i.unlocked ? "none" : "grayscale(80%) opacity(0.6)",
                    }}
                  >
                    <Icon className="h-7 w-7 text-white drop-shadow" />
                  </div>
                  <div className="text-[11px] font-semibold">{i.label}</div>
                  <div className="text-[10px] text-muted-foreground">{i.sub}</div>
                </div>
              );
            })
          : // Fallback if no achievements are unlocked yet
            Array(4)
              .fill(0)
              .map((_, i) => (
                <div
                  key={`placeholder-${i}`}
                  className="flex flex-col items-center gap-1.5 text-center"
                >
                  <div className="grid h-14 w-14 place-items-center rounded-2xl shadow-lg bg-gray-100">
                    <Award className="h-7 w-7 text-gray-400" />
                  </div>
                  <div className="text-[11px] font-semibold text-gray-400">Locked</div>
                  <div className="text-[10px] text-muted-foreground text-gray-300">Achievement</div>
                </div>
              ))}
      </div>
    </div>
  );
}
