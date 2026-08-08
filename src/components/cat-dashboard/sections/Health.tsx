import { useState } from "react";
import { motion } from "framer-motion";
import { HEALTH_CARDS } from "../data/static";
import { useKV } from "../bridge";
import { useHabits, todayISO } from "@/lib/habits-store";

const ICONS: Record<string, string> = {
  SLEEP: "😴",
  CAFFEINE: "☕",
  MOVEMENT: "🏃",
  EYES: "👁️",
  FOOD: "🥗",
  HYDRATION: "💧",
  PEOPLE: "👥",
  RESET: "🌬️",
  "GUT-CHECK": "📋",
};

export default function Health() {
  const s = useHabits();
  const today = todayISO();
  const { value: focusLog } = useKV<{ sessions: { date: string; subject: string; durationMins: number }[] }>("focus_log", { sessions: [] });
  
  const [showProtocols, setShowProtocols] = useState(false);

  const todayMetrics = s.metrics[today] || {};
  
  // Get last 14 days of ISO date strings
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }).reverse();

  // For each day, get: sleep, mood, water, total focus minutes
  const dayData = last14Days.map((date) => {
    const metrics = s.metrics[date] || {};
    const focusMins = (focusLog.sessions || [])
      .filter((session) => session.date === date)
      .reduce((sum, session) => sum + session.durationMins, 0);
    return {
      date,
      sleep: metrics.sleep ?? null,
      mood: metrics.mood ?? null,
      water: metrics.water ?? null,
      focusMins,
    };
  });

  // Insight 1: Average focus minutes on days with sleep >= 7 vs < 7
  const goodSleepDays = dayData.filter((d) => d.sleep !== null && d.sleep >= 7);
  const poorSleepDays = dayData.filter((d) => d.sleep !== null && d.sleep < 7);
  const avgFocusGoodSleep = goodSleepDays.length
    ? Math.round(goodSleepDays.reduce((sum, d) => sum + d.focusMins, 0) / goodSleepDays.length)
    : null;
  const avgFocusPoorSleep = poorSleepDays.length
    ? Math.round(poorSleepDays.reduce((sum, d) => sum + d.focusMins, 0) / poorSleepDays.length)
    : null;

  // Insight 2: Average focus minutes on days with mood >= 4 vs < 4
  const highMoodDays = dayData.filter((d) => d.mood !== null && d.mood >= 4);
  const lowMoodDays = dayData.filter((d) => d.mood !== null && d.mood < 4);
  const avgFocusHighMood = highMoodDays.length
    ? Math.round(highMoodDays.reduce((sum, d) => sum + d.focusMins, 0) / highMoodDays.length)
    : null;
  const avgFocusLowMood = lowMoodDays.length
    ? Math.round(lowMoodDays.reduce((sum, d) => sum + d.focusMins, 0) / lowMoodDays.length)
    : null;

  // Insight 3: 7-day trend for sleep and water
  const last7 = dayData.slice(-7);
  const sleep7Data = last7.filter((d) => d.sleep !== null);
  const water7Data = last7.filter((d) => d.water !== null);
  
  const avgSleep7 = sleep7Data.length
    ? (sleep7Data.reduce((sum, d) => sum + (d.sleep ?? 0), 0) / sleep7Data.length).toFixed(1)
    : null;
  const avgWater7 = water7Data.length
    ? (water7Data.reduce((sum, d) => sum + (d.water ?? 0), 0) / water7Data.length).toFixed(1)
    : null;

  const todayFocusMins = (focusLog.sessions || [])
    .filter((session) => session.date === today)
    .reduce((sum, session) => sum + session.durationMins, 0);

  return (
    <section id="health" className="section">
      <div style={{ marginBottom: 20 }}>
        <p className="section-eyebrow">Health vs Study</p>
        <h2 className="section-title">Performance Correlation</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
          How your health metrics impact your focus time (Last 14 Days)
        </p>
      </div>

      {/* Today's Health Status */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
          Today's Metrics
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
          <div className="card" style={{ padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>😴</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>Sleep</div>
            <div style={{ fontWeight: 600 }}>{todayMetrics.sleep != null ? `${todayMetrics.sleep} hrs` : "Not logged"}</div>
          </div>
          <div className="card" style={{ padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>{todayMetrics.mood != null ? ["😭","😞","😐","😊","🤩"][todayMetrics.mood - 1] : "😶"}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>Mood</div>
            <div style={{ fontWeight: 600 }}>{todayMetrics.mood != null ? `${todayMetrics.mood}/5` : "Not logged"}</div>
          </div>
          <div className="card" style={{ padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>💧</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>Water</div>
            <div style={{ fontWeight: 600 }}>{todayMetrics.water != null ? `${todayMetrics.water} L` : "Not logged"}</div>
          </div>
          <div className="card" style={{ padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>⚖️</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>Weight</div>
            <div style={{ fontWeight: 600 }}>{todayMetrics.weight != null ? `${todayMetrics.weight} kg` : "Not logged"}</div>
          </div>
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 8, textAlign: "right" }}>
          Log these in the Habit Dashboard → Health Metrics section
        </div>
      </div>

      {/* Correlation Insights */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
          Correlations
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
          
          <div className="card" style={{ padding: 16, borderLeft: "3px solid var(--lav)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span>😴</span>
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Sleep → Study</span>
            </div>
            {avgFocusGoodSleep !== null && avgFocusPoorSleep !== null ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  On 7h+ sleep nights: <strong>{avgFocusGoodSleep}m</strong> focus avg
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  On &lt;7h nights: <strong>{avgFocusPoorSleep}m</strong> focus avg
                </div>
                {avgFocusGoodSleep > avgFocusPoorSleep && (
                  <div style={{ display: "inline-block", alignSelf: "flex-start", padding: "2px 8px", borderRadius: 12, backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--teal)", fontSize: "0.75rem", fontWeight: 600, marginTop: 4 }}>
                    Sleep more = +{avgFocusGoodSleep - avgFocusPoorSleep}m focus
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Log more sleep and focus data to see correlation.
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 16, borderLeft: "3px solid var(--amber)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span>😊</span>
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Mood → Study</span>
            </div>
            {avgFocusHighMood !== null && avgFocusLowMood !== null ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  On high-mood days: <strong>{avgFocusHighMood}m</strong> focus avg
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  On low-mood days: <strong>{avgFocusLowMood}m</strong> focus avg
                </div>
                {avgFocusHighMood > avgFocusLowMood && (
                  <div style={{ display: "inline-block", alignSelf: "flex-start", padding: "2px 8px", borderRadius: 12, backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--teal)", fontSize: "0.75rem", fontWeight: 600, marginTop: 4 }}>
                    Better mood = +{avgFocusHighMood - avgFocusLowMood}m focus
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Log more mood and focus data to see correlation.
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 16, borderLeft: "3px solid var(--teal)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span>📊</span>
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>7-Day Averages</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Avg Sleep</span>
                <span style={{ fontWeight: 600, color: avgSleep7 && parseFloat(avgSleep7) >= 7 ? "var(--teal)" : "var(--amber)" }}>
                  {avgSleep7 ? `${avgSleep7}h` : "--"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Avg Water</span>
                <span style={{ fontWeight: 600, color: avgWater7 && parseFloat(avgWater7) >= 2 ? "var(--teal)" : "var(--amber)" }}>
                  {avgWater7 ? `${avgWater7}L` : "--"}
                </span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16, borderLeft: "3px solid var(--coral)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span>🎯</span>
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Today's Focus</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", paddingBottom: 16 }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--coral)" }}>
                {todayFocusMins}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                minutes
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Protocols (Original static content) */}
      <div>
        <button
          onClick={() => setShowProtocols(!showProtocols)}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px 16px",
            color: "var(--text-secondary)",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span>Health Protocols (Static)</span>
          <span>{showProtocols ? "▲" : "▼"}</span>
        </button>

        {showProtocols && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
              marginTop: 16,
            }}
          >
            {HEALTH_CARDS.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="card"
                style={{ padding: 18, borderLeft: "3px solid var(--lav)" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: "1.1rem" }}>{ICONS[card.title] || "💚"}</span>
                  <span
                    style={{
                      fontFamily: "Space Grotesk",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      color: "var(--lav)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {card.title}
                  </span>
                </div>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
