import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../bridge';
import { useAuth } from '../bridge';
import { useRealtime } from '../bridge';
import { useActivity } from '../bridge';
import { useToast } from '../bridge';
import { DEFAULT_TOPICS, STATUS_ORDER, nextStatus, STATUS_COLORS } from '../data/topics';
import type { TopicProgress } from '../types';

export default function TopicTracker() {
  const { user } = useAuth();
  const { markActivity } = useActivity();
  const { addToast } = useToast();
  const [topics, setTopics] = useState<TopicProgress[]>([]);
  const [filter, setFilter] = useState<TopicProgress['section'] | 'All'>('All');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('topic_progress').select('*').eq('user_id', user.id).order('section').order('topic_name');
    if (data) setTopics(data as TopicProgress[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useRealtime('topic_progress', load);

  const cycleStatus = useCallback(async (topic: TopicProgress) => {
    const next = nextStatus(topic.status);
    setTopics((prev) => prev.map((t) => t.id === topic.id ? { ...t, status: next, updated_at: new Date().toISOString() } : t));
    await supabase.from('topic_progress').update({ status: next, updated_at: new Date().toISOString() }).eq('id', topic.id!);
    markActivity(1);
    if (next === 'Mastered') addToast(`🎉 ${topic.topic_name} — Mastered!`);
  }, [markActivity, addToast]);

  const setConfidence = useCallback(async (topic: TopicProgress, conf: number) => {
    setTopics((prev) => prev.map((t) => t.id === topic.id ? { ...t, confidence: conf } : t));
    await supabase.from('topic_progress').update({ confidence: conf, updated_at: new Date().toISOString() }).eq('id', topic.id!);
  }, []);

  const filtered = topics.filter((t) => {
    if (filter !== 'All' && t.section !== filter) return false;
    if (search && !t.topic_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Stats per section
  const stats = (['QA', 'DILR', 'VARC'] as const).map((sec) => {
    const secTopics = topics.filter((t) => t.section === sec);
    const mastered  = secTopics.filter((t) => t.status === 'Mastered').length;
    const pct       = secTopics.length ? Math.round((mastered / secTopics.length) * 100) : 0;
    return { sec, total: secTopics.length, mastered, pct };
  });

  // Group by section for display
  const grouped = (['QA', 'DILR', 'VARC'] as const).reduce((acc, sec) => {
    acc[sec] = filtered.filter((t) => t.section === sec);
    return acc;
  }, {} as Record<string, TopicProgress[]>);

  return (
    <section id="syllabus" className="section">
      <div style={{ marginBottom: 20 }}>
        <p className="section-eyebrow">Tracking</p>
        <h2 className="section-title">Topic Tracker</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
          Click any topic to cycle its status forward.
        </p>
      </div>

      {/* Section summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))', gap: 12, marginBottom: 16 }}>
        {stats.map(({ sec, total, mastered, pct }) => (
          <div key={sec} className="card" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '0.9rem' }}>{sec}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--amber)', fontWeight: 600 }}>{mastered}/{total}</span>
            </div>
            <div style={{ height: 5, background: 'var(--bg-raised)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6 }}
                style={{ height: '100%', background: 'var(--amber)', borderRadius: 99 }}
              />
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{pct}% mastered</div>
          </div>
        ))}
      </div>

      {/* Status legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {STATUS_ORDER.map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_COLORS[s], display: 'inline-block', flexShrink: 0 }} />
            {s}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['All', 'QA', 'DILR', 'VARC'] as const).map((sec) => (
          <button key={sec} className={`btn ${filter === sec ? 'btn-amber' : 'btn-ghost'} btn-sm`} onClick={() => setFilter(sec)}>{sec}</button>
        ))}
        <input className="input" placeholder="Search topics…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 180 }} />
      </div>

      {/* Topics grid */}
      {(['QA', 'DILR', 'VARC'] as const).map((sec) => {
        const secFiltered = grouped[sec] || [];
        if (!secFiltered.length) return null;
        return (
          <div key={sec} style={{ marginBottom: 20 }}>
            {(filter === 'All' || filter === sec) && (
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{sec}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {secFiltered.map((t, i) => (
                <motion.div
                  key={t.id || t.topic_name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    borderLeft: `3px solid ${STATUS_COLORS[t.status]}`,
                    borderRadius: 8, cursor: 'default',
                  }}
                >
                  {/* Click name to cycle status */}
                  <button
                    onClick={() => cycleStatus(t)}
                    style={{
                      flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                      textAlign: 'left', padding: 0,
                    }}
                    title="Click to advance status"
                  >
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{t.topic_name}</span>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>
                      {t.status}
                      {t.updated_at && (
                        <span style={{ marginLeft: 6 }}>
                          · {new Date(t.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Confidence stars 1–5 */}
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    {[1,2,3,4,5].map((star) => (
                      <button
                        key={star}
                        onClick={(e) => { e.stopPropagation(); setConfidence(t, star === t.confidence ? 0 : star); }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px',
                          fontSize: '0.75rem',
                          color: (t.confidence || 0) >= star ? 'var(--amber)' : 'var(--text-muted)',
                          opacity: (t.confidence || 0) >= star ? 1 : 0.35,
                          transition: 'all 0.15s',
                        }}
                        title={`Confidence: ${star}/5`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  {/* Status pill */}
                  <span
                    style={{
                      fontSize: '0.65rem', fontWeight: 600,
                      padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                      background: STATUS_COLORS[t.status] + '22',
                      color: STATUS_COLORS[t.status],
                    }}
                  >
                    {t.status.replace(' ', '\u00A0')}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
