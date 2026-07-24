import { Flame, Trophy, Target, CheckCircle2 } from "lucide-react";
import { useScopedStats } from "@/lib/scope-aware-stats";
import { todayISO } from "@/lib/habits-store";

function Card({ children, accent = "var(--brand)" }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="card-glass relative flex items-center gap-4 rounded-2xl p-6 min-h-[120px] overflow-hidden transition hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-90"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      {children}
    </div>
  );
}

function CircularProgress({ value, size = 60, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <defs>
        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.72 0.18 235)" />
          <stop offset="100%" stopColor="oklch(0.68 0.22 320)" />
        </linearGradient>
        <linearGradient id="ring-grad-cat" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.7 0.22 25)" />
          <stop offset="100%" stopColor="oklch(0.75 0.18 55)" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="oklch(0.3 0.03 265)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke="url(#ring-grad)"
        strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
      />
    </svg>
  );
}

export function StatCards() {
  const { overall, streak, longest, todayStats, monthlyGoal, isCat } = useScopedStats();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 [&>*]:min-w-0">
      <Card accent="var(--brand)">
        <div className="relative grid place-items-center">
          <CircularProgress value={overall} />
          <div className="absolute text-sm font-bold">{overall}%</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">
            {isCat ? "CAT Prep Progress" : "Overall Progress"}
          </div>
          <div className="mt-1 text-base font-semibold">Last 30 days</div>
          <div className={`mt-1 text-xs font-medium ${overall >= 60 ? "text-success" : "text-warning"}`}>
            {overall >= 80 ? "Excellent 🔥" : overall >= 60 ? "On track 👍" : "Needs focus ⚡"}
          </div>
        </div>
      </Card>

      <Card accent="oklch(0.75 0.18 55)">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
          <Flame className="h-8 w-8 text-orange-400" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Current Streak</div>
          <div className="mt-0.5 text-3xl font-bold tracking-tight">
            {streak} <span className="text-sm font-normal text-muted-foreground">days</span>
          </div>
          <div className="mt-0.5 text-xs font-medium text-orange-400">Keep it up! 🔥</div>
        </div>
      </Card>

      <Card accent="oklch(0.8 0.17 75)">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
          <Trophy className="h-8 w-8 text-yellow-400" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Longest Streak</div>
          <div className="mt-0.5 text-3xl font-bold tracking-tight">
            {longest.days} <span className="text-sm font-normal text-muted-foreground">days</span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">{longest.from} – {longest.to}</div>
        </div>
      </Card>

      <Card accent="var(--success)">
        <div className="relative grid place-items-center">
          <svg width={60} height={60} className="-rotate-90">
            <circle cx={30} cy={30} r={25} stroke="oklch(0.3 0.03 265)" strokeWidth={6} fill="none" />
            <circle cx={30} cy={30} r={25} stroke="oklch(0.72 0.18 155)" strokeWidth={6} fill="none"
              strokeDasharray={2 * Math.PI * 25}
              strokeDashoffset={2 * Math.PI * 25 - (todayStats.pct / 100) * 2 * Math.PI * 25}
              strokeLinecap="round" />
          </svg>
          <CheckCircle2 className="absolute h-6 w-6 text-success" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">
            {isCat ? "CAT Tasks Today" : "Completion Today"}
          </div>
          <div className="mt-0.5 text-3xl font-bold tracking-tight">{todayStats.done} <span className="text-sm text-muted-foreground">/ {todayStats.total}</span></div>
          <div className="mt-0.5 text-xs font-medium text-success">{todayStats.pct}% completed</div>
        </div>
      </Card>

      <Card accent="var(--danger)">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-red-500/20">
          <Target className="h-8 w-8 text-pink-400" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Monthly Goal</div>
          <div className="mt-0.5 text-3xl font-bold tracking-tight">{monthlyGoal}%</div>
          <div className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${overall >= monthlyGoal ? "text-success" : "text-warning"}`}>
            {overall >= monthlyGoal ? "On Track" : "Behind target"}
            <span className={`h-1.5 w-1.5 rounded-full ${overall >= monthlyGoal ? "bg-success" : "bg-warning"}`} />
          </div>
        </div>
      </Card>
    </div>
  );
}
