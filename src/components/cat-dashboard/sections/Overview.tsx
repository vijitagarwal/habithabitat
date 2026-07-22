import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DATE_CFG } from '../data/dates';
import { getStatus, getCampaignProgress, pad2 } from '../engine/schedule';
import { useKV } from '../bridge';
import { useAuth } from '../bridge';
import { supabase } from '../bridge';
import { SegmentedBar } from '../ui/ProgressBar';
import type { BreathLog, MeditateLog } from '../types';
import { CHECKLIST } from '../data/static';

export default function Overview() {
  const { user } = useAuth();
  const [diff, setDiff] = useState(0);
  const [pct, setPct]   = useState(0);
  const [dayNum, setDayNum] = useState(0);
  const [phase, setPhase]   = useState('');
  const [errorCount, setErrorCount] = useState(0);

  const { value: breathLog }  = useKV<BreathLog>('breath_log', { streak: 0, total: 0, lastDate: '' });
  const { value: medLog }     = useKV<MeditateLog>('meditate_log', { streak: 0, total: 0, totalMinutes: 0, lastDate: '' });
  const { value: checklist }  = useKV<Record<string, boolean>>('checklist', {});

  // Countdown
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setDiff(Math.max(0, DATE_CFG.EXAM_DATE.getTime() - now.getTime()));
      const { pct: p, dayNum: dn } = getCampaignProgress(DATE_CFG, now);
      setPct(p);
      setDayNum(dn);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      setPhase(getStatus(today, DATE_CFG).phase);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Error count
  useEffect(() => {
    if (!user) return;
    supabase.from('error_log').select('id', { count: 'exact' }).eq('user_id', user.id)
      .then(({ count }: { count: number | null }) => setErrorCount(count || 0));
  }, [user]);

  const d = Math.floor(diff / 86400000);
  const h = pad2(Math.floor((diff % 86400000) / 3600000));
  const m = pad2(Math.floor((diff % 3600000) / 60000));
  const s = pad2(Math.floor((diff % 60000) / 1000));

  const checkDone  = CHECKLIST.filter((c) => checklist[c.id]).length;
  const checkTotal = CHECKLIST.length;

  // Campaign segments
  const totalDays = 154;
  const p1End = Math.round((new Date(2026, 7, 14).getTime() - DATE_CFG.CAMPAIGN_START.getTime()) / 86400000);
  const p2End = Math.round((new Date(2026, 9, 1).getTime()  - DATE_CFG.CAMPAIGN_START.getTime()) / 86400000);
  const segments = [
    { pct: (p1End / totalDays) * 100,                   color: 'var(--coral)', label: 'Phase 1' },
    { pct: ((p2End - p1End) / totalDays) * 100,          color: 'var(--teal)',  label: 'Phase 2' },
    { pct: ((totalDays - p2End) / totalDays) * 100,      color: 'var(--amber)', label: 'Phase 3' },
  ];

  const metrics = [
    { label: 'Breath Streak', value: `${breathLog.streak}d`,                icon: '🌬️', color: 'var(--lav)' },
    { label: 'Med Minutes',   value: `${medLog.totalMinutes}m`,              icon: '🧘', color: 'var(--teal)' },
    { label: 'Checklist',     value: `${checkDone}/${checkTotal}`,           icon: '✅', color: 'var(--amber)' },
    { label: 'Errors Logged', value: String(errorCount),                     icon: '🔍', color: 'var(--coral)' },
  ];

  // Circular ring around days
  const ringPct = pct;
  const radius  = 52;
  const circ    = 2 * Math.PI * radius;
  const dashOffset = circ * (1 - ringPct / 100);

  return (
    <section id="overview" className="section">
      <div style={{ marginBottom: 8 }}>
        <p className="section-eyebrow">Mission Control</p>
        <h2 className="section-title">Overview</h2>
      </div>

      {/* Countdown + progress row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', marginBottom: 24 }}>
        {/* Circular ring + days */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}
        >
          <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="65" cy="65" r={radius} fill="none" stroke="var(--bg-raised)" strokeWidth="5" />
            <circle
              cx="65" cy="65" r={radius} fill="none"
              stroke="var(--amber)" strokeWidth="5"
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Space Grotesk', fontSize: '2rem', fontWeight: 700, color: 'var(--amber)', lineHeight: 1 }}>
              {d}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>days</span>
          </div>
        </motion.div>

        {/* Right side: HH:MM:SS + progress bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            {[{ v: h, l: 'hrs' }, { v: m, l: 'min' }, { v: s, l: 'sec' }].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
              </div>
            ))}
            <div style={{ marginLeft: 8 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>until CAT 2026</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--amber)', fontWeight: 500 }}>Day {dayNum} • {phase}</div>
            </div>
          </div>

          {/* Campaign progress bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SegmentedBar segments={segments} todayPct={pct} height={8} />
            <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--coral)' }}>● Phase 1</span>
              <span style={{ color: 'var(--teal)' }}>● Phase 2</span>
              <span style={{ color: 'var(--amber)' }}>● Phase 3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card"
            style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '1rem' }}>{m.icon}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                {m.label}
              </span>
            </div>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem', fontWeight: 700, color: m.color, lineHeight: 1 }}>
              {m.value}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
