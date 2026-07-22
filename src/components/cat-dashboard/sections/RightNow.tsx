import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { computeRightNow, resolveBlock } from '../engine/schedule';
import { DATE_CFG } from '../data/dates';
import { BLOCK_COLORS } from '../engine/schedule';

export default function RightNow() {
  const [data, setData] = useState(() => computeRightNow(DATE_CFG));
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setData(computeRightNow(DATE_CFG)), 1000);
    return () => clearInterval(id);
  }, []);

  const scrollToTool = useCallback((tool: string) => {
    const id = tool === 'breath' ? 'breathe' : 'meditate';
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (!data) {
    return (
      <section id="rightnow" className="section">
        <p style={{ color: 'var(--text-muted)' }}>Schedule not available.</p>
      </section>
    );
  }

  const { sched, idx, current, resolved, remain, elapsedPct, nextBlock, nextDate, accent, fmtRemain } = data;

  return (
    <section id="rightnow" className="section">
      <div style={{ marginBottom: 16 }}>
        <p className="section-eyebrow">Live Schedule</p>
        <h2 className="section-title">Right Now</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 20 }}>
        {/* Current block card */}
        <motion.div
          key={`block-${idx}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card"
          style={{ padding: 20, borderColor: accent, borderWidth: 2, gridColumn: '1 / -1' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Right now · {current.s}–{current.e}
              </div>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>
                {resolved.t}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '6px 0 0' }}>
                {resolved.d}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.1rem', fontWeight: 600, color: accent }}>{fmtRemain}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Up next: <strong style={{ color: 'var(--text-primary)' }}>{nextBlock.s} {resolveBlock(nextBlock, nextDate, DATE_CFG).t}</strong>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 5, background: 'var(--bg-raised)', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: '100%', width: `${elapsedPct}%`, background: accent, borderRadius: 99, transition: 'width 1s linear' }} />
          </div>

          {/* Open tool button */}
          {current.tool && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => scrollToTool(current.tool!)}
              style={{ borderColor: accent, color: accent }}
            >
              {current.tool === 'breath' ? '🌬️ Open breathwork' : '🧘 Open meditation'}
            </button>
          )}
        </motion.div>

        {/* Full-day timeline */}
        <div
          className="card"
          style={{
            padding: '16px 4px',
            gridColumn: '1 / -1',
            maxHeight: 420,
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '0 12px 8px', fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Today's Schedule
          </div>
          {sched.map((block, i) => {
            const r = resolveBlock(block, data.today, DATE_CFG);
            const isNow  = i === idx;
            const isPast = i < idx;
            const isOpen = expanded === i;
            const bColor = BLOCK_COLORS[block.c] || '#6B7A8D';

            return (
              <div key={i}>
                <div
                  className={`tl-item ${isNow ? 'now' : ''} ${isPast ? 'done' : ''}`}
                  onClick={() => setExpanded(isOpen ? null : i)}
                  style={{ borderLeft: isNow ? `3px solid ${bColor}` : '3px solid transparent', margin: '2px 8px', borderRadius: 8 }}
                >
                  <span className="tl-time">{block.s}</span>
                  <div style={{ flex: 1 }}>
                    <div className="tl-title">{r.t}</div>
                    {!isOpen && r.d && <div className="tl-desc">{r.d}</div>}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {isNow ? '▶' : isOpen ? '▲' : '▼'}
                  </span>
                </div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ overflow: 'hidden', padding: '0 16px 12px 68px' }}
                    >
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                        {r.d || 'No additional description.'}
                      </p>
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: 8,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: bColor + '22',
                          color: bColor,
                          fontSize: '0.7rem',
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
