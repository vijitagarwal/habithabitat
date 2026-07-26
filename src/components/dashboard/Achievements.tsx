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

  // Sort achievements: unlocked first, then by ID
  const sortedAchievements = achievements.sort((a, b) => {
    if (a.unlocked === b.unlocked) return a.id.localeCompare(b.id);
    return a.unlocked ? -1 : 1;
  });

  // Take the first 4 achievements (prioritizing unlocked ones)
  const displayedAchievements = sortedAchievements.slice(0, 4);

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
        {displayedAchievements.map((i: Achievement) => {
          const Icon = iconMap[i.icon];
          const style = i.unlocked
            ? {
                background: `linear-gradient(135deg, ${i.from}, ${i.to})`,
                boxShadow: `0 8px 24px -8px ${i.from}`,
              }
            : { background: "var(--border)" };
          return (
            <div key={i.id} className="flex flex-col items-center gap-1.5 text-center">
              <div
                className="grid h-14 w-14 place-items-center rounded-2xl shadow-lg"
                style={style}
              >
                <Icon className="h-7 w-7 text-white drop-shadow" />
              </div>
              <div className="text-[11px] font-semibold">{i.label}</div>
              <div className="text-[10px] text-muted-foreground">{i.sub}</div>
              {!i.unlocked && (
                <div className="text-[8px] text-muted-foreground/60">Locked</div>
              )}
            </div>
          );
        })}
        {/* Fill remaining slots if fewer than 4 achievements */}
        {displayedAchievements.length < 4 &&
          Array.from({ length: 4 - displayedAchievements.length }).map((_, i) => (
            <div key={`empty-${i}`} className="flex flex-col items-center gap-1.5 text-center">
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