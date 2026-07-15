import { useHabits, weeklyProgress } from "@/lib/habits-store";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Cell } from "recharts";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function WeeklyProgress() {
  const s = useHabits();
  const data = weeklyProgress(s);
  const [range, setRange] = useState("This Week");

  return (
    <div className="card-glass rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Weekly Progress</h3>
        <div className="relative">
          <select
            value={range} onChange={(e) => setRange(e.target.value)}
            className="appearance-none rounded-lg border border-border bg-background/50 pr-8 pl-3 py-1.5 text-xs font-medium hover:border-primary/50"
          >
            <option>This Week</option>
            <option>Last Week</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 24, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.72 0.18 235)" />
                <stop offset="100%" stopColor="oklch(0.65 0.24 300)" />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "oklch(0.7 0.02 260)", fontSize: 12 }} />
            <YAxis
              domain={[0, 100]} ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false}
              tick={{ fill: "oklch(0.6 0.02 260)", fontSize: 11 }}
            />
            <Bar dataKey="pct" radius={[8, 8, 0, 0]}>
              {data.map((_, i) => (<Cell key={i} fill="url(#bar-grad)" />))}
              <LabelList dataKey="pct" position="top" formatter={(v: number) => `${v}%`} style={{ fill: "oklch(0.9 0.01 260)", fontSize: 11, fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
