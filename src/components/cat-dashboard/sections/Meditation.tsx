import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MED_DURATIONS, MED_GUIDANCE } from '../data/static';
import { bell, resumeCtx } from '../audio/audio';
import { useKV } from '../bridge';
import { useActivity } from '../bridge';
import { useToast } from '../bridge';
import { todayKey } from '../engine/schedule';
import type { MeditateLog } from '../types';

const STAR_COUNT = 18;

function randomStars() {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    top:  Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 3,
  }));
}

export default function Meditation() {
  const { value: medLog, setValue: setMedLog } = useKV<MeditateLog>('meditate_log', { streak: 0, total: 0, totalMinutes: 0, lastDate: '' });
  const { markActivity } = useActivity();
  const { addToast }     = useToast();

  const [duration,   setDuration]  = useState(5);
  const [running,    setRunning]   = useState(false);
  const [secsLeft,   setSecsLeft]  = useState(0);
  const [guidanceIdx,setGuidance]  = useState(0);
  const [done,       setDone]      = useState(false);

  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const guidanceTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stars         = useMemo(() => randomStars(), []);

  const stop = useCallback(() => {
    if (intervalRef.current)   clearInterval(intervalRef.current);
    if (guidanceTimer.current) clearInterval(guidanceTimer.current);
    setRunning(false);
  }, []);

  const start = useCallback(() => {
    resumeCtx();
    setDone(false);
    setSecsLeft(duration * 60);
    setGuidance(0);
    setRunning(true);
    bell();
  }, [duration]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecsLeft((prev) => {
        if (prev <= 1) {
          stop();
          setDone(true);
          bell();
          const today = todayKey();
          const isNewDay = medLog.lastDate !== today;
          const newStreak = isNewDay ? (medLog.streak || 0) + 1 : medLog.streak || 0;
          const newLog: MeditateLog = {
            streak: newStreak,
            total: (medLog.total || 0) + 1,
            totalMinutes: (medLog.totalMinutes || 0) + duration,
            lastDate: today,
          };
          setMedLog(newLog);
          markActivity(1);
          addToast(`Meditation complete! +${duration} minutes 🧘`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    guidanceTimer.current = setInterval(() => {
      setGuidance((g) => (g + 1) % MED_GUIDANCE.length);
    }, 50000);

    return () => {
      if (intervalRef.current)   clearInterval(intervalRef.current);
      if (guidanceTimer.current) clearInterval(guidanceTimer.current);
    };
  }, [running, duration, medLog, stop, setMedLog, markActivity, addToast]);

  const pct       = running ? ((duration * 60 - secsLeft) / (duration * 60)) * 100 : 0;
  const minsLeft  = Math.floor(secsLeft / 60);
  const secsDisp  = String(secsLeft % 60).padStart(2, '0');

  return (
    <section id="meditate" className="section">
      <div style={{ marginBottom: 20 }}>
        <p className="section-eyebrow">Tools</p>
        <h2 className="section-title">Meditation</h2>
      </div>

      <div
        className="card"
        style={{
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 360,
        }}
      >
        {/* Animated stars */}
        {(running || done) && stars.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 3 + s.delay, repeat: Infinity, delay: s.delay }}
            style={{
              position: 'absolute',
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              borderRadius: '50%',
              background: 'var(--lav)',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Duration selector */}
        <div style={{ display: 'flex', gap: 8, zIndex: 1 }}>
          {MED_DURATIONS.map((d) => (
            <button
              key={d}
              className={`btn ${duration === d ? 'btn-amber' : 'btn-ghost'} btn-sm`}
              onClick={() => { if (!running) setDuration(d); }}
              disabled={running}
            >
              {d}m
            </button>
          ))}
        </div>

        {/* Animated orb */}
        <div style={{ position: 'relative', width: 180, height: 180, zIndex: 1 }}>
          {/* Ring */}
          <svg width="180" height="180" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="90" cy="90" r="80" fill="none" stroke="var(--bg-raised)" strokeWidth="4" />
            <circle
              cx="90" cy="90" r="80" fill="none"
              stroke="var(--lav)" strokeWidth="4"
              strokeDasharray={2 * Math.PI * 80}
              strokeDashoffset={2 * Math.PI * 80 * (1 - pct / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>

          {/* Pulsing orb */}
          <motion.div
            animate={running ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              inset: 16,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(156,144,196,0.25) 0%, transparent 70%)',
              border: '1px solid var(--lav)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            {running ? (
              <>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '1.6rem', fontWeight: 700, color: 'var(--lav)' }}>
                  {minsLeft}:{secsDisp}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>remaining</span>
              </>
            ) : done ? (
              <span style={{ fontSize: '1.8rem' }}>🙏</span>
            ) : (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{duration}m</span>
            )}
          </motion.div>
        </div>

        {/* Guidance text */}
        <AnimatePresence mode="wait">
          {running && (
            <motion.p
              key={guidanceIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.6 }}
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                textAlign: 'center',
                maxWidth: 280,
                lineHeight: 1.5,
                zIndex: 1,
                margin: 0,
              }}
            >
              {MED_GUIDANCE[guidanceIdx]}
            </motion.p>
          )}
        </AnimatePresence>

        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', color: 'var(--lav)', zIndex: 1 }}
          >
            <div style={{ fontWeight: 600 }}>Session complete ✓</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Streak: {medLog.streak}d · Total: {medLog.totalMinutes}m
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <div style={{ zIndex: 1 }}>
          {!running ? (
            <button id="med-start" className="btn btn-amber" onClick={start} style={{ minWidth: 140 }}>
              {done ? 'Meditate again' : 'Begin session'}
            </button>
          ) : (
            <button className="btn btn-ghost" onClick={stop}>End early</button>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, fontSize: '0.8rem', color: 'var(--text-muted)', zIndex: 1 }}>
          <span>🔥 {medLog.streak || 0}d streak</span>
          <span>⏱️ {medLog.totalMinutes || 0} total minutes</span>
        </div>
      </div>
    </section>
  );
}
