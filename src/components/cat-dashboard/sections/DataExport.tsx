import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../bridge';
import { useAuth } from '../bridge';
import { useToast } from '../bridge';

export default function DataExport() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [kv, errors, mocks, topics, activity, board] = await Promise.all([
        supabase.from('kv_store').select('*').eq('user_id', user.id),
        supabase.from('error_log').select('*').eq('user_id', user.id),
        supabase.from('mock_results').select('*').eq('user_id', user.id),
        supabase.from('topic_progress').select('*').eq('user_id', user.id),
        supabase.from('daily_activity').select('*').eq('user_id', user.id),
        supabase.from('board_cards').select('*').eq('user_id', user.id),
      ]);

      const backup = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        kv_store: kv.data || [],
        error_log: errors.data || [],
        mock_results: mocks.data || [],
        topic_progress: topics.data || [],
        daily_activity: activity.data || [],
        board_cards: board.data || [],
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `mission-cat-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Backup downloaded ✓');
    } catch {
      addToast('Export failed — try again');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setImporting(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);

        // Upsert tables sequentially — Supabase returns PromiseLike, not Promise
        let restored = 0;
        if (data.kv_store?.length) {
          await supabase.from('kv_store').upsert(data.kv_store.map((r: Record<string,unknown>) => ({ ...r, user_id: user.id })), { onConflict: 'user_id,key' });
          restored++;
        }
        if (data.error_log?.length) {
          await supabase.from('error_log').upsert(data.error_log.map((r: Record<string,unknown>) => ({ ...r, user_id: user.id })));
          restored++;
        }
        if (data.mock_results?.length) {
          await supabase.from('mock_results').upsert(data.mock_results.map((r: Record<string,unknown>) => ({ ...r, user_id: user.id })));
          restored++;
        }
        if (data.topic_progress?.length) {
          await supabase.from('topic_progress').upsert(data.topic_progress.map((r: Record<string,unknown>) => ({ ...r, user_id: user.id })), { onConflict: 'user_id,section,topic_name' });
          restored++;
        }
        if (data.daily_activity?.length) {
          await supabase.from('daily_activity').upsert(data.daily_activity.map((r: Record<string,unknown>) => ({ ...r, user_id: user.id })), { onConflict: 'user_id,date' });
          restored++;
        }
        if (data.board_cards?.length) {
          await supabase.from('board_cards').upsert(data.board_cards.map((r: Record<string,unknown>) => ({ ...r, user_id: user.id })));
          restored++;
        }
        addToast(`Import complete — ${restored} tables restored. Refresh to see changes.`);
      } catch {
        addToast('Import failed — invalid backup file');
      } finally {
        setImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handlePrintPDF = () => {
    addToast('Opening print dialog…');
    setTimeout(() => window.print(), 400);
  };

  return (
    <section id="export" className="section">
      <div style={{ marginBottom: 20 }}>
        <p className="section-eyebrow">Settings</p>
        <h2 className="section-title">Data Export / Import</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
          Your data lives in Supabase and is always backed up. Use JSON export for local copies or to migrate.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {/* Export JSON */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}
        >
          <div style={{ fontSize: '1.8rem' }}>📦</div>
          <div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>Export JSON</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
              Downloads all your data — errors, mocks, topics, board, KV — as a single JSON file.
            </div>
          </div>
          <button id="export-json" className="btn btn-amber btn-sm" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting…' : '↓ Download backup'}
          </button>
        </motion.div>

        {/* Import JSON */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
          style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}
        >
          <div style={{ fontSize: '1.8rem' }}>📂</div>
          <div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>Import JSON</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
              Restore from a previously exported backup. Merges with existing data using upsert.
            </div>
          </div>
          <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
            {importing ? 'Importing…' : '↑ Choose file'}
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} disabled={importing} />
          </label>
        </motion.div>

        {/* Print PDF */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
          style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}
        >
          <div style={{ fontSize: '1.8rem' }}>🖨️</div>
          <div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>Print / Save PDF</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
              Opens the browser print dialog. Use "Save as PDF" to get a snapshot of the current view.
            </div>
          </div>
          <button id="print-pdf" className="btn btn-ghost btn-sm" onClick={handlePrintPDF}>
            🖨️ Print page
          </button>
        </motion.div>
      </div>
    </section>
  );
}
