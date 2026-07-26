import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { BREATH_PATTERNS, BREATH_ROUNDS } from "../data/static";
import { tone, celebration, resumeCtx } from "../audio/audio";
import { useKV } from "../bridge";
import { useActivity } from "../bridge";
import { useToast } from "../bridge";
import { todayKey } from "../engine/schedule";
import type { BreathLog } from "../types";

type PatternKey = "box" | "relax" | "coherent";

export default function Breathwork() {
  const { value: breathLog, setValue: setBreathLog } = useKV<BreathLog>("breath_log", {
    streak: 0,
    total: 0,
    lastDate: "",
  });
  const { markActivity } = useActivity();
  const { addToast } = useToast();

  const [pattern, setPattern] = useState<PatternKey>("box");
  const [rounds, setRounds] = useState(4);
  const [running, setRunning] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [round, setRound] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [done, setDone] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phases = BREATH_PATTERNS[pattern].phases;
  const curPhase = phases[phaseIdx];

  // Framer Motion spring scale for circle
  const scale = useSpring(1, { stiffness: 80, damping: 20 });
  const circleScale = useTransform(scale, [1, 2], [1, 1.55]);

  const stateRef = useRef({ phaseIdx: 0, round: 0, timeLeft: 0 });

  const stopBreath = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  const startBreath = useCallback(() => {
    resumeCtx();
    setDone(false);

    stateRef.current = { phaseIdx: 0, round: 0, timeLeft: phases[0].s };
    setPhaseIdx(0);
    setRound(0);
    setTimeLeft(phases[0].s);
    scale.set(phases[0].l === "Inhale" ? 1.8 : 1);
    setRunning(true);
  }, [phases, scale]);

  // Tick every second
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      let { phaseIdx: pIdx, round: r, timeLeft: t } = stateRef.current;

      if (t > 1) {
        stateRef.current.timeLeft = t - 1;
        setTimeLeft(t - 1);
        return;
      }

      // Transition to next phase
      const nextPIdx = (pIdx + 1) % phases.length;
      let nextRound = r;
      let isDone = false;

      if (nextPIdx === 0) {
        nextRound = r + 1;
        if (nextRound >= rounds) {
          isDone = true;
        }
      }

      if (isDone) {
        stopBreath();
        setDone(true);
        if (soundOn) celebration();
        const today = todayKey();
        const isNewDay = breathLog.lastDate !== today;
        const newStreak = isNewDay ? (breathLog.streak || 0) + 1 : breathLog.streak || 0;
        const newLog: BreathLog = {
          streak: newStreak,
          total: (breathLog.total || 0) + 1,
          lastDate: today,
        };
        setBreathLog(newLog);
        markActivity(2);
        addToast("Breathwork session complete! 🌬️");
      } else {
        const nextPhase = phases[nextPIdx];
        stateRef.current = { phaseIdx: nextPIdx, round: nextRound, timeLeft: nextPhase.s };
        setPhaseIdx(nextPIdx);
        setRound(nextRound);
        setTimeLeft(nextPhase.s);
        scale.set(nextPhase.l === "Inhale" ? 1.8 : 1);
        if (soundOn) {
          const freqs: Record<string, number> = { Inhale: 440, Exhale: 330, Hold: 523 };
          tone(freqs[nextPhase.l] || 440, 0.3, 0.25);
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    running,
    rounds,
    phases,
    soundOn,
    breathLog,
    scale,
    stopBreath,
    setBreathLog,
    markActivity,
    addToast,
  ]);

  const phaseName = running ? curPhase?.l : "Ready";
  const phaseColors: Record<string, string> = {
    Inhale: "var(--teal)",
    Hold: "var(--amber)",
    Exhale: "var(--lav)",
    Ready: "var(--text-muted)",
  };
  const circleColor = phaseColors[phaseName] || "var(--text-muted)";

  return (
    <section id="breathe" className="section">
      <div style={{ marginBottom: 20 }}>
        <p className="section-eyebrow">Tools</p>
        <h2 className="section-title">Breathwork</h2>
      </div>

      <div
        className="card"
        style={{
          padding: 28,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* Pattern selector */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {Object.entries(BREATH_PATTERNS).map(([key, p]) => (
            <button
              key={key}
              className={`btn ${pattern === key ? "btn-amber" : "btn-ghost"} btn-sm`}
              onClick={() => {
                if (!running) setPattern(key as PatternKey);
              }}
              disabled={running}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Rounds selector */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Rounds:</span>
          {BREATH_ROUNDS.map((r) => (
            <button
              key={r}
              className={`btn ${rounds === r ? "btn-amber" : "btn-ghost"} btn-sm`}
              onClick={() => {
                if (!running) setRounds(r);
              }}
              disabled={running}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Animated circle */}
        <div
          style={{
            position: "relative",
            width: 180,
            height: 180,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <motion.div
            style={{
              scale: circleScale,
              width: 160,
              height: 160,
              borderRadius: "50%",
              border: `2px solid ${circleColor}`,
              background: `radial-gradient(circle, ${circleColor}18 0%, transparent 70%)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                fontFamily: "Space Grotesk",
                fontSize: "1.4rem",
                fontWeight: 700,
                color: circleColor,
              }}
            >
              {running ? timeLeft : ""}
            </span>
            <span style={{ fontSize: "0.8rem", color: circleColor, fontWeight: 600 }}>
              {phaseName}
            </span>
            {running && (
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                Round {round + 1}/{rounds}
              </span>
            )}
          </motion.div>
        </div>

        {/* Done state */}
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: "center", color: "var(--teal)" }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>✓</div>
            <div style={{ fontWeight: 600 }}>Session complete!</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
              Streak: {breathLog.streak} days · Total: {breathLog.total} sessions
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {!running ? (
            <button
              id="breath-start"
              className="btn btn-amber"
              onClick={startBreath}
              style={{ minWidth: 140 }}
            >
              {done ? "Start again" : "Start session"}
            </button>
          ) : (
            <button className="btn btn-ghost" onClick={stopBreath}>
              Stop
            </button>
          )}
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSoundOn((v) => !v)}
            aria-label="Toggle sound"
            title={soundOn ? "Sound on" : "Sound off"}
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 20, fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <span>🔥 {breathLog.streak || 0}d streak</span>
          <span>📊 {breathLog.total || 0} sessions total</span>
        </div>
      </div>
    </section>
  );
}
