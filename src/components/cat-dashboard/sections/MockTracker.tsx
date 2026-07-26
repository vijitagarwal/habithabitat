import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "../bridge";
import { useAuth } from "../bridge";
import { useRealtime } from "../bridge";
import { useActivity } from "../bridge";
import { useToast } from "../bridge";
import { Modal } from "../ui/Modal";
import type { MockResult } from "../types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

const EMPTY: Omit<MockResult, "id" | "user_id" | "created_at"> = {
  date: new Date().toISOString().slice(0, 10),
  mock_number: undefined,
  mock_type: "DashCAT",
  section: "Overall",
  attempted: undefined,
  correct: undefined,
  incorrect: undefined,
  net_score: undefined,
  percentile: undefined,
  time_taken: undefined,
  notes: "",
};

export default function MockTracker() {
  const { user } = useAuth();
  const { markActivity } = useActivity();
  const { addToast } = useToast();
  const [mocks, setMocks] = useState<MockResult[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [chartSection, setChartSection] = useState<MockResult["section"]>("Overall");

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("mock_results")
      .select("*")
      .eq("user_id", user.id)
      .order("date");
    if (data) setMocks(data as MockResult[]);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);
  useRealtime("mock_results", load);

  const save = async () => {
    if (!user || !form.date) return;
    const row = { ...form, user_id: user.id };
    if (editId) {
      await supabase.from("mock_results").update(row).eq("id", editId);
      addToast("Mock updated");
    } else {
      await supabase.from("mock_results").insert(row);
      addToast("Mock logged! 📝");
      markActivity(3);
    }
    setShowForm(false);
    setEditId(null);
    setForm({ ...EMPTY });
    load();
  };

  const del = async (id: string) => {
    await supabase.from("mock_results").delete().eq("id", id);
    setMocks((m) => m.filter((x) => x.id !== id));
    addToast("Entry deleted");
  };

  const openEdit = (m: MockResult) => {
    setEditId(m.id!);
    setForm({
      date: m.date,
      mock_number: m.mock_number,
      mock_type: m.mock_type,
      section: m.section,
      attempted: m.attempted,
      correct: m.correct,
      incorrect: m.incorrect,
      net_score: m.net_score,
      percentile: m.percentile,
      time_taken: m.time_taken,
      notes: m.notes || "",
    });
    setShowForm(true);
  };

  // Chart data — filter by section, take net_score or percentile
  const chartData = mocks
    .filter((m) => m.section === chartSection)
    .map((m) => ({
      date: m.date.slice(5),
      net_score: m.net_score,
      percentile: m.percentile,
      label: `Mock ${m.mock_number || ""}`,
    }));

  const latestOverall = mocks.filter((m) => m.section === "Overall").slice(-1)[0];
  const totalMocks = mocks.filter((m) => m.section === "Overall").length;

  return (
    <section id="mocks" className="section">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <p className="section-eyebrow">Tracking</p>
          <h2 className="section-title">Mock Tracker</h2>
        </div>
        <button
          id="add-mock"
          className="btn btn-amber btn-sm"
          onClick={() => {
            setShowForm(true);
            setEditId(null);
            setForm({ ...EMPTY });
          }}
        >
          + Log mock
        </button>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: "Mocks done", value: totalMocks, color: "var(--amber)" },
          {
            label: "Latest net score",
            value: latestOverall?.net_score ?? "--",
            color: "var(--teal)",
          },
          {
            label: "Latest %ile",
            value: latestOverall?.percentile ? `${latestOverall.percentile}` : "--",
            color: "var(--lav)",
          },
          { label: "Target mocks", value: "50+", color: "var(--coral)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: "12px 16px" }}>
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 600,
              }}
            >
              {label}
            </div>
            <div
              style={{ fontFamily: "Space Grotesk", fontSize: "1.6rem", fontWeight: 700, color }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Section:
            </span>
            {(["Overall", "VARC", "DILR", "QA"] as const).map((s) => (
              <button
                key={s}
                className={`btn ${chartSection === s ? "btn-amber" : "btn-ghost"} btn-sm`}
                onClick={() => setChartSection(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: "0.8rem",
                }}
              />
              <Line
                dataKey="net_score"
                stroke="var(--amber)"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Net Score"
              />
              {chartSection === "Overall" && (
                <ReferenceLine
                  y={99}
                  stroke="var(--coral)"
                  strokeDasharray="4 4"
                  label={{ value: "99%ile", fill: "var(--coral)", fontSize: 10 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      {mocks.length === 0 ? (
        <div
          className="card"
          style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}
        >
          No mocks logged yet. Click "+ Log mock" to start.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[...mocks]
            .reverse()
            .slice(0, 20)
            .map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="card"
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "JetBrains Mono",
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    minWidth: 80,
                  }}
                >
                  {m.date}
                </span>
                <span style={{ fontWeight: 600, fontSize: "0.875rem", flex: 1 }}>
                  {m.mock_type}
                  {m.mock_number ? ` #${m.mock_number}` : ""} — {m.section}
                </span>
                {m.net_score !== undefined && (
                  <span style={{ color: "var(--amber)", fontWeight: 700 }}>NS: {m.net_score}</span>
                )}
                {m.percentile !== undefined && (
                  <span style={{ color: "var(--teal)", fontSize: "0.85rem" }}>
                    {m.percentile}%ile
                  </span>
                )}
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={() => openEdit(m)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      fontSize: "0.75rem",
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => del(m.id!)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      fontSize: "0.75rem",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditId(null);
        }}
        title={editId ? "Edit mock" : "Log a mock"}
        width={480}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: 8,
            }}
          >
            <div>
              <label>Date</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <label>Mock #</label>
              <input
                className="input"
                type="number"
                min={1}
                value={form.mock_number ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    mock_number: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label>Type</label>
              <select
                className="input"
                value={form.mock_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mock_type: e.target.value as MockResult["mock_type"] }))
                }
              >
                <option>DashCAT</option>
                <option>Sectional</option>
                <option>PYP</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label>Section</label>
              <select
                className="input"
                value={form.section}
                onChange={(e) =>
                  setForm((f) => ({ ...f, section: e.target.value as MockResult["section"] }))
                }
              >
                <option>Overall</option>
                <option>VARC</option>
                <option>DILR</option>
                <option>QA</option>
              </select>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: 8,
            }}
          >
            <div>
              <label>Attempted</label>
              <input
                className="input"
                type="number"
                value={form.attempted ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    attempted: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div>
              <label>Correct</label>
              <input
                className="input"
                type="number"
                value={form.correct ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    correct: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div>
              <label>Incorrect</label>
              <input
                className="input"
                type="number"
                value={form.incorrect ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    incorrect: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: 8,
            }}
          >
            <div>
              <label>Net Score</label>
              <input
                className="input"
                type="number"
                value={form.net_score ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    net_score: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div>
              <label>%ile</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.percentile ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    percentile: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div>
              <label>Time (min)</label>
              <input
                className="input"
                type="number"
                value={form.time_taken ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    time_taken: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
          </div>
          <div>
            <label>Notes</label>
            <textarea
              className="input"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Key takeaway from this mock"
            />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setShowForm(false);
                setEditId(null);
              }}
            >
              Cancel
            </button>
            <button id="save-mock" className="btn btn-amber" onClick={save}>
              Save
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
