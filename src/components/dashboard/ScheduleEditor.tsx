import { useState } from "react";
import type { Schedule, ScheduleType } from "@/lib/habits-store";
import { DatePicker } from "./DatePicker";

const DOW = [
  { d: 1, l: "M" }, { d: 2, l: "T" }, { d: 3, l: "W" }, { d: 4, l: "T" },
  { d: 5, l: "F" }, { d: 6, l: "S" }, { d: 0, l: "S" },
];

interface Props {
  value: Schedule;
  onChange: (s: Schedule) => void;
}

export function ScheduleEditor({ value, onChange }: Props) {
  const [type, setTypeState] = useState<ScheduleType>(value.type);
  const setType = (t: ScheduleType) => {
    setTypeState(t);
    if (t === "daily") onChange({ type: "daily" });
    else if (t === "weekdays") onChange({ type: "weekdays", weekdays: value.weekdays ?? [1, 2, 3, 4, 5] });
    else if (t === "weekly") onChange({ type: "weekly", weekdays: value.weekdays ?? [1] });
    else if (t === "monthly") onChange({ type: "monthly", monthDay: value.monthDay ?? 1 });
    else if (t === "oneoff") onChange({ type: "oneoff", date: value.date ?? new Date().toISOString().slice(0, 10) });
  };

  const toggleDay = (d: number) => {
    const cur = new Set(value.weekdays ?? []);
    cur.has(d) ? cur.delete(d) : cur.add(d);
    onChange({ ...value, weekdays: Array.from(cur).sort() });
  };

  const setSingleDay = (d: number) => onChange({ ...value, weekdays: [d] });

  const opts: { v: ScheduleType; l: string }[] = [
    { v: "daily", l: "Daily" },
    { v: "weekdays", l: "Weekdays" },
    { v: "weekly", l: "Weekly" },
    { v: "monthly", l: "Monthly" },
    { v: "oneoff", l: "One-off" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {opts.map((o) => (
          <button
            key={o.v} type="button" onClick={() => setType(o.v)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${type === o.v ? "border-primary bg-primary/15 text-primary" : "border-border bg-background hover:border-primary/40"}`}
          >
            {o.l}
          </button>
        ))}
      </div>

      {type === "weekdays" && (
        <div className="flex flex-wrap gap-1.5">
          {DOW.map(({ d, l }) => {
            const active = (value.weekdays ?? []).includes(d);
            return (
              <button
                key={d} type="button" onClick={() => toggleDay(d)}
                className={`h-8 w-8 rounded-lg border text-xs font-semibold transition ${active ? "border-primary bg-primary/15 text-primary" : "border-border bg-background hover:border-primary/40"}`}
              >
                {l}
              </button>
            );
          })}
        </div>
      )}

      {type === "weekly" && (
        <div className="flex flex-wrap gap-1.5">
          {DOW.map(({ d, l }) => {
            const active = (value.weekdays ?? [1])[0] === d;
            return (
              <button
                key={d} type="button" onClick={() => setSingleDay(d)}
                className={`h-8 w-8 rounded-lg border text-xs font-semibold transition ${active ? "border-primary bg-primary/15 text-primary" : "border-border bg-background hover:border-primary/40"}`}
              >
                {l}
              </button>
            );
          })}
        </div>
      )}

      {type === "monthly" && (
        <div className="flex items-center gap-2">
          <select
            value={value.monthDay === "last" ? "last" : String(value.monthDay ?? 1)}
            onChange={(e) => onChange({ ...value, monthDay: e.target.value === "last" ? "last" : parseInt(e.target.value, 10) })}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {Array.from({ length: 28 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>{ordinal(i + 1)} of month</option>
            ))}
            <option value="last">Last day of month</option>
          </select>
        </div>
      )}

      {type === "oneoff" && (
        <DatePicker value={value.date ?? new Date().toISOString().slice(0, 10)} onChange={(d) => onChange({ ...value, date: d })} />
      )}
    </div>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
