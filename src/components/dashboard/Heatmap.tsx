import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useHabits, monthlyHeatmap } from "@/lib/habits-store";

const levelColors = [
  "oklch(0.28 0.02 265)", // 0 none
  "oklch(0.55 0.18 55)", // 1 few (orange)
  "oklch(0.62 0.2 130)", // 2 some (light green)
  "oklch(0.62 0.2 155)", // 3 most (green)
  "oklch(0.7 0.2 155)", // 4 all (bright green)
];

export function Heatmap() {
  const s = useHabits();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const { cells, daysInMonth, habitNames } = monthlyHeatmap(s, year, month);

  const grid: ((typeof cells)[number] | null)[][] = Array.from({ length: habitNames.length }, () =>
    Array(daysInMonth).fill(null),
  );
  for (const c of cells) {
    if (c.row >= 0 && c.row < habitNames.length) {
      grid[c.row][c.day - 1] = c;
    }
  }

  const colTicks = [1, 5, 10, 15, 20, 25, 30].filter((d) => d <= daysInMonth);
  if (daysInMonth === 31 && !colTicks.includes(31)) colTicks.push(31);

  const title = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const nav = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const isCurrent = year === now.getFullYear() && month === now.getMonth();

  return (
    <div className="card-glass min-w-0 rounded-2xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Monthly Heatmap</h3>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => nav(-1)}
            title="Previous month"
            className="rounded-lg border border-border bg-background p-2 hover:border-primary/40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setYear(now.getFullYear());
              setMonth(now.getMonth());
            }}
            disabled={isCurrent}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-primary/40 disabled:opacity-50"
          >
            This Month
          </button>
          <button
            onClick={() => nav(1)}
            disabled={isCurrent}
            title="Next month"
            className="rounded-lg border border-border bg-background p-2 hover:border-primary/40 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="mb-1 flex pl-[100px] text-[10px] text-muted-foreground" style={{ gap: "4px" }}>
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              return (
                <div key={d} style={{ width: 18 }} className="text-center">
                  {colTicks.includes(d) ? d : ""}
                </div>
              );
            })}
          </div>
          {habitNames.map((label, ri) => (
            <div key={`${label}-${ri}`} className="mb-1 flex items-center" style={{ gap: "4px" }}>
              <div className="w-24 shrink-0 truncate text-xs text-muted-foreground" title={label}>{label}</div>
              {grid[ri].map((cell, ci) => (
                <div
                  key={ci}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    backgroundColor:
                      cell && cell.hasData ? levelColors[cell.level] : "oklch(0.25 0.02 265)",
                    opacity: cell ? 1 : 0.3,
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                  className="hover:scale-110 hover:shadow-md hover:shadow-primary/20"
                  title={cell ? `Day ${cell.day}` : ""}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
        {[
          { l: "All Done", c: levelColors[4] },
          { l: "Most Done", c: levelColors[3] },
          { l: "Some Done", c: levelColors[2] },
          { l: "Few Done", c: levelColors[1] },
          { l: "None", c: "oklch(0.55 0.22 25)" },
          { l: "No Data", c: "oklch(0.28 0.02 265)" },
        ].map((k) => (
          <span key={k.l} className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: k.c }} />
            {k.l}
          </span>
        ))}
      </div>
    </div>
  );
}
