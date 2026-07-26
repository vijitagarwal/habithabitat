import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../bridge";

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(
          (t: { id: string; message: string; type: "success" | "error" | "info" | "warning" }) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl cursor-pointer"
              style={{
                background: "var(--bg-raised)",
                border: `1px solid ${t.type === "error" ? "var(--coral)" : t.type === "info" ? "var(--teal)" : "var(--amber)"}`,
                minWidth: 220,
                maxWidth: 340,
              }}
              onClick={() => removeToast(t.id)}
            >
              <span style={{ fontSize: "1rem" }}>
                {t.type === "error" ? "⚠️" : t.type === "info" ? "ℹ️" : "✓"}
              </span>
              <span style={{ fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.4 }}>
                {t.message}
              </span>
            </motion.div>
          ),
        )}
      </AnimatePresence>
    </div>
  );
}
