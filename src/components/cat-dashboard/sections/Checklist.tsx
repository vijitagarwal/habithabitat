import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKV } from '../bridge';
import { useActivity } from '../bridge';
import { useToast } from '../bridge';
import confetti from 'canvas-confetti';

interface ChecklistItem {
  id: string;
  text: string;
  category: string;
  done: boolean;
}

interface NewItemDraft {
  text: string;
  category: string;
}

const DEFAULT_CATEGORIES = ['Pre-Launch', 'Study', 'Health', 'Admin', 'Tech', 'Other'];

export default function Checklist() {
  const { value: items, setValue: setItems } = useKV<ChecklistItem[]>('checklist_v2', [
    { id: 'c1', text: 'Finish the embeddings ramp-up reading today - FlyRank starts Jul 1.', category: 'Pre-Launch', done: false },
    { id: 'c2', text: 'Set up error-log notebook before first live class on the 29th.',        category: 'Pre-Launch', done: false },
    { id: 'c3', text: 'If laptop purchase is pending, close it this week.',                    category: 'Pre-Launch', done: false },
    { id: 'c4', text: 'Lock fixed wake time now before grind starts.',                          category: 'Health',     done: false },
    { id: 'c5', text: 'If trying vocab habit, queue app/articles today.',                       category: 'Study',      done: false },
  ]);
  const { markActivity } = useActivity();
  const { addToast } = useToast();

  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editText, setEditText]       = useState('');
  const [editCat, setEditCat]         = useState('');
  const [addingCat, setAddingCat]     = useState<string | null>(null);
  const [newDraft, setNewDraft]       = useState<NewItemDraft>({ text: '', category: '' });
  const { value: customCategories, setValue: setCustomCats } = useKV<string[]>('checklist_categories', []);
  const [newCatInput, setNewCatInput] = useState('');
  const [showCatForm, setShowCatForm] = useState(false);

  const allCats = [...DEFAULT_CATEGORIES, ...(customCategories || [])];
  const list = items || [];

  const toggle = (id: string) => {
    const next = list.map((item) => item.id === id ? { ...item, done: !item.done } : item);
    setItems(next);
    markActivity(1);
    const toggled = next.find((i) => i.id === id);
    if (toggled?.done) {
      const allDone = next.every((i) => i.done);
      if (allDone) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
        addToast('All items complete! 🎉');
      } else {
        addToast('Checked ✓');
      }
    }
  };

  const deleteItem = (id: string) => {
    setItems(list.filter((i) => i.id !== id));
  };

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditText(item.text);
    setEditCat(item.category);
  };

  const saveEdit = (id: string) => {
    if (!editText.trim()) return;
    setItems(list.map((i) => i.id === id ? { ...i, text: editText.trim(), category: editCat } : i));
    setEditingId(null);
    addToast('Updated ✓');
  };

  const addItem = (category: string) => {
    if (!newDraft.text.trim()) return;
    const id = `ci_${Date.now()}`;
    setItems([...list, { id, text: newDraft.text.trim(), category, done: false }]);
    setNewDraft({ text: '', category: '' });
    setAddingCat(null);
    addToast('Item added ✓');
  };

  const addCategory = () => {
    const cat = newCatInput.trim();
    if (!cat || allCats.includes(cat)) return;
    setCustomCats([...(customCategories || []), cat]);
    setNewCatInput('');
    setShowCatForm(false);
    addToast(`Category "${cat}" added ✓`);
  };

  const done  = list.filter((i) => i.done).length;
  const total = list.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  // Group items by category
  const grouped = allCats
    .map((cat) => ({ cat, items: list.filter((i) => i.category === cat) }))
    .filter((g) => g.items.length > 0 || addingCat === g.cat);

  return (
    <section id="tasks" className="section">
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p className="section-eyebrow">Planning</p>
          <h2 className="section-title">Checklist</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>{done}/{total} done</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowCatForm((v) => !v)}
          >
            {showCatForm ? '✕ Cancel' : '+ Category'}
          </button>
        </div>
      </div>

      {/* Add category form */}
      <AnimatePresence>
        {showCatForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 12 }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                autoFocus
                className="input"
                style={{ flex: 1 }}
                placeholder="New category name…"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') setShowCatForm(false); }}
              />
              <button className="btn btn-amber btn-sm" onClick={addCategory}>Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {allCats.map((c) => (
                <span key={c} style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--bg-raised)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{c}</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div style={{ height: 6, background: 'var(--bg-raised)', borderRadius: 99, overflow: 'hidden', marginBottom: 24 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          style={{ height: '100%', background: pct === 100 ? '#22c55e' : 'var(--amber)', borderRadius: 99 }}
        />
      </div>

      {/* Grouped items */}
      {grouped.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: '0.9rem' }}>
          No items yet. Add a category and start adding items.
        </div>
      )}

      {grouped.map(({ cat, items: catItems }) => (
        <div key={cat} style={{ marginBottom: 24 }}>
          {/* Category header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{cat}</span>
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.72rem', padding: '2px 10px' }}
              onClick={() => { setAddingCat(addingCat === cat ? null : cat); setNewDraft({ text: '', category: cat }); }}
            >
              {addingCat === cat ? '✕' : '+ Item'}
            </button>
          </div>

          {/* Add item form for this category */}
          <AnimatePresence>
            {addingCat === cat && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: 8 }}
              >
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    autoFocus
                    className="input"
                    style={{ flex: 1 }}
                    placeholder={`Add item to ${cat}…`}
                    value={newDraft.text}
                    onChange={(e) => setNewDraft({ text: e.target.value, category: cat })}
                    onKeyDown={(e) => { if (e.key === 'Enter') addItem(cat); if (e.key === 'Escape') setAddingCat(null); }}
                  />
                  <button className="btn btn-amber btn-sm" onClick={() => addItem(cat)}>Add</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Items in this category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {catItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}
              >
                {editingId === item.id ? (
                  /* Edit mode */
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', background: 'var(--bg-base)', border: '1px solid var(--amber)', borderRadius: 10 }}>
                    <input
                      autoFocus
                      className="input"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(item.id); if (e.key === 'Escape') setEditingId(null); }}
                    />
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <select
                        className="input"
                        style={{ flex: 1, fontSize: '0.8rem' }}
                        value={editCat}
                        onChange={(e) => setEditCat(e.target.value)}
                      >
                        {allCats.map((c) => <option key={c}>{c}</option>)}
                      </select>
                      <button className="btn btn-amber btn-sm" onClick={() => saveEdit(item.id)}>Save</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>✕</button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <motion.button
                    onClick={() => toggle(item.id)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '11px 14px',
                      background: item.done ? 'rgba(34,197,94,0.08)' : 'var(--bg-base)',
                      border: `1px solid ${item.done ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                      borderRadius: 10,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                      border: `2px solid ${item.done ? '#22c55e' : 'var(--border-bright)'}`,
                      background: item.done ? '#22c55e' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease', marginTop: 1,
                    }}>
                      <AnimatePresence>
                        {item.done && (
                          <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                            style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>✓</motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <span style={{
                      fontSize: '0.88rem',
                      color: item.done ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: item.done ? 'line-through' : 'none',
                      lineHeight: 1.5, transition: 'all 0.2s ease', flex: 1,
                    }}>
                      {item.text}
                    </span>
                  </motion.button>
                )}

                {/* Edit + Delete buttons */}
                {editingId !== item.id && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignSelf: 'center' }}>
                    <button
                      onClick={() => startEdit(item)}
                      className="btn btn-ghost btn-icon"
                      style={{ fontSize: '0.7rem', padding: '4px 7px', color: 'var(--text-muted)' }}
                      title="Edit item"
                    >✏️</button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="btn btn-ghost btn-icon"
                      style={{ color: 'var(--coral)', fontSize: '0.7rem', padding: '4px 7px' }}
                      title="Delete item"
                    >✕</button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* "Add to uncategorized" section for empty categories */}
      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {allCats.filter((c) => !grouped.find((g) => g.cat === c)).map((cat) => (
          <button
            key={cat}
            className="btn btn-ghost btn-sm"
            onClick={() => { setAddingCat(cat); setNewDraft({ text: '', category: cat }); }}
          >
            + Add to {cat}
          </button>
        ))}
      </div>

      {done === total && total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 20, padding: '16px 20px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, textAlign: 'center', color: '#22c55e', fontWeight: 600 }}
        >
          🚀 All items complete — campaign ready to launch.
        </motion.div>
      )}
    </section>
  );
}
