import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useHabits, setMetric, todayISO, daysAgoISO, type DailyMetrics } from "@/lib/habits-store";
import { DatePicker } from "./DatePicker";

interface Cfg {
  key: keyof DailyMetrics;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  color: string;
  emoji?: string;
}

export function MetricTracker({ cfg }: { cfg: Cfg }) {
  const s = useHabits();
  const [date, setDate] = useState(todayISO());
  const [val, setVal] = useState<string>("");

  useEffect(() => {
    const v = s.metrics[date]?.[cfg.key];
    setVal(v === undefined ? "" : String(v));
  }, [date, s.metrics, cfg.key]);

  const data = Array.from({ length: 30 }).map((_, i) => {
    const iso = daysAgoISO(29 - i);
    const v = s.metrics[iso]?.[cfg.key];
    return { day: iso.slice(5), value: typeof v === "number" ? v : null };
  });

  const values = data.map((d) => d.value).filter((v): v is number => typeof v === "number");
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  const save = () => {
    const num = parseFloat(val);
    setMetric(date, cfg.key, Number.isFinite(num) ? num : undefined);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="card-glass min-w-0 rounded-2xl p-6">
        <h3 className="mb-1 text-lg font-semibold">
          {cfg.emoji} {cfg.label} Tracker
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Log your {cfg.label.toLowerCase()} in {cfg.unit}.
        </p>

        <div className="block text-xs">
          <div className="mb-1 text-muted-foreground">Date</div>
          <DatePicker value={date} onChange={setDate} size="md" className="w-full" />
        </div>

        <label className="mt-3 block text-xs">
          <div className="mb-1 text-muted-foreground">
            {cfg.label} ({cfg.unit})
          </div>
          <input
            type="number"
            min={cfg.min}
            max={cfg.max}
            step={cfg.step}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>

        <div className="mt-4 flex gap-2">
          <button
            onClick={save}
            className="flex-1 rounded-lg gradient-brand px-3 py-2 text-xs font-semibold text-white shadow"
          >
            Save
          </button>
          <button
            onClick={() => {
              setMetric(date, cfg.key, undefined);
              setVal("");
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:border-destructive/60"
          >
            Clear
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-background/40 p-4">
          <div className="text-xs text-muted-foreground">30-day average</div>
          <div className="mt-1 text-2xl font-bold">
            {avg ? avg.toFixed(1) : "—"}{" "}
            <span className="text-sm font-normal text-muted-foreground">{cfg.unit}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">{values.length} entries logged</div>
        </div>
      </div>

      <div className="card-glass min-w-0 rounded-2xl p-6">
        <h4 className="mb-4 text-sm font-semibold">Last 30 Days</h4>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="oklch(0.3 0.02 265)" strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tick={{ fill: "oklch(0.6 0.02 260)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[cfg.min, cfg.max]}
                tick={{ fill: "oklch(0.6 0.02 260)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.24 0.025 265)",
                  border: "1px solid oklch(0.32 0.03 265)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={cfg.color}
                strokeWidth={2.5}
                dot={{ r: 3, fill: cfg.color }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export const MOOD_CFG: Cfg = {
  key: "mood",
  label: "Mood",
  unit: "1-5",
  min: 1,
  max: 5,
  step: 1,
  color: "oklch(0.68 0.22 350)",
  emoji: "😊",
};
export const SLEEP_CFG: Cfg = {
  key: "sleep",
  label: "Sleep",
  unit: "hours",
  min: 0,
  max: 12,
  step: 0.5,
  color: "oklch(0.68 0.19 275)",
  emoji: "🌙",
};
export const WATER_CFG: Cfg = {
  key: "water",
  label: "Water",
  unit: "glasses",
  min: 0,
  max: 20,
  step: 1,
  color: "oklch(0.72 0.18 235)",
  emoji: "💧",
};
export const WEIGHT_CFG: Cfg = {
  key: "weight",
  label: "Weight",
  unit: "kg",
  min: 30,
  max: 200,
  step: 0.1,
  color: "oklch(0.72 0.18 155)",
  emoji: "⚖️",
};
