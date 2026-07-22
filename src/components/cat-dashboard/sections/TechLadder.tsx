import { motion } from 'framer-motion';
import { TECH_LADDER } from '../data/static';
import { DATE_CFG } from '../data/dates';

export default function TechLadder() {
  const now = new Date();

  return (
    <section id="tech" className="section">
      <div style={{ marginBottom: 20 }}>
        <p className="section-eyebrow">Strategy</p>
        <h2 className="section-title">Tech Ladder</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
          Technology commitments adapt to the campaign. Nothing new starts in Phase 3.
        </p>
      </div>

      <div style={{ position: 'relative' }}>
        {/* Vertical timeline line */}
        <div
          style={{
            position: 'absolute',
            left: 20,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'var(--border)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingLeft: 50 }}>
          {TECH_LADDER.map((item, i) => {
            // Determine if this phase is current
            const start = i === 0 ? DATE_CFG.CAMPAIGN_START : i === 1 ? DATE_CFG.JUL1 : i === 2 ? DATE_CFG.COLLEGE_START : i === 3 ? DATE_CFG.PHASE2_START : DATE_CFG.PHASE3_START;
            const end   = i === 0 ? DATE_CFG.JUL1 : i === 1 ? DATE_CFG.COLLEGE_START : i === 2 ? DATE_CFG.PHASE1_END : i === 3 ? DATE_CFG.PHASE3_START : DATE_CFG.EXAM_DATE;
            const isCurrent = now >= start && now <= end;
            const isPast    = now > end;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ position: 'relative' }}
              >
                {/* Dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: -38,
                    top: 12,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--amber)' : isPast ? 'var(--teal)' : 'var(--border)',
                    border: `2px solid ${isCurrent ? 'var(--amber-glow)' : 'var(--bg-deep)'}`,
                    boxShadow: isCurrent ? '0 0 0 4px var(--amber-dim)' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                />

                <div
                  className="card"
                  style={{
                    padding: '14px 18px',
                    borderColor: isCurrent ? 'var(--amber)' : isPast ? 'rgba(63,175,168,0.3)' : 'var(--border)',
                    opacity: isPast ? 0.65 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.phase}</span>
                    {isCurrent && (
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--amber-dim)', color: 'var(--amber)', fontSize: '0.68rem', fontWeight: 700 }}>CURRENT</span>
                    )}
                    {isPast && (
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(63,175,168,0.12)', color: 'var(--teal)', fontSize: '0.68rem', fontWeight: 700 }}>DONE</span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '0.95rem', color: isCurrent ? 'var(--amber)' : 'var(--text-primary)', marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
