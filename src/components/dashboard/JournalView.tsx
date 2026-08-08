import { useEffect, useState, useMemo } from "react";
import { useHabits, setNote, todayISO, completionsForDate } from "@/lib/habits-store";
import { DatePicker } from "./DatePicker";
import { Search } from "lucide-react";

interface JournalViewProps {
  initialMode?: "daily" | "weekly";
}

// Get the 7 days of the current ISO week (Mon–Sun)
function getThisWeekDays(): string[] {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${dd}`);
  }
  return days;
}

function WeeklyReflection({ weekDays }: { weekDays: string[] }) {
  const s = useHabits();
  // Use a special key for weekly note: "weekly-YYYY-Www"
  const now = new Date();
  const weekKey = (() => {
    const y = now.getFullYear();
    const start = new Date(y, 0, 1);
    const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
    return `weekly-${y}-W${String(week).padStart(2, "0")}`;
  })();
  const [text, setText] = useState(s.notes[weekKey] || "");
  return (
    <>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your weekly reflection here..."
        className="min-h-[120px] w-full resize-y rounded-xl border border-border bg-background/40 p-4 text-sm outline-none focus:border-primary"
      />
      <div className="mt-2 flex justify-end">
        <button
          onClick={() => setNote(weekKey, text)}
          className="rounded-lg gradient-brand px-3 py-1.5 text-xs font-semibold text-white shadow"
        >
          Save Reflection
        </button>
      </div>
    </>
  );
}

export function JournalView({ initialMode = "daily" }: JournalViewProps) {
  const s = useHabits();
  const [mode, setMode] = useState<"daily" | "weekly">(initialMode);
  const [date, setDate] = useState(todayISO());
  const [text, setText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    setText(s.notes[date] ?? "");
  }, [date, s.notes]);

  const allEntries = useMemo(() => Object.entries(s.notes), [s.notes]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return allEntries;
    return allEntries.filter(([_, content]) =>
      content.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [allEntries, searchQuery]);

  const recent = filteredEntries
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 8);

  const weekDays = useMemo(() => getThisWeekDays(), []);
  
  // Weekly stats — only computed in weekly mode
  const weekStats = weekDays.map((d) => {
    const { done, total, pct } = completionsForDate(s, d);
    const note = s.notes[d] || "";
    const label = new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
    return { date: d, done, total, pct, note, label };
  });
  
  const daysWithData = weekStats.filter((d) => d.total > 0);
  const weekAvgPct = daysWithData.length > 0
    ? Math.round(daysWithData.reduce((sum, d) => sum + d.pct, 0) / daysWithData.length)
    : 0;
  const bestDay = daysWithData.reduce((best, d) => d.pct > (best?.pct ?? -1) ? d : best, daysWithData[0] ?? null);
  const worstDay = daysWithData.reduce((worst, d) => d.pct < (worst?.pct ?? 101) ? d : worst, daysWithData[0] ?? null);
  const journalDaysThisWeek = weekStats.filter((d) => d.note.trim().length > 0);

  return (
    <div>
      {/* Tab switcher */}
      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setMode("daily")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
            mode === "daily"
              ? "gradient-brand text-white shadow"
              : "border border-border bg-background/40 text-muted-foreground hover:text-foreground"
          }`}
        >
          Daily Journal
        </button>
        <button
          onClick={() => setMode("weekly")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
            mode === "weekly"
              ? "gradient-brand text-white shadow"
              : "border border-border bg-background/40 text-muted-foreground hover:text-foreground"
          }`}
        >
          📊 Weekly Review
        </button>
      </div>

      {mode === "weekly" ? (
        <div className="space-y-5">
          {/* Summary cards row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Week Average", value: `${weekAvgPct}%`, color: weekAvgPct >= 80 ? "text-emerald-400" : weekAvgPct >= 50 ? "text-amber-400" : "text-red-400" },
              { label: "Best Day", value: bestDay ? `${bestDay.label} (${bestDay.pct}%)` : "—", color: "text-emerald-400" },
              { label: "Needs Attention", value: worstDay && worstDay.pct < 80 ? `${worstDay.label} (${worstDay.pct}%)` : "All good!", color: "text-amber-400" },
              { label: "Journal Entries", value: `${journalDaysThisWeek.length}/7`, color: "text-muted-foreground" },
            ].map((stat) => (
              <div key={stat.label} className="card-glass rounded-xl p-4">
                <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Day-by-day breakdown */}
          <div className="card-glass rounded-2xl p-5">
            <h4 className="text-sm font-semibold mb-3">Day-by-Day</h4>
            <div className="space-y-2">
              {weekStats.map((day) => {
                const isToday = day.date === todayISO();
                const isFuture = day.date > todayISO();
                return (
                  <div key={day.date} className={`flex items-center gap-3 rounded-xl p-3 ${isToday ? "border border-primary/30 bg-primary/5" : "border border-border/40 bg-background/20"}`}>
                    <div className="w-20 shrink-0 text-xs font-medium text-muted-foreground">{day.label}</div>
                    {isFuture ? (
                      <div className="flex-1 text-xs text-muted-foreground/50">upcoming</div>
                    ) : day.total === 0 ? (
                      <div className="flex-1 text-xs text-muted-foreground/50">no habits scheduled</div>
                    ) : (
                      <>
                        <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${day.pct}%`,
                              backgroundColor: day.pct >= 80 ? "var(--success)" : day.pct >= 50 ? "var(--warning)" : "var(--destructive)",
                            }}
                          />
                        </div>
                        <div className="w-14 shrink-0 text-right text-xs font-medium tabular-nums">
                          {day.done}/{day.total} ({day.pct}%)
                        </div>
                      </>
                    )}
                    {day.note.trim() && (
                      <span title={day.note} className="text-xs text-primary cursor-default">📝</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* This week's journal entries */}
          {journalDaysThisWeek.length > 0 && (
            <div className="card-glass rounded-2xl p-5">
              <h4 className="text-sm font-semibold mb-3">This Week's Journal Entries</h4>
              <div className="space-y-3">
                {journalDaysThisWeek.map((day) => (
                  <div key={day.date} className="rounded-xl border border-border/40 bg-background/20 p-3">
                    <div className="text-xs font-semibold text-muted-foreground mb-1">{day.date} — {day.label}</div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{day.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly reflection textarea */}
          <div className="card-glass rounded-2xl p-5">
            <h4 className="text-sm font-semibold mb-2">Weekly Reflection</h4>
            <p className="text-xs text-muted-foreground mb-3">What worked? What didn't? What will you do differently next week?</p>
            <WeeklyReflection weekDays={weekDays} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="card-glass rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Journal</h3>
              <DatePicker value={date} onChange={setDate} align="end" />
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search journal entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/40 pl-9 pr-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="How did today go? What went well?"
              className="min-h-[240px] w-full resize-y rounded-xl border border-border bg-background/40 p-4 text-sm outline-none focus:border-primary"
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setNote(date, "");
                  setText("");
                }}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-destructive/60"
              >
                Clear
              </button>
              <button
                onClick={() => setNote(date, text)}
                className="rounded-lg gradient-brand px-3 py-1.5 text-xs font-semibold text-white shadow"
              >
                Save
              </button>
            </div>
          </div>
          <div className="card-glass rounded-2xl p-5">
            <h4 className="mb-3 text-sm font-semibold">Recent Entries</h4>
            {recent.length === 0 ? (
              <p className="text-xs text-muted-foreground">No entries yet.</p>
            ) : (
              <ul className="space-y-2">
                {recent.map(([d, t]) => (
                  <li key={d}>
                   <button
                     onClick={() => setDate(d)}
                     className={`w-full rounded-lg border p-2 text-left text-xs hover:border-primary/40 ${d === date ? "border-primary bg-primary/5" : "border-border bg-background/30"}`}
                   >
                     <div className="font-semibold">{d}</div>
                     <div className="line-clamp-2 text-muted-foreground">
                       {searchQuery ? (
                         <span dangerouslySetInnerHTML={{
                           __html: t.replace(
                             new RegExp(searchQuery, "gi"),
                             match => `<span class="bg-amber/20 text-amber">${match}</span>`,
                           ),
                         }} />
                       ) : t}
                     </div>
                   </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
