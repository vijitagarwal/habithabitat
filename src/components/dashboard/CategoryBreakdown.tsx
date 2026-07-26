import { useScopedStats } from "@/lib/scope-aware-stats";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export function CategoryBreakdown() {
  const { categories, overall, isCat } = useScopedStats();

  return (
    <div className="card-glass rounded-2xl p-6">
      <h3 className="mb-4 text-lg font-semibold">
        {isCat ? "CAT Prep Performance" : "Habit Category Breakdown"}
      </h3>
      <div className="flex items-center gap-6">
        <div className="relative h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categories.filter((d) => d.pct > 0)}
                dataKey="pct"
                nameKey="cat"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                stroke="none"
              >
                {categories
                  .filter((d) => d.pct > 0)
                  .map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-3xl font-bold">{overall}%</div>
              <div className="text-xs text-muted-foreground">{isCat ? "CAT" : "Overall"}</div>
            </div>
          </div>
        </div>
        <ul className="flex-1 space-y-2.5 text-sm">
          {categories.map((d) => (
            <li key={d.cat} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-foreground/90">{d.cat}</span>
              </span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${d.pct}%`, backgroundColor: d.color }}
                  />
                </div>
                <span className="font-semibold tabular-nums">{d.pct}%</span>
              </div>
            </li>
          ))}
          {categories.every((d) => d.pct === 0) && (
            <li className="text-muted-foreground text-sm">
              No data yet — start completing habits!
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
