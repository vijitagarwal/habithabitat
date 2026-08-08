import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CONTINGENCIES } from "../data/static";
import { useKV, useToast } from "../bridge";

export default function Contingency() {
  const [open, setOpen] = useState<number | null>(0);
  const { value: activeProtocol, setValue: setActiveProtocol } = useKV<string | null>("active_contingency", null);
  const { addToast } = useToast();

  const handleActivate = (title: string) => {
    if (activeProtocol === title) {
      setActiveProtocol(null);
      addToast("Contingency mode deactivated.");
    } else {
      setActiveProtocol(title);
      addToast(`Contingency activated: ${title}`);
    }
  };

  return (
    <section id="contingency" className="section">
      <div style={{ marginBottom: 20 }}>
        <p className="section-eyebrow">Strategy</p>
        <h2 className="section-title">Contingency Plans</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
          Pre-decided responses prevent panic decisions under pressure.
        </p>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {CONTINGENCIES.map((c, i) => (
          <div
            key={i}
            className="accordion-item"
            style={{
              borderBottom: i < CONTINGENCIES.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <button
              className="accordion-trigger"
              onClick={() => setOpen(open === i ? null : i)}
              style={{ padding: "16px 20px" }}
              aria-expanded={open === i}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--amber)",
                    flexShrink: 0,
                    boxShadow: open === i ? "0 0 8px var(--amber-glow)" : "none",
                    transition: "box-shadow 0.2s ease",
                  }}
                />
                <span style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>{c.title}</span>
              </span>
              <motion.span
                animate={{ rotate: open === i ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ color: "var(--text-muted)", fontSize: "0.8rem", flexShrink: 0 }}
              >
                ▼
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    style={{
                      padding: "0 20px 20px 38px",
                      color: "var(--text-secondary)",
                      fontSize: "0.875rem",
                      lineHeight: 1.7,
                    }}
                  >
                    <p style={{ marginBottom: 12 }}>{c.body}</p>
                    <button
                      className={`btn btn-sm ${activeProtocol === c.title ? "btn-danger" : "btn-ghost"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivate(c.title);
                      }}
                      style={{ fontSize: "0.75rem" }}
                    >
                      {activeProtocol === c.title ? "Deactivate Protocol" : "Activate Protocol"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
