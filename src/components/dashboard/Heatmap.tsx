import { useHabits, monthlyHeatmap } from "@/lib/habits-store";

const rows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const levelColors = [
  "oklch(0.28 0.02 265)", // 0 none
  "oklch(0.55 0.18 55)",  // 1 few (orange)
  "oklch(0.62 0.2 130)",  // 2 some (light green)
  "oklch(0.62 0.2 155)",  // 3 most (green)
  "oklch(0.7 0.2 155)",   // 4 all (bright green)
];

export function Heatmap() {
  const s = useHabits();
  const { cells, daysInMonth } = monthlyHeatmap(s);

  // Build grid: 7 rows x daysInMonth cols
  const grid: (typeof cells[number] | null)[][] = Array.from({ length: 7 }, () => Array(daysInMonth).fill(null));
  for (const c of cells) grid[c.row][c.day - 1] = c;

  const colTicks = [1, 5, 10, 15, 20, 25, 30].filter((d) => d <= daysInMonth);
  if (daysInMonth === 31 && !colTicks.includes(31)) colTicks.push(31);

  return (
    <div className="card-glass rounded-2xl p-6">
      <h3 className="mb-4 text-lg font-semibold">Monthly Heatmap</h3>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header numbers */}
          <div className="mb-1 flex pl-10 text-[10px] text-muted-foreground" style={{ gap: "4px" }}>
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              return (
                <div key={d} style={{ width: 18 }} className="text-center">
                  {colTicks.includes(d) ? d : ""}
                </div>
              );
            })}
          </div>
          {rows.map((label, ri) => (
            <div key={label} className="mb-1 flex items-center" style={{ gap: "4px" }}>
              <div className="w-8 shrink-0 text-xs text-muted-foreground">{label}</div>
              {grid[ri].map((cell, ci) => (
                <div
                  key={ci}
                  style={{
                    width: 18, height: 18, borderRadius: 4,
                    backgroundColor: cell && cell.hasData ? levelColors[cell.level] : "oklch(0.25 0.02 265)",
                    opacity: cell ? 1 : 0.3,
                  }}
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
