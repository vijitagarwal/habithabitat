import { motion } from "framer-motion";
import { CADENCE } from "../data/static";

const VARC = [
  {
    topic: "Reading Comprehension",
    detail:
      "4 passages × 3–6 questions. No direct-answer, requires genuine speed reading and inference.",
  },
  {
    topic: "Para Jumbles / Summary / Odd Sentence",
    detail:
      "8 questions — skills separate from RC. Practice independently; these are the easiest to improve quickly.",
  },
];

const DILR = [
  {
    topic: "Sets — not topics",
    detail:
      "4 sets × 4–6 questions each. You need to identify the 2-3 sets you can do fast and skip the hard ones entirely.",
  },
  {
    topic: "Data Interpretation",
    detail: "Charts, tables, caselets — speed calculation is the base skill.",
  },
];

const QA = [
  {
    topic: "Arithmetic (50-55%)",
    detail: "P&L, TSD, T&W, SI/CI, Percentages. Master these completely before anything else.",
  },
  {
    topic: "Algebra + Number Theory (25-30%)",
    detail: "Equations, Inequalities, Number System. High ROI for 95+ percentile.",
  },
  {
    topic: "Geometry + PnC + Modern Math (20-25%)",
    detail: "Lower weight — prioritize only after arithmetic is solid.",
  },
];

const SCORE_STRAT = [
  { label: "90-95 %ile", desc: "Perfect VARC. Solid DILR set selection. Arithmetic-strong QA." },
  { label: "95-98 %ile", desc: "Need to be strong in at least 2 of the 3 sections." },
  { label: "99%ile", desc: "Needs consistent top-10 performance in all 3 simultaneously." },
];

export default function CatCore() {
  return (
    <section id="core" className="section">
      <div style={{ marginBottom: 20 }}>
        <p className="section-eyebrow">Strategy</p>
        <h2 className="section-title">CAT Core</h2>
      </div>

      {/* Section breakdown */}
      {[
        { title: "VARC", color: "var(--amber)", items: VARC },
        { title: "DILR", color: "var(--teal)", items: DILR },
        { title: "QA", color: "var(--lav)", items: QA },
      ].map(({ title, color, items }, i) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="card"
          style={{ padding: 20, marginBottom: 12, borderLeft: `3px solid ${color}` }}
        >
          <div
            style={{
              fontFamily: "Space Grotesk",
              fontSize: "1rem",
              fontWeight: 600,
              color,
              marginBottom: 12,
            }}
          >
            {title}
          </div>
          {items.map((item, j) => (
            <div key={j} style={{ marginBottom: j < items.length - 1 ? 12 : 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  color: "var(--text-primary)",
                  marginBottom: 3,
                }}
              >
                {item.topic}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {item.detail}
              </div>
            </div>
          ))}
        </motion.div>
      ))}

      {/* Mock cadence */}
      <div className="card" style={{ padding: 20, marginBottom: 12 }}>
        <div
          style={{
            fontFamily: "Space Grotesk",
            fontWeight: 600,
            marginBottom: 12,
            color: "var(--text-primary)",
          }}
        >
          Mock Cadence
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 10,
          }}
        >
          {CADENCE.map((c, i) => (
            <div
              key={i}
              style={{ padding: "10px 14px", background: "var(--bg-raised)", borderRadius: 8 }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--amber)",
                  letterSpacing: "0.06em",
                  marginBottom: 4,
                }}
              >
                {c.title}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {c.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score targets */}
      <div className="card" style={{ padding: 20 }}>
        <div
          style={{
            fontFamily: "Space Grotesk",
            fontWeight: 600,
            marginBottom: 12,
            color: "var(--text-primary)",
          }}
        >
          Score Strategy
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SCORE_STRAT.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: 4,
                  background: "var(--amber-dim)",
                  color: "var(--amber)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {s.label}
              </span>
              <span
                style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}
              >
                {s.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
