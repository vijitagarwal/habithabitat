import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { computeRightNow, resolveBlock } from "../engine/schedule";
import { DATE_CFG } from "../data/dates";
import { BLOCK_COLORS } from "../engine/schedule";
import { useAuth, supabase } from "../bridge";
import { useHabits, habitsFor, todayISO } from "@/lib/habits-store";

export default function RightNow() {
  const { user } = useAuth();
  const habitState = useHabits();
  const today = todayISO();
  
  const [data, setData] = useState(() => computeRightNow(DATE_CFG));
  const [expanded, setExpanded] = useState<number | null>(null);
  const [weakestTopic, setWeakestTopic] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState<number>(0);

  useEffect(() => {
    const id = setInterval(() => setData(computeRightNow(DATE_CFG)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadAgentContext = async () => {
      const { data: topics } = await supabase
        .from("topic_progress")
        .select("topic_name, confidence, status")
        .eq("user_id", user.id)
        .neq("status", "Mastered")
        .order("confidence", { ascending: true })
        .limit(1);
      
      if (topics && topics.length > 0) {
        setWeakestTopic(topics[0].topic_name);
      }

      const { count } = await supabase
        .from("error_log")
        .select("id", { count: "exact" })
        .eq("user_id", user.id);
      
      setErrorCount(count || 0);
    };
    loadAgentContext();
  }, [user]);

  const getSmartRecommendation = () => {
    const hour = new Date().getHours();
    
    // Morning (6am–12pm)
    if (hour >= 6 && hour < 12) {
      const pendingHabits = habitsFor(habitState, today).filter(h => !habitState.completions[today]?.[h.id]);
      if (pendingHabits.length > 0) {
        return {
          title: "Morning Priorities",
          desc: `You have ${pendingHabits.length} habits pending for today. Knock out a quick one now!`,
          action: "Go to Habit Tracker",
          tool: "habit"
        };
      }
      return {
        title: "Morning Deep Work",
        desc: `Habits look good. Time to tackle your weakest area: ${weakestTopic || "a mock test"}.`,
        action: "Start Focus Timer",
        tool: "timer"
      };
    }
    
    // Afternoon (12pm–6pm)
    if (hour >= 12 && hour < 18) {
      return {
        title: "Afternoon Focus",
        desc: `Energy dips in the afternoon. Let's do a structured focus session on ${weakestTopic || "VARC"}.`,
        action: "Start Focus Timer",
        tool: "timer"
      };
    }
    
    // Evening (6pm–10pm)
    if (hour >= 18 && hour < 22) {
      if (errorCount > 0) {
        return {
          title: "Evening Review",
          desc: `You have ${errorCount} errors logged. Review them now to solidify your concepts.`,
          action: "Review Error Log",
          tool: "error"
        };
      }
      return {
        title: "Evening Wind Down",
        desc: "Log your health metrics and take a moment to breathe.",
        action: "Open Breathwork",
        tool: "breath"
      };
    }
    
    // Night (10pm–6am)
    return {
      title: "Night Routine",
      desc: "Prepare for tomorrow. Plan your schedule, wind down, and get to sleep.",
      action: "Sleep Protocol",
      tool: "sleep"
    };
  };

  const scrollToTool = useCallback((tool: string) => {
    if (tool === "breath" || tool === "sleep") {
      document.getElementById("breathe")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (tool === "error") {
      document.getElementById("errors")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      document.getElementById("rightnow")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  if (!data) {
    return (
      <section id="rightnow" className="section">
        <p style={{ color: "var(--text-muted)" }}>Schedule not available.</p>
      </section>
    );
  }

  const { sched, idx, current, resolved, remain, elapsedPct, nextBlock, nextDate, accent, fmtRemain } = data;
  const recommendation = getSmartRecommendation();

  return (
    <section id="rightnow" className="section">
      <div style={{ marginBottom: 16 }}>
        <p className="section-eyebrow">Agentic Assistant</p>
        <h2 className="section-title">Right Now</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: 20 }}>
        
        {/* Smart Recommendation Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card"
          style={{ padding: 20, borderColor: "var(--amber)", borderWidth: 2, gridColumn: "1 / -1", background: "rgba(232, 162, 61, 0.05)" }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--amber)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Smart Suggestion
              </div>
              <h3 style={{ fontFamily: "Space Grotesk", fontSize: "1.2rem", color: "var(--text-primary)", margin: 0 }}>
                {recommendation.title}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: "6px 0 0" }}>
                {recommendation.desc}
              </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <button
                className="btn btn-sm"
                onClick={() => scrollToTool(recommendation.tool)}
                style={{ background: "var(--amber)", color: "#000", fontWeight: 600 }}
              >
                {recommendation.action}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Current block card */}
        <motion.div
          key={`block-${idx}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card"
          style={{ padding: 20, borderColor: accent, borderWidth: 2, gridColumn: "1 / -1" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: accent,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 4,
                }}
              >
                Schedule Block · {current.s}–{current.e}
              </div>
              <h3
                style={{
                  fontFamily: "Space Grotesk",
                  fontSize: "1.2rem",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                {resolved.t}
              </h3>
              <p
                style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: "6px 0 0" }}
              >
                {resolved.d}
              </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: accent,
                }}
              >
                {fmtRemain}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                Up next:{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {nextBlock.s} {resolveBlock(nextBlock, nextDate, DATE_CFG).t}
                </strong>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 5,
              background: "var(--bg-raised)",
              borderRadius: 99,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${elapsedPct}%`,
                background: accent,
                borderRadius: 99,
                transition: "width 1s linear",
              }}
            />
          </div>

          {/* Open tool button */}
          {current.tool && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => scrollToTool(current.tool!)}
              style={{ borderColor: accent, color: accent }}
            >
              {current.tool === "breath" ? "🌬️ Open breathwork" : "🧘 Open meditation"}
            </button>
          )}
        </motion.div>

        {/* Full-day timeline */}
        <div
          className="card"
          style={{
            padding: "16px 4px",
            gridColumn: "1 / -1",
            maxHeight: 420,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: "0 12px 8px",
              fontWeight: 600,
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Today's Schedule
          </div>
          {sched.map((block, i) => {
            const r = resolveBlock(block, data.today, DATE_CFG);
            const isNow = i === idx;
            const isPast = i < idx;
            const isOpen = expanded === i;
            const bColor = BLOCK_COLORS[block.c] || "#6B7A8D";

            return (
              <div key={i}>
                <div
                  className={`tl-item ${isNow ? "now" : ""} ${isPast ? "done" : ""}`}
                  onClick={() => setExpanded(isOpen ? null : i)}
                  style={{
                    borderLeft: isNow ? `3px solid ${bColor}` : "3px solid transparent",
                    margin: "2px 8px",
                    borderRadius: 8,
                  }}
                >
                  <span className="tl-time">{block.s}</span>
                  <div style={{ flex: 1 }}>
                    <div className="tl-title">{r.t}</div>
                    {!isOpen && r.d && <div className="tl-desc">{r.d}</div>}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", flexShrink: 0 }}>
                    {isNow ? "▶" : isOpen ? "▲" : "▼"}
                  </span>
                </div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: "hidden", padding: "0 16px 12px 68px" }}
                    >
                      <p
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.85rem",
                          lineHeight: 1.6,
                          margin: 0,
                        }}
                      >
                        {r.d || "No additional description."}
                      </p>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 8,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: bColor + "22",
                          color: bColor,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                        }}
                      >
                        {block.s}–{block.e} · {block.c.toUpperCase()}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
