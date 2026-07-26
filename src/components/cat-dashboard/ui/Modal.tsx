import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, width = 520 }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200]"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />
          {/* Modal */}
          <div
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            style={{ pointerEvents: "none" }}
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                pointerEvents: "auto",
                width: `min(${width}px, 100%)`,
                background: "var(--bg-base)",
                border: "1px solid var(--border-bright)",
                borderRadius: 16,
                boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                maxHeight: "calc(100vh - 32px)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {title && (
                <div
                  className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <h3 style={{ fontFamily: "Space Grotesk", fontSize: "1rem", fontWeight: 600 }}>
                    {title}
                  </h3>
                  <button
                    onClick={onClose}
                    className="btn btn-ghost btn-icon"
                    style={{ fontSize: "1.1rem", color: "var(--text-muted)" }}
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="p-6" style={{ overflowY: "auto" }}>
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
