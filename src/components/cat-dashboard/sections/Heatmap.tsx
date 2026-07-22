import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../bridge';
import { useAuth } from '../bridge';
import type { DailyActivity } from '../types';

const DAYS_TO_SHOW = 154; // full campaign
const WEEK_LABELS  = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function levelFor(score: number): 0 | 1 | 2 | 3 | 4 {
  if (score === 0) return 0;
  if (score < 3)  return 1;
  if (score < 6)  return 2;
  if (score < 10) return 3;
  return 4;
}

function buildCalendarCells(rows: DailyActivity[], campaignStart: Date) {
  const cells: { date: string; score: number; level: 0 | 1 | 2 | 3 | 4 }[] = [];
  const map = new Map(rows.map((r) => [r.date, r.score]));

  // Pad so first week starts on Sunday
  const startDay = campaignStart.getDay(); // 0=Sun
  for (let i = 0; i < startDay; i++) cells.push({ date: '', score: 0, level: 0 });

  for (let d = 0; d < DAYS_TO_SHOW; d++) {
    const dt   = new Date(campaignStart);
    dt.setDate(dt.getDate() + d);
    const key  = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const score = map.get(key) || 0;
    cells.push({ date: key, score, level: levelFor(score) });
  }
  return cells;
}

export default function Heatmap() {
  const { user } = useAuth();
  const [rows, setRows]       = useState<DailyActivity[]>([]);
  const [tooltip, setTooltip] = useState<{ date: string; score: number } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('daily_activity').select('*').eq('user_id', user.id).order('date');
    if (data) setRows(data as DailyActivity[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const campaignStart = new Date(2026, 5, 29); // Jun 29
  const cells = buildCalendarCells(rows, campaignStart);

  // Grid = cells grouped into weeks (columns)
  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const totalActiveDays = rows.filter((r) => r.score > 0).length;
  const currentStreak   = (() => {
    const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    let expected = today;
    for (const r of sorted) {
      if (r.date === expected && r.score > 0) {
        streak++;
        const d = new Date(expected);
        d.setDate(d.getDate() - 1);
        expected = d.toISOString().slice(0, 10);
      } else break;
    }
    return streak;
  })();

  return (
    <section id="heatmap" className="section">
      <div style={{ marginBottom: 20 }}>
        <p className="section-eyebrow">Tracking</p>
        <h2 className="section-title">Activity Heatmap</h2>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Active days', value: totalActiveDays },
          { label: 'Current streak', value: `${currentStreak}d` },
          { label: 'Campaign days', value: DAYS_TO_SHOW },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: '10px 14px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 700, color: 'var(--amber)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="card" style={{ padding: 20, overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {/* Day labels column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 4, paddingTop: 18 }}>
            {WEEK_LABELS.map((l, i) => (
              <div key={i} style={{ height: 12, fontSize: '0.6rem', color: 'var(--text-muted)', width: 10, lineHeight: '12px', textAlign: 'center' }}>{l}</div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Month label on first day of month */}
              <div style={{ height: 14, fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {week[0]?.date && week[0].date.endsWith('-01') ? week[0].date.slice(5, 7) + '/' : ''}
              </div>
              {week.map((cell, di) => (
                <div
                  key={di}
                  className={`heat-cell level-${cell.level}`}
                  title={cell.date ? `${cell.date}: ${cell.score} pts` : ''}
                  onMouseEnter={() => cell.date ? setTooltip({ date: cell.date, score: cell.score }) : undefined}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ background: cell.date ? undefined : 'transparent' }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <div key={l} className={`heat-cell level-${l}`} />
          ))}
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-raised)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: '0.8rem',
            color: 'var(--text-primary)',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          {tooltip.date} — {tooltip.score} pts
        </motion.div>
      )}
    </section>
  );
}
