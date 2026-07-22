import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../bridge';
import { useAuth } from '../bridge';
import { useRealtime } from '../bridge';
import { useActivity } from '../bridge';
import { useToast } from '../bridge';
import { Modal } from '../ui/Modal';
import type { ErrorEntry } from '../types';

const EMPTY: Omit<ErrorEntry, 'id' | 'user_id' | 'created_at'> = {
  date: new Date().toISOString().slice(0, 10),
  question: '',
  type: 'Missed',
  cause: 'Concept Gap',
  fix: '',
  section: 'QA',
  topic: '',
  mock_number: null,
};

export default function ErrorLog() {
  const { user } = useAuth();
  const { markActivity } = useActivity();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [filters, setFilters] = useState({ section: '', cause: '', search: '' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('error_log').select('*').eq('user_id', user.id).order('date', { ascending: false });
    if (data) setErrors(data as ErrorEntry[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useRealtime('error_log', load);

  const save = async () => {
    if (!user || !form.question.trim()) return;
    const row = { ...form, user_id: user.id };
    if (editing) {
      await supabase.from('error_log').update(row).eq('id', editing);
      addToast('Error updated');
    } else {
      await supabase.from('error_log').insert(row);
      addToast('Error logged! Stay sharp 🔍');
      markActivity(2);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ ...EMPTY });
    load();
  };

  const del = async (id: string) => {
    await supabase.from('error_log').delete().eq('id', id);
    setErrors((e) => e.filter((x) => x.id !== id));
    addToast('Entry deleted');
  };

  const openEdit = (e: ErrorEntry) => {
    setEditing(e.id!);
    setForm({ date: e.date, question: e.question, type: e.type, cause: e.cause, fix: e.fix, section: e.section, topic: e.topic || '', mock_number: e.mock_number || null });
    setShowForm(true);
  };

  const filtered = errors.filter((e) => {
    if (filters.section && e.section !== filters.section) return false;
    if (filters.cause  && e.cause  !== filters.cause)   return false;
    if (filters.search && !`${e.question} ${e.topic} ${e.fix}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const causeCounts = ['Concept Gap', 'Silly Mistake', 'Timing'].map((c) => ({
    cause: c, count: errors.filter((e) => e.cause === c).length,
  }));

  const CAUSE_COLORS: Record<string, string> = {
    'Concept Gap': 'var(--coral)',
    'Silly Mistake': 'var(--amber)',
    'Timing': 'var(--teal)',
  };

  return (
    <section id="errorlog" className="section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p className="section-eyebrow">Tracking</p>
          <h2 className="section-title">Error Log</h2>
        </div>
        <button id="add-error" className="btn btn-amber btn-sm" onClick={() => { setShowForm(true); setEditing(null); setForm({ ...EMPTY }); }}>
          + Log error
        </button>
      </div>

      {/* Cause summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {causeCounts.map(({ cause, count }) => (
          <div key={cause} className="card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 700, color: CAUSE_COLORS[cause] }}>{count}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{cause}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="Search errors…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          style={{ maxWidth: 220 }}
        />
        <select className="input" value={filters.section} onChange={(e) => setFilters((f) => ({ ...f, section: e.target.value }))} style={{ maxWidth: 140 }}>
          <option value="">All sections</option>
          {['VARC', 'DILR', 'QA'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input" value={filters.cause} onChange={(e) => setFilters((f) => ({ ...f, cause: e.target.value }))} style={{ maxWidth: 160 }}>
          <option value="">All causes</option>
          {['Concept Gap', 'Silly Mistake', 'Timing'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
          {errors.length === 0 ? 'No errors logged yet. Click "Log error" to start.' : 'No matches.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="card"
              style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}
            >
              <div style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: CAUSE_COLORS[e.cause], marginTop: 6 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{e.question}</div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => openEdit(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem' }}>✏️</button>
                    <button onClick={() => del(e.id!)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem' }}>✕</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{e.date}</span>
                  <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: 4, background: 'var(--bg-raised)', color: CAUSE_COLORS[e.cause] }}>{e.cause}</span>
                  <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: 4, background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>{e.section}{e.topic ? ` · ${e.topic}` : ''}</span>
                </div>
                {e.fix && (
                  <div style={{ marginTop: 6, padding: '6px 10px', background: 'var(--teal-dim)', borderRadius: 6, fontSize: '0.82rem', color: 'var(--teal)', lineHeight: 1.4 }}>
                    Fix: {e.fix}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing ? 'Edit entry' : 'Log an error'} width={480}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label>Date</label><input className="input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
          <div><label>Question / Item</label><textarea className="input" value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} rows={2} placeholder="Describe the question or concept missed" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label>Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ErrorEntry['type'] }))}>
                <option>Missed</option><option>Guessed Right</option>
              </select>
            </div>
            <div>
              <label>Section</label>
              <select className="input" value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value as ErrorEntry['section'] }))}>
                <option>VARC</option><option>DILR</option><option>QA</option><option>General</option>
              </select>
            </div>
          </div>
          <div><label>Root Cause</label>
            <select className="input" value={form.cause} onChange={(e) => setForm((f) => ({ ...f, cause: e.target.value as ErrorEntry['cause'] }))}>
              <option>Concept Gap</option><option>Silly Mistake</option><option>Timing</option>
            </select>
          </div>
          <div><label>Topic (optional)</label><input className="input" value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} placeholder="e.g. Quadratic Equations" /></div>
          <div><label>One-line fix</label><input className="input" value={form.fix} onChange={(e) => setForm((f) => ({ ...f, fix: e.target.value }))} placeholder="The specific action to prevent this again" /></div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
            <button id="save-error" className="btn btn-amber" onClick={save} disabled={!form.question.trim()}>Save entry</button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
