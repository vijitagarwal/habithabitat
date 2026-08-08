import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bell, resumeCtx } from "../audio/audio";
import { useKV } from "../bridge";
import { useActivity } from "../bridge";
import { useToast } from "../bridge";
import { supabase } from "../bridge";
import { useAuth } from "../bridge";
import { todayKey } from "../engine/schedule";
import type { FocusLog } from "../types";
import confetti from "canvas-confetti";
import { useHabits, setHabitValue, todayISO } from "../../../lib/habits-store";

const GENERAL_SUBJECTS = ["CAT - VARC", "CAT - DILR", "CAT - QA", "FlyRank", "DSA", "Free"];
const MODES = [
  { label: "Focus Sprint", mins: 25, icon: "⚡" },
  { label: "Deep Work", mins: 50, icon: "🔥" },
  { label: "Custom", mins: -1, icon: "✏️" },
];

export default function FocusTimer() {
  const { value: focusLog, setValue: setFocusLog } = useKV<FocusLog>("focus_log", { sessions: [] });
  const { markActivity } = useActivity();
  const { addToast } = useToast();
  const s = useHabits();

  const timerHabits = s.habits.filter((h) => h.isTimer);

  const [modeIdx, setModeIdx] = useState(0);
  const [subject, setSubject] = useState(GENERAL_SUBJECTS[0]);
  const [custom, setCustom] = useState(30);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [secsLeft, setSecsLeft] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [done, setDone] = useState(false);
  const endTimeRef = useRef<number>(0);

  const { user } = useAuth();
  const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);
  const [linkedTopic, setLinkedTopic] = useState<string | null>(null);
  const [linkedTopicName, setLinkedTopicName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    db.from("topic_progress")
      .select("id, name:topic_name")
      .eq("user_id", user.id)
      .order("topic_name")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any }) => {
        if (data) setTopics(data);
      });
  }, [user]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getDurationMins = useCallback(() => {
    const m = MODES[modeIdx];
    return m.mins === -1 ? custom : m.mins;
  }, [modeIdx, custom]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setPaused(false);
    setFullscreen(false);
  }, []);

  const pause = useCallback(() => {
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    endTimeRef.current = Date.now() + secsLeft * 1000;
    setPaused(false);
  }, [secsLeft]);

  const start = useCallback(() => {
    resumeCtx();
    setDone(false);
    endTimeRef.current = Date.now() + getDurationMins() * 60000;
    setSecsLeft(getDurationMins() * 60);
    setRunning(true);
    setPaused(false);
  }, [getDurationMins]);

  useEffect(() => {
    if (!running || paused) return;

    // Create an inline Web Worker to bypass background tab throttling
    const workerCode = `
      let interval;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          interval = setInterval(() => self.postMessage('tick'), 1000);
        } else if (e.data === 'stop') {
          clearInterval(interval);
        }
      };
    `;
    const blob = new Blob([workerCode], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = () => {
      const remainingSecs = Math.floor((endTimeRef.current - Date.now()) / 1000);
      setSecsLeft(remainingSecs);
      
      if (remainingSecs <= 0) {
        worker.postMessage('stop');
        stop();
        setDone(true);
        bell();
        // Confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#E8A23D", "#3FAFA8", "#9C90C4"],
        });
        const today = todayKey();
        const dur = getDurationMins();
        const newLog: FocusLog = {
          sessions: [...(focusLog.sessions || []), { date: today, subject, durationMins: dur }],
        };
        setFocusLog(newLog);
        markActivity(3);
        addToast(`Focus sprint complete! ${dur}m of ${subject} 🎯`);

         // Handle habit linking
        if (timerHabits.some((h) => h.name === subject)) {
          const habit = timerHabits.find((h) => h.name === subject);
          if (habit) {
            const todayISODate = todayISO();
            const currentValue = s.values[todayISODate]?.[habit.id] || 0;
            const isHourUnit = habit.unit?.toLowerCase().includes("hr") || 
                              habit.unit?.toLowerCase().includes("hour");
            const increment = isHourUnit ? dur / 60 : dur;
            setHabitValue(todayISODate, habit.id, currentValue + increment);
            addToast(`⏱️ Added ${dur}m to ${habit.name} (${increment} ${habit.unit || "units"})`);
          }
        }

        if (linkedTopic && user) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const db = supabase as any;
          db.from("topic_progress")
            .select("time_spent_minutes")
            .eq("id", linkedTopic)
            .single()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then(({ data: topicData }: { data: any }) => {
              const currentMins = topicData?.time_spent_minutes || 0;
              db.from("topic_progress")
                .update({ time_spent_minutes: currentMins + dur })
                .eq("id", linkedTopic)
                .then(() => {
                  addToast(`📚 ${dur}m logged to ${linkedTopicName}`);
                });
            });
        }
        
        setLinkedTopic(null);
        setLinkedTopicName("");
      }
    };

    worker.postMessage('start');

    return () => {
      worker.postMessage('stop');
      worker.terminate();
    };
  }, [running, paused, stop, getDurationMins, focusLog, subject, setFocusLog, markActivity, addToast, linkedTopic, linkedTopicName, user, timerHabits, s.values]);

  const minsLeft = Math.floor(secsLeft / 60);
  const secsDisp = String(secsLeft % 60).padStart(2, "0");
  const pct = running ? ((getDurationMins() * 60 - secsLeft) / (getDurationMins() * 60)) * 100 : 0;

  const today = todayKey();
  const todaySessions = (focusLog.sessions || []).filter((s) => s.date === today);
  const weekSessions = (focusLog.sessions || []).filter((s) => {
    const d = new Date(s.date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 7;
  });
  const weekHours = weekSessions.reduce((sum, s) => sum + s.durationMins, 0) / 60;

  // Full-screen focus mode
  const focusModeEl = (
    <AnimatePresence>
      {fullscreen && (
        <motion.div
          key="focus-mode"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="focus-mode"
        >
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {subject} {paused && <span style={{ color: "var(--amber)", marginLeft: 8 }}>(PAUSED)</span>}
            </div>
            <div
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: "4rem",
                fontWeight: 700,
                color: "var(--amber)",
              }}
            >
              {minsLeft}:{secsDisp}
            </div>
            <div
              style={{
                width: 240,
                height: 4,
                background: "var(--bg-raised)",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: "var(--amber)",
                  borderRadius: 99,
                  transition: "width 1s linear",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {paused ? (
                <button className="btn btn-amber btn-sm" onClick={resume}>
                  ▶ Resume
                </button>
              ) : (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={pause}
                  style={{ color: "var(--text-muted)" }}
                >
                  ⏸ Pause
                </button>
              )}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setFullscreen(false)}
                style={{ color: "var(--text-muted)" }}
              >
                Exit focus mode
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <section id="focus" className="section">
      <div style={{ marginBottom: 20 }}>
        <p className="section-eyebrow">Tools</p>
        <h2 className="section-title">Focus Timer</h2>
      </div>

      {focusModeEl}

      <div
        className="card"
        style={{
          padding: 28,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Mode selection */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {MODES.map((mode, i) => (
            <button
              key={mode.label}
              className={`btn ${modeIdx === i ? "btn-amber" : "btn-ghost"} btn-sm`}
              onClick={() => {
                if (!running) setModeIdx(i);
              }}
              disabled={running}
            >
              {mode.icon} {mode.label} {mode.mins > 0 ? `(${mode.mins}m)` : ""}
            </button>
          ))}
        </div>

        {/* Custom duration input */}
        {modeIdx === 2 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label
              htmlFor="custom-dur"
              style={{
                margin: 0,
                textTransform: "none",
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
              }}
            >
              Duration:
            </label>
            <input
              id="custom-dur"
              type="number"
              className="input"
              style={{ width: 80 }}
              value={custom}
              min={1}
              max={120}
              onChange={(e) => setCustom(Math.min(120, Math.max(1, Number(e.target.value))))}
              disabled={running}
            />
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>minutes</span>
          </div>
        )}

        {/* Subject tag */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", width: "100%", textAlign: "center" }}>General Focus</span>
            {GENERAL_SUBJECTS.map((s) => (
              <button
                key={s}
                className={`btn ${subject === s ? "btn-amber" : "btn-ghost"} btn-sm`}
                onClick={() => {
                  if (!running) setSubject(s);
                }}
                disabled={running}
              >
                {s}
              </button>
            ))}
          </div>
          {timerHabits.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 12 }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", width: "100%", textAlign: "center" }}>My Habits</span>
              {timerHabits.map((h) => (
                <button
                  key={h.id}
                  className={`btn ${subject === h.name ? "btn-amber" : "btn-ghost"} btn-sm`}
                  onClick={() => {
                    if (!running) setSubject(h.name);
                  }}
                  disabled={running}
                >
                  {h.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Link to Topic dropdown */}
        {!running && topics.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", width: "100%" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Link to Topic (optional — logs study time)
            </span>
            <select
              className="input"
              style={{ maxWidth: 280, textAlign: "center", padding: "6px 12px", background: "var(--bg-raised)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: "8px" }}
              value={linkedTopic || ""}
              onChange={(e) => {
                const selectedId = e.target.value;
                setLinkedTopic(selectedId || null);
                const t = topics.find((t) => t.id === selectedId);
                setLinkedTopicName(t?.name || "");
              }}
              disabled={running}
            >
              <option value="">— No topic link —</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {linkedTopic && (
              <span style={{ fontSize: "0.72rem", color: "var(--teal)" }}>
                ✓ Will log time to: {linkedTopicName}
              </span>
            )}
          </div>
        )}

        {/* Timer display */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: "3rem",
              fontWeight: 700,
              color: "var(--amber)",
            }}
          >
            {running ? `${minsLeft}:${secsDisp}` : `${getDurationMins()}:00`}
          </div>
          {running && (
            <div
              style={{
                width: 200,
                height: 4,
                background: "var(--bg-raised)",
                borderRadius: 99,
                overflow: "hidden",
                margin: "8px auto 0",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: "var(--amber)",
                  borderRadius: 99,
                  transition: "width 1s linear",
                }}
              />
            </div>
          )}
          {done && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ color: "var(--teal)", fontWeight: 600, marginTop: 8 }}
            >
              Session complete! 🎉
            </motion.div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 10 }}>
          {!running ? (
            <button
              id="focus-start"
              className="btn btn-amber"
              onClick={start}
              style={{ minWidth: 140 }}
            >
              {done ? "Start again" : "▶ Start"}
            </button>
          ) : (
            <>
              {paused ? (
                <button className="btn btn-amber" onClick={resume} style={{ minWidth: 100 }}>
                  ▶ Resume
                </button>
              ) : (
                <button className="btn btn-ghost" onClick={pause} style={{ minWidth: 100 }}>
                  ⏸ Pause
                </button>
              )}
              <button className="btn btn-ghost" onClick={stop}>
                Stop
              </button>
              <button className="btn btn-ghost" onClick={() => setFullscreen(true)}>
                ⛶ Focus mode
              </button>
            </>
          )}
        </div>

        {/* Session stats */}
        <div style={{ display: "flex", gap: 20, fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <span>Today: {todaySessions.length} sessions</span>
          <span>This week: {weekHours.toFixed(1)}h</span>
        </div>
      </div>
    </section>
  );
}
