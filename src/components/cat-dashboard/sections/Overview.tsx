import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DATE_CFG, REG_START, REG_END, REG_URGENT } from "../data/dates";
import { getStatus, getCampaignProgress, pad2 } from "../engine/schedule";
import { useKV } from "../bridge";
import { useAuth } from "../bridge";
import { supabase } from "../bridge";
import { SegmentedBar } from "../ui/ProgressBar";
import type { BreathLog, MeditateLog } from "../types";
import { CHECKLIST } from "../data/static";
import {
  useHabits,
  habitsFor,
  todayISO,
  completionsForDate,
} from "@/lib/habits-store";
import { HabitRowConnected } from "@/components/dashboard/HabitRow";
import { filterHabitsByScope } from "@/lib/scope";

export default function Overview() {
  const { user } = useAuth();
  const habitState = useHabits();
  const today = todayISO();
  const [diff, setDiff] = useState(0);
  const [pct, setPct] = useState(0);
  const [dayNum, setDayNum] = useState(0);
  const [phase, setPhase] = useState("");
  const [errorCount, setErrorCount] = useState(0);
  const [lastMockScore, setLastMockScore] = useState<number | null>(null);

  const { value: breathLog } = useKV<BreathLog>("breath_log", {
    streak: 0,
    total: 0,
    lastDate: "",
  });
  const { value: medLog } = useKV<MeditateLog>("meditate_log", {
    streak: 0,
    total: 0,
    totalMinutes: 0,
    lastDate: "",
  });
  const { value: checklist } = useKV<any[]>("checklist_v2", []);
  const { value: regStatus, setValue: setRegStatus } = useKV<{ registered: boolean }>("cat_registration", { registered: false });
  const { value: activeContingency } = useKV<string | null>("active_contingency", null);

  // Countdown
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setDiff(Math.max(0, DATE_CFG.EXAM_DATE.getTime() - now.getTime()));
      const { pct: p, dayNum: dn } = getCampaignProgress(DATE_CFG, now);
      setPct(p);
      setDayNum(dn);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      setPhase(getStatus(today, DATE_CFG).phase);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Error count
  useEffect(() => {
    if (!user) return;
    const fetchErrors = () => {
      supabase
        .from("error_log")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .then(({ count }: { count: number | null }) => setErrorCount(count || 0));
    };
    fetchErrors();
    window.addEventListener("focus", fetchErrors);
    return () => window.removeEventListener("focus", fetchErrors);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchLastMock = () => {
      (supabase as any)
        .from("mock_tests")
        .select("total_score")
        .order("date", { ascending: false })
        .limit(1)
        .then(({ data }: { data: any[] | null }) => {
          if (data && data.length > 0) {
            setLastMockScore(data[0].total_score);
          }
        });
    };
    fetchLastMock();
  }, [user]);

  const d = Math.floor(diff / 86400000);
  const h = pad2(Math.floor((diff % 86400000) / 3600000));
  const m = pad2(Math.floor((diff % 3600000) / 60000));
  const s = pad2(Math.floor((diff % 60000) / 1000));

  const checkDone = checklist.filter((c) => c.done).length;
  const checkTotal = checklist.length;

  // Campaign segments
  const totalDays = 154;
  const p1End = Math.round(
    (new Date(2026, 7, 14).getTime() - DATE_CFG.CAMPAIGN_START.getTime()) / 86400000,
  );
  const p2End = Math.round(
    (new Date(2026, 9, 1).getTime() - DATE_CFG.CAMPAIGN_START.getTime()) / 86400000,
  );
  const segments = [
    { pct: (p1End / totalDays) * 100, color: "var(--coral)", label: "Phase 1" },
    { pct: ((p2End - p1End) / totalDays) * 100, color: "var(--teal)", label: "Phase 2" },
    { pct: ((totalDays - p2End) / totalDays) * 100, color: "var(--amber)", label: "Phase 3" },
  ];

  const catHabits = filterHabitsByScope(habitsFor(habitState, today), "cat");
  const catDone = catHabits.filter((h) => !!habitState.completions[today]?.[h.id]).length;
  const catTotal = catHabits.length;
  const catPct = catTotal > 0 ? Math.round((catDone / catTotal) * 100) : 0;

  const metrics = [
    { label: "Last Mock", value: lastMockScore !== null ? String(lastMockScore) : "--", icon: "📊", color: "var(--amber)" },
    { label: "Breath Streak", value: `${breathLog.streak}d`, icon: "🌬️", color: "var(--lav)" },
    { label: "Med Minutes", value: `${medLog.totalMinutes}m`, icon: "🧘", color: "var(--teal)" },
    { label: "Errors Logged", value: String(errorCount), icon: "🔍", color: "var(--coral)" },
  ];

  // Circular ring around days
  const ringPct = pct;
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const dashOffset = circ * (1 - ringPct / 100);

  return (
    <section id="overview" className="section">
      {activeContingency && (
        <div style={{
          padding: "12px 16px",
          background: "rgba(255, 69, 58, 0.1)",
          border: "1px solid var(--coral)",
          borderRadius: 8,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <span style={{ fontSize: "1.2rem" }}>🚨</span>
          <div>
            <div style={{ color: "var(--coral)", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Contingency Protocol Active</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: 2 }}>{activeContingency} — Requirements scaled down.</div>
          </div>
        </div>
      )}
      <div style={{ marginBottom: 20 }}>
        <p className="section-eyebrow">Command Center</p>
        <h2 className="section-title">Overview</h2>
      </div>

      {/* ── CAT Registration Banner ── */}
      {(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const isInRegWindow = today >= REG_START && today <= REG_END;
        const isUrgent = today >= REG_URGENT;
        const daysLeft = Math.ceil((REG_END.getTime() - today.getTime()) / 86400000);
        const showRegBanner = isInRegWindow && !regStatus.registered;
        if (!showRegBanner) return null;
        return (
          <div
            style={{
              marginBottom: 20,
              padding: "14px 18px",
              borderRadius: 12,
              border: `1.5px solid ${isUrgent ? "var(--coral)" : "var(--amber)"}`,
              background: isUrgent ? "rgba(255,100,80,0.08)" : "rgba(232,162,61,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {isUrgent && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--coral)",
                    flexShrink: 0,
                    animation: "pulse 1.5s infinite",
                  }}
                />
              )}
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: isUrgent ? "var(--coral)" : "var(--amber)",
                  }}
                >
                  {isUrgent ? "⚠️ CAT Registration Closes Soon!" : "📋 CAT 2026 Registration is Open"}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {isUrgent
                    ? `Only ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left — register at iimcat.ac.in before Sep 20`
                    : `Window open now. Closes in ${daysLeft} days (Sep 20, 2026)`}
                </div>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{
                color: isUrgent ? "var(--coral)" : "var(--amber)",
                border: `1px solid ${isUrgent ? "var(--coral)" : "var(--amber)"}`,
                flexShrink: 0,
              }}
              onClick={() => setRegStatus({ registered: true })}
            >
              Mark as Registered ✓
            </button>
          </div>
        );
      })()}

      {/* Countdown + progress row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        {/* Circular ring + days */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}
        >
          <svg width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke="var(--bg-raised)"
              strokeWidth="5"
            />
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke="var(--amber)"
              strokeWidth="5"
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "Space Grotesk",
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--amber)",
                lineHeight: 1,
              }}
            >
              {d}
            </span>
            <span
              style={{
                fontSize: "0.65rem",
                color: "var(--text-muted)",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              days
            </span>
          </div>
        </motion.div>

        {/* Right side: HH:MM:SS + progress bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            {[
              { v: h, l: "hrs" },
              { v: m, l: "min" },
              { v: s, l: "sec" },
            ].map(({ v, l }) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "JetBrains Mono",
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    lineHeight: 1,
                  }}
                >
                  {v}
                </div>
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {l}
                </div>
              </div>
            ))}
            <div style={{ marginLeft: 8 }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                until CAT 2026
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--amber)", fontWeight: 500 }}>
                Day {dayNum} • {phase}
              </div>
            </div>
          </div>

          {/* Campaign progress bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <SegmentedBar segments={segments} todayPct={pct} height={8} />
            <div
              style={{ display: "flex", gap: 12, fontSize: "0.72rem", color: "var(--text-muted)" }}
            >
              <span style={{ color: "var(--coral)" }}>● Phase 1</span>
              <span style={{ color: "var(--teal)" }}>● Phase 2</span>
              <span style={{ color: "var(--amber)" }}>● Phase 3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 12,
        }}
      >
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card"
            style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "1rem" }}>{m.icon}</span>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 600,
                }}
              >
                {m.label}
              </span>
            </div>
            <div
              style={{
                fontFamily: "Space Grotesk",
                fontSize: "1.8rem",
                fontWeight: 700,
                color: m.color,
                lineHeight: 1,
              }}
            >
              {m.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Today's CAT Prep Habits ── */}
      <div style={{ marginTop: 28, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div>
            <p className="section-eyebrow" style={{ marginBottom: 0 }}>
              Today's CAT Prep
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>
              {catDone}/{catTotal} habits done
            </p>
          </div>
          {catTotal > 0 && (
            <span
              style={{
                fontSize: "0.8rem",
                color: catPct >= 80 ? "var(--teal)" : "var(--amber)",
                fontWeight: 700,
              }}
            >
              {catPct}%
            </span>
          )}
        </div>

        {catTotal === 0 ? (
          <div
            className="card"
            style={{
              padding: "14px 16px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.83rem",
            }}
          >
            No CAT Prep habits yet.{" "}
            <span style={{ color: "var(--amber)" }}>
              Add habits with category "CAT Prep" in the Habit Tracker.
            </span>
          </div>
        ) : (
          <>
            <div
              style={{
                height: 4,
                background: "var(--bg-raised)",
                borderRadius: 99,
                overflow: "hidden",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${catPct}%`,
                  background: "var(--amber)",
                  borderRadius: 99,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {catHabits.map((h) => (
                <HabitRowConnected key={h.id} habit={h} dateISO={today} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
