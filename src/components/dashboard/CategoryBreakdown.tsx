import { useHabits, categoryBreakdown, overallProgress } from "@/lib/habits-store";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export function CategoryBreakdown() {
  const s = useHabits();
  const data = categoryBreakdown(s);
  const overall = overallProgress(s);

  return (
    <div className="card-glass rounded-2xl p-6">
      <h3 className="mb-4 text-lg font-semibold">Habit Category Breakdown</h3>
      <div className="flex items-center gap-6">
        <div className="relative h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="pct" nameKey="cat" innerRadius={60} outerRadius={90} paddingAngle={2} stroke="none">
                {data.map((d, i) => (<Cell key={i} fill={d.color} />))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-3xl font-bold">{overall}%</div>
              <div className="text-xs text-muted-foreground">Overall</div>
            </div>
          </div>
        </div>
        <ul className="flex-1 space-y-2.5 text-sm">
          {data.map((d) => (
            <li key={d.cat} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-foreground/90">{d.cat}</span>
              </span>
              <span className="font-semibold">{d.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
