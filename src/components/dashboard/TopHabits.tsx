import { useScopedStats } from "@/lib/scope-aware-stats";

export function TopHabits() {
  const { topList, isCat } = useScopedStats();

  return (
    <div className="card-glass rounded-2xl p-6">
      <h3 className="mb-4 text-lg font-semibold">
        {isCat ? "Top CAT Prep Habits" : "Top Habits This Month"}
      </h3>
      {topList.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isCat
            ? "No CAT Prep habits yet. Add habits with the 'CAT Prep' category to see them here."
            : "No habits yet. Add some habits to see your top performers."}
        </p>
      ) : (
        <ul className="space-y-4">
          {topList.map(({ habit, pct }) => (
            <li key={habit.id}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">{habit.name}</span>
                <span className="font-semibold text-muted-foreground">{pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: isCat
                      ? "linear-gradient(90deg, oklch(0.7 0.22 25), oklch(0.75 0.18 55))"
                      : "linear-gradient(90deg, oklch(0.72 0.18 155), oklch(0.75 0.18 130))",
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
