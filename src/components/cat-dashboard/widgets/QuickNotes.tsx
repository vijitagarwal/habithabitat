import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKV } from '../bridge';

export default function QuickNotes() {
  const { value: notes, setValue: setNotes } = useKV<string>('quick_notes', '');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(notes);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(notes); }, [notes]);
  useEffect(() => { if (open) textRef.current?.focus(); }, [open]);

  const save = () => { setNotes(draft); setOpen(false); };

  return (
    <>
      {/* FAB */}
      <button
        id="quick-notes-fab"
        className="quick-note-fab no-print"
        onClick={() => setOpen((v) => !v)}
        aria-label="Quick notes"
        title="Quick notes"
      >
        📝
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="notes-panel"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: 96,
              right: 24,
              width: 'min(360px, calc(100vw - 48px))',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-bright)',
              borderRadius: 16,
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              zIndex: 149,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '0.9rem' }}>Quick Notes</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-amber btn-sm" onClick={save}>Save</button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpen(false)}>✕</button>
              </div>
            </div>
            <textarea
              ref={textRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Anything on your mind… thoughts, quick plans, questions."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '14px 16px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.6,
                resize: 'none',
                minHeight: 200,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
