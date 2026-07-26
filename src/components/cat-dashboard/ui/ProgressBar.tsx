interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  className?: string;
}

export function ProgressBar({
  value,
  color = "var(--amber)",
  height = 4,
  className = "",
}: ProgressBarProps) {
  return (
    <div
      className={className}
      style={{ height, background: "var(--bg-raised)", borderRadius: 99, overflow: "hidden" }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: color,
          borderRadius: 99,
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}

interface SegmentedBarProps {
  segments: { pct: number; color: string; label?: string }[];
  todayPct?: number;
  height?: number;
}

export function SegmentedBar({ segments, todayPct, height = 8 }: SegmentedBarProps) {
  return (
    <div
      style={{
        height,
        background: "var(--bg-raised)",
        borderRadius: 99,
        overflow: "visible",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", height: "100%", overflow: "hidden", borderRadius: 99 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ width: `${s.pct}%`, background: s.color, height: "100%" }} />
        ))}
      </div>
      {todayPct !== undefined && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${todayPct}%`,
            transform: "translate(-50%, -50%)",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "var(--text-primary)",
            border: "2px solid var(--bg-deep)",
            zIndex: 2,
          }}
          title="Today"
        />
      )}
    </div>
  );
}
