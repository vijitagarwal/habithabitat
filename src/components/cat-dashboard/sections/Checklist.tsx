import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKV } from '../bridge';
import { useActivity } from '../bridge';
import { useToast } from '../bridge';
import { CHECKLIST } from '../data/static';
import confetti from 'canvas-confetti';
import type { ChecklistState } from '../types';

interface CustomItem { id: string; text: string; }

export default function Checklist() {
  const { value: state, setValue: setState }           = useKV<ChecklistState>('checklist', {});
  const { value: customs, setValue: setCustoms }       = useKV<CustomItem[]>('checklist_custom', []);
  const { markActivity } = useActivity();
  const { addToast } = useToast();
  const [newText, setNewText] = useState('');
  const [adding, setAdding]   = useState(false);

  const allItems = [
    ...CHECKLIST,
    ...(customs || []),
  ];

  const toggle = async (id: string) => {
    const wasChecked = !!state[id];
    const next = { ...state, [id]: !wasChecked };
    setState(next);
    markActivity(1);
    if (!wasChecked) {
      const allDone = allItems.every((c) => next[c.id]);
      if (allDone) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
        addToast('All items complete! 🎉');
      } else {
        addToast('Item checked ✓');
      }
    }
  };

  const addItem = () => {
    const text = newText.trim();
    if (!text) return;
    const newItem: CustomItem = { id: `custom_${Date.now()}`, text };
    setCustoms([...(customs || []), newItem]);
    setNewText('');
    setAdding(false);
    addToast('Item added ✓');
  };

  const deleteCustom = (id: string) => {
    setCustoms((customs || []).filter((c) => c.id !== id));
    const next = { ...state };
    delete next[id];
    setState(next);
  };

  const done  = allItems.filter((c) => state[c.id]).length;
  const total = allItems.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <section id="tasks" className="section">
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p className="section-eyebrow">Planning</p>
          <h2 className="section-title">Pre-launch Checklist</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
            {done}/{total} done
          </p>
        </div>
        <button
          id="add-checklist-item"
          className="btn btn-ghost btn-sm"
          onClick={() => setAdding((v) => !v)}
        >
          {adding ? '✕ Cancel' : '+ Add item'}
        </button>
      </div>

      {/* Add item form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 12 }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                autoFocus
                className="input"
                style={{ flex: 1 }}
                placeholder="Add a checklist item…"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addItem(); if (e.key === 'Escape') setAdding(false); }}
              />
              <button className="btn btn-amber btn-sm" onClick={addItem}>Add</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div style={{ height: 6, background: 'var(--bg-raised)', borderRadius: 99, overflow: 'hidden', marginBottom: 20 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          style={{ height: '100%', background: pct === 100 ? '#22c55e' : 'var(--amber)', borderRadius: 99 }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {allItems.map((item, i) => {
          const checked    = !!state[item.id];
          const isCustom   = !CHECKLIST.find((c) => c.id === item.id);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}
            >
              <motion.button
                onClick={() => toggle(item.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 16px',
                  background: checked ? 'rgba(34,197,94,0.08)' : 'var(--bg-base)',
                  border: `1px solid ${checked ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Checkbox */}
                <div
                  style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${checked ? '#22c55e' : 'var(--border-bright)'}`,
                    background: checked ? '#22c55e' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease', marginTop: 1,
                  }}
                >
                  <AnimatePresence>
                    {checked && (
                      <motion.span
                        key="check"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0 }}
                        style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}
                      >
                        ✓
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <span
                  style={{
                    fontSize: '0.9rem',
                    color: checked ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: checked ? 'line-through' : 'none',
                    lineHeight: 1.5, transition: 'all 0.2s ease',
                  }}
                >
                  {item.text}
                  {isCustom && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 6 }}>custom</span>
                  )}
                </span>
              </motion.button>

              {/* Delete button — only for custom items */}
              {isCustom && (
                <button
                  onClick={() => deleteCustom(item.id)}
                  className="btn btn-ghost btn-icon"
                  style={{ color: 'var(--coral)', flexShrink: 0, alignSelf: 'center' }}
                  title="Delete item"
                >
                  ✕
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {done === total && total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 20, padding: '16px 20px',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 12, textAlign: 'center',
            color: '#22c55e', fontWeight: 600,
          }}
        >
          🚀 All items complete — campaign ready to launch.
        </motion.div>
      )}
    </section>
  );
}
