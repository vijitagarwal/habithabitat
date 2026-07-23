import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKV } from '../bridge';
import { useToast } from '../bridge';

interface TechItem {
  id: string;
  phase: string;   // date range label e.g. "Jul 1 – Aug 2"
  label: string;   // short title
  desc: string;    // description
  startDate: string; // ISO date for timeline ordering e.g. "2026-07-01"
}

const SEED: TechItem[] = [
  { id: 'tl1', phase: 'Pre Jul 1',       label: 'Embeddings Ramp-Up',  startDate: '2026-06-29', desc: 'Complete the embeddings reading and concept gap survey before FlyRank day-one.' },
  { id: 'tl2', phase: 'Jul 1 – Aug 2',   label: 'FlyRank Deep Work',   startDate: '2026-07-01', desc: 'Build the core product: embeddings, clustering, intent classification. Ship weekly.' },
  { id: 'tl3', phase: 'Aug 3 – Aug 14',  label: 'FlyRank Wrap-Up',     startDate: '2026-08-03', desc: 'Finish all deliverables and produce a portfolio-ready case study.' },
  { id: 'tl4', phase: 'Aug 15 – Sep 30', label: 'Portfolio Build',     startDate: '2026-08-15', desc: 'Convert FlyRank output to a public artifact. No new projects — solidify what exists.' },
  { id: 'tl5', phase: 'Oct 1 – Nov 29',  label: 'DSA Floor Only',      startDate: '2026-10-01', desc: 'One problem per day, no exceptions. Keep the streak alive. Nothing new starts.' },
];

function isoToDate(iso: string) { return new Date(iso + 'T00:00:00'); }

export default function TechLadder() {
  const { value: items, setValue: setItems } = useKV<TechItem[]>('tech_ladder', SEED);
  const { addToast } = useToast();

  const [adding, setAdding]       = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft]         = useState<Omit<TechItem, 'id'>>({ phase: '', label: '', desc: '', startDate: '' });

  const list = [...(items || [])].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const now  = new Date();

  const addItem = () => {
    if (!draft.label.trim() || !draft.startDate) { addToast('Label and start date are required.'); return; }
    const id = `tl_${Date.now()}`;
    setItems([...(items || []), { id, ...draft }]);
    setDraft({ phase: '', label: '', desc: '', startDate: '' });
    setAdding(false);
    addToast('Entry added ✓');
  };

  const startEdit = (item: TechItem) => {
    setEditingId(item.id);
    setDraft({ phase: item.phase, label: item.label, desc: item.desc, startDate: item.startDate });
  };

  const saveEdit = (id: string) => {
    if (!draft.label.trim() || !draft.startDate) return;
    setItems((items || []).map((i) => i.id === id ? { ...i, ...draft } : i));
    setEditingId(null);
    addToast('Updated ✓');
  };

  const deleteItem = (id: string) => {
    setItems((items || []).filter((i) => i.id !== id));
    addToast('Removed');
  };

  return (
    <section id="tech" className="section">
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p className="section-eyebrow">Strategy</p>
          <h2 className="section-title">Tech Ladder</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
            Technology commitments, ordered chronologically. Nothing new starts in Phase 3.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { setAdding((v) => !v); setDraft({ phase: '', label: '', desc: '', startDate: '' }); }}>
          {adding ? '✕ Cancel' : '+ Add entry'}
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 20 }}
          >
            <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Label / Title *</label>
                  <input className="input" placeholder="e.g. FlyRank Deep Work" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Phase date label</label>
                  <input className="input" placeholder="e.g. Jul 1 – Aug 2" value={draft.phase} onChange={(e) => setDraft({ ...draft, phase: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Start date * (for ordering)</label>
                <input type="date" className="input" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea className="input" rows={2} style={{ resize: 'vertical' }} placeholder="What does this phase involve?" value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} />
              </div>
              <button className="btn btn-amber btn-sm" onClick={addItem} style={{ alignSelf: 'flex-start' }}>Add entry</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingLeft: 50 }}>
          {list.map((item) => {
            const start     = isoToDate(item.startDate);
            const nextItem  = list[list.findIndex((i) => i.id === item.id) + 1];
            const end       = nextItem ? isoToDate(nextItem.startDate) : new Date('2026-11-30');
            const isCurrent = now >= start && now < end;
            const isPast    = now >= end;
            const isEditing = editingId === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ position: 'relative' }}
              >
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute', left: -38, top: 16,
                  width: 14, height: 14, borderRadius: '50%',
                  background: isCurrent ? 'var(--amber)' : isPast ? 'var(--teal)' : 'var(--border)',
                  border: `2px solid ${isCurrent ? 'var(--amber-glow)' : 'var(--bg-deep)'}`,
                  boxShadow: isCurrent ? '0 0 0 4px var(--amber-dim)' : 'none',
                  transition: 'all 0.3s ease',
                }} />

                {isEditing ? (
                  /* Edit mode card */
                  <div className="card" style={{ padding: '14px', borderColor: 'var(--amber)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Title *</label>
                        <input className="input" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Phase label</label>
                        <input className="input" value={draft.phase} onChange={(e) => setDraft({ ...draft, phase: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Start date *</label>
                      <input type="date" className="input" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Description</label>
                      <textarea className="input" rows={2} style={{ resize: 'vertical' }} value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-amber btn-sm" onClick={() => saveEdit(item.id)}>Save</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  /* View mode card */
                  <div className="card" style={{ padding: '14px 18px', borderColor: isCurrent ? 'var(--amber)' : isPast ? 'rgba(63,175,168,0.3)' : 'var(--border)', opacity: isPast ? 0.7 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          {item.phase && <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.phase}</span>}
                          {isCurrent && <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--amber-dim)', color: 'var(--amber)', fontSize: '0.68rem', fontWeight: 700 }}>CURRENT</span>}
                          {isPast    && <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(63,175,168,0.12)', color: 'var(--teal)', fontSize: '0.68rem', fontWeight: 700 }}>DONE</span>}
                        </div>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '0.95rem', color: isCurrent ? 'var(--amber)' : 'var(--text-primary)', marginBottom: 4 }}>{item.label}</div>
                        {item.desc && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button onClick={() => startEdit(item)} className="btn btn-ghost btn-icon" style={{ fontSize: '0.7rem', padding: '4px 7px', color: 'var(--text-muted)' }} title="Edit">✏️</button>
                        <button onClick={() => deleteItem(item.id)} className="btn btn-ghost btn-icon" style={{ color: 'var(--coral)', fontSize: '0.7rem', padding: '4px 7px' }} title="Delete">✕</button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}

          {list.length === 0 && (
            <div style={{ paddingLeft: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>
              No entries yet. Click "+ Add entry" to build your tech ladder.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
