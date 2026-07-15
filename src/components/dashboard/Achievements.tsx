import { Bird, Flame, ShieldCheck, Award } from "lucide-react";

const items = [
  { icon: Bird, label: "Early Bird", sub: "7 Days", from: "oklch(0.7 0.18 235)", to: "oklch(0.55 0.2 260)" },
  { icon: Flame, label: "Streak Master", sub: "25 Days", from: "oklch(0.75 0.2 55)", to: "oklch(0.65 0.22 25)" },
  { icon: ShieldCheck, label: "Consistent", sub: "50 Days", from: "oklch(0.72 0.18 155)", to: "oklch(0.55 0.2 175)" },
  { icon: Award, label: "Gold Achiever", sub: "90% Goal", from: "oklch(0.8 0.17 75)", to: "oklch(0.65 0.2 45)" },
];

export function Achievements() {
  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">Recent Achievements</h3>
        <button className="text-xs font-medium text-primary hover:underline">View All</button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {items.map((i) => (
          <div key={i.label} className="flex flex-col items-center gap-1.5 text-center">
            <div
              className="grid h-14 w-14 place-items-center rounded-2xl shadow-lg"
              style={{ background: `linear-gradient(135deg, ${i.from}, ${i.to})`, boxShadow: `0 8px 24px -8px ${i.from}` }}
            >
              <i.icon className="h-7 w-7 text-white drop-shadow" />
            </div>
            <div className="text-[11px] font-semibold">{i.label}</div>
            <div className="text-[10px] text-muted-foreground">{i.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
