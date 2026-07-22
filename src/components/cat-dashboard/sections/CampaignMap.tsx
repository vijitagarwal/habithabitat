import { motion } from 'framer-motion';
import { MAP_BARS, PHASE_CARDS } from '../data/static';

const TYPE_COLORS: Record<string, string> = {
  cat:   'var(--amber)',
  tech:  'var(--teal)',
  admin: 'var(--slate)',
};

export default function CampaignMap() {
  return (
    <section id="campaign" className="section">
      <div style={{ marginBottom: 20 }}>
        <p className="section-eyebrow">Campaign</p>
        <h2 className="section-title">Campaign Map</h2>
      </div>

      {/* Gantt bars */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span>Jun 29</span><span>Aug 14</span><span>Oct 1</span><span>Nov 29</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MAP_BARS.map((bar, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ minWidth: 100, fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                {bar.label}
              </span>
              <div style={{ flex: 1, position: 'relative', height: 20 }}>
                <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-raised)', borderRadius: 4 }} />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${bar.width}%` }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    left: `${bar.left}%`,
                    top: 0, bottom: 0,
                    background: TYPE_COLORS[bar.type] || 'var(--slate)',
                    borderRadius: 4,
                    opacity: 0.8,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Phase markers */}
        <div style={{ display: 'flex', marginTop: 12, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--amber)', display: 'inline-block' }} />CAT / Mocks
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--teal)', display: 'inline-block' }} />Tech
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--slate)', display: 'inline-block' }} />Admin
          </div>
        </div>
      </div>

      {/* Phase cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {PHASE_CARDS.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="card"
            style={{ padding: 20, borderLeft: `3px solid ${['var(--coral)', 'var(--teal)', 'var(--amber)'][i]}` }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{card.range}</div>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', marginBottom: 8 }}>{card.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
