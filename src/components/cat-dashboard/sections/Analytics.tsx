import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import { supabase } from "../bridge";
import { useAuth } from "../bridge";
import { useKV } from "../bridge";
import type { ErrorEntry, MockResult, TopicProgress, DailyActivity, FocusLog } from "../types";

export default function Analytics() {
  const { user } = useAuth();
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [mocks, setMocks] = useState<MockResult[]>([]);
  const [topics, setTopics] = useState<TopicProgress[]>([]);
  const [activity, setActivity] = useState<DailyActivity[]>([]);
  const [tab, setTab] = useState<"overview" | "errors" | "mocks">("overview");

  const { value: focusLog } = useKV<FocusLog>("focus_log", { sessions: [] });

  const load = useCallback(async () => {
    if (!user) return;
    const [e, m, t, a] = await Promise.all([
      supabase.from("error_log").select("*").eq("user_id", user.id),
      supabase.from("mock_results").select("*").eq("user_id", user.id).order("date"),
      supabase.from("topic_progress").select("*").eq("user_id", user.id),
      supabase.from("daily_activity").select("*").eq("user_id", user.id).order("date").limit(30),
    ]);
    if (e.data) setErrors(e.data as ErrorEntry[]);
    if (m.data) setMocks(m.data as MockResult[]);
    if (t.data) setTopics(t.data as TopicProgress[]);
    if (a.data) setActivity(a.data as DailyActivity[]);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Error breakdown by cause
  const causeData = ["Concept Gap", "Silly Mistake", "Timing"].map((c) => ({
    name: c.replace(" ", "\n"),
    value: errors.filter((e) => e.cause === c).length,
  }));

  // Error breakdown by section
  const sectionData = (["VARC", "DILR", "QA"] as const).map((s) => ({
    name: s,
    value: errors.filter((e) => e.section === s).length,
  }));

  // Mock trend (Overall only)
  const mockTrend = mocks
    .filter((m) => m.section === "Overall" && m.net_score !== undefined)
    .map((m) => ({ date: m.date.slice(5), net: m.net_score, pct: m.percentile }));

  // Topic mastery radar
  const radarData = (["QA", "DILR", "VARC"] as const).map((s) => {
    const sec = topics.filter((t) => t.section === s);
    const mastered = sec.filter((t) => t.status === "Mastered").length;
    const done = sec.filter((t) =>
      ["Concept Done", "Practice Done", "Mastered"].includes(t.status),
    ).length;
    return { subject: s, Mastered: mastered, Progress: done, total: sec.length };
  });

  // 30-day activity
  const actData = activity.map((a) => ({ date: a.date.slice(5), score: a.score }));

  // Weekly study hours
  const weekSessions = (focusLog.sessions || []).filter((s) => {
    const d = new Date(s.date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 7;
  });
  const weekHours = weekSessions.reduce((sum, s) => sum + s.durationMins, 0) / 60;

  const CHART_COLORS = {
    "Concept Gap": "var(--coral)",
    "Silly Mistake": "var(--amber)",
    Timing: "var(--teal)",
  };

  const tooltipStyle = {
    contentStyle: {
      background: "var(--bg-raised)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      fontSize: "0.8rem",
    },
  };

  return (
    <section id="analytics" className="section">
      <div style={{ marginBottom: 20 }}>
        <p className="section-eyebrow">Tracking</p>
        <h2 className="section-title">Analytics</h2>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["overview", "errors", "mocks"] as const).map((t) => (
          <button
            key={t}
            className={`btn ${tab === t ? "btn-amber" : "btn-ghost"} btn-sm`}
            onClick={() => setTab(t)}
            style={{ textTransform: "capitalize" }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
            gap: 16,
          }}
        >
          {/* 30-day activity */}
          <div className="card" style={{ padding: 20 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: "0.85rem",
                marginBottom: 12,
                color: "var(--text-secondary)",
              }}
            >
              30-day Activity
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={actData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--text-muted)", fontSize: 9 }}
                  interval={4}
                />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="score" fill="var(--amber)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Weekly Study Hours Stat */}
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gridColumn: "1 / -1" }}>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 8 }}>
              Total Study Hours This Week
            </div>
            <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--amber)", fontFamily: "JetBrains Mono" }}>
              {weekHours.toFixed(1)}<span style={{ fontSize: "1.5rem", color: "var(--text-muted)" }}>h</span>
            </div>
          </div>

          {/* Topic radar */}
          <div className="card" style={{ padding: 20 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: "0.85rem",
                marginBottom: 12,
                color: "var(--text-secondary)",
              }}
            >
              Topic Mastery
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                />
                <Radar
                  dataKey="Mastered"
                  stroke="var(--amber)"
                  fill="var(--amber)"
                  fillOpacity={0.3}
                />
                <Radar
                  dataKey="Progress"
                  stroke="var(--teal)"
                  fill="var(--teal)"
                  fillOpacity={0.15}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "errors" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
            gap: 16,
          }}
        >
          {/* Cause breakdown */}
          <div className="card" style={{ padding: 20 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: "0.85rem",
                marginBottom: 12,
                color: "var(--text-secondary)",
              }}
            >
              By Root Cause
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={causeData} layout="vertical" margin={{ left: 20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
                  width={90}
                />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {causeData.map((_, i) => (
                    <rect key={i} fill={["var(--coral)", "var(--amber)", "var(--teal)"][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Section breakdown */}
          <div className="card" style={{ padding: 20 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: "0.85rem",
                marginBottom: 12,
                color: "var(--text-secondary)",
              }}
            >
              By Section
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={sectionData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" fill="var(--lav)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "mocks" && (
        <div className="card" style={{ padding: 20 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: "0.85rem",
              marginBottom: 12,
              color: "var(--text-secondary)",
            }}
          >
            Mock Trend — Net Score (Overall)
          </div>
          {mockTrend.length < 2 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "20px 0" }}>
              Log at least 2 overall mocks to see trend.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={mockTrend} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Line
                  dataKey="net"
                  stroke="var(--amber)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--amber)" }}
                  name="Net Score"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </section>
  );
}
