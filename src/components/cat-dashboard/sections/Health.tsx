import { motion } from 'framer-motion';
import { HEALTH_CARDS } from '../data/static';

const ICONS: Record<string, string> = {
  SLEEP: '😴', CAFFEINE: '☕', MOVEMENT: '🏃', EYES: '👁️',
  FOOD: '🥗', HYDRATION: '💧', PEOPLE: '👥', RESET: '🌬️', 'GUT-CHECK': '📋',
};

export default function Health() {
  return (
    <section id="health" className="section">
      <div style={{ marginBottom: 20 }}>
        <p className="section-eyebrow">Health</p>
        <h2 className="section-title">Health Protocol</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
          These are floors, not optional upgrades. Cut other things first.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {HEALTH_CARDS.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card"
            style={{ padding: 18, borderLeft: '3px solid var(--lav)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '1.1rem' }}>{ICONS[card.title] || '💚'}</span>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.85rem', color: 'var(--lav)', letterSpacing: '0.04em' }}>
                {card.title}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
              {card.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
