import { useHabits, topHabits } from "@/lib/habits-store";

export function TopHabits() {
  const s = useHabits();
  const data = topHabits(s);
  return (
    <div className="card-glass rounded-2xl p-6">
      <h3 className="mb-4 text-lg font-semibold">Top Habits This Month</h3>
      <ul className="space-y-4">
        {data.map(({ habit, pct }) => (
          <li key={habit.id}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">{habit.name}</span>
              <span className="font-semibold text-muted-foreground">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, oklch(0.72 0.18 155), oklch(0.75 0.18 130))",
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
