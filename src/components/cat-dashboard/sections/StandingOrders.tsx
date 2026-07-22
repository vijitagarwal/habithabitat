import { motion } from 'framer-motion';
import { STANDING_ORDERS } from '../data/static';

export default function StandingOrders() {
  return (
    <section id="orders" className="section">
      <div style={{ marginBottom: 20 }}>
        <p className="section-eyebrow">Strategy</p>
        <h2 className="section-title">Standing Orders</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
          These five rules are non-negotiable for the entire campaign.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STANDING_ORDERS.map((order, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card"
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              borderLeft: '3px solid var(--amber)',
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--amber)',
                flexShrink: 0,
                paddingTop: 1,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {order}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
