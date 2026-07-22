-- =====================================================================
-- Unified Dashboard Schema Migration
-- Run this on the CAT dashboard's Supabase project: umjrxaczrmcstwajtumh
-- This adds the habit tracker tables to the existing CAT database.
-- The CAT tables (profiles, kv_store, error_log, mock_results,
-- topic_progress, daily_activity, board_cards) already exist.
-- =====================================================================

-- ─── Items (Habits / Tasks) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  category    text NOT NULL DEFAULT 'general',
  kind        text NOT NULL DEFAULT 'habit' CHECK (kind IN ('habit', 'task', 'study')),
  direction   text NOT NULL DEFAULT 'build'  CHECK (direction IN ('build', 'break')),
  unit        text,
  benchmarks  numeric[] NOT NULL DEFAULT '{}',
  schedule    jsonb NOT NULL DEFAULT '{"type":"daily"}',
  priority    int  NOT NULL DEFAULT 0,
  icon        text,
  color       text,
  one_off_date date,
  archived    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast per-user, per-category lookups
CREATE INDEX IF NOT EXISTS items_user_category_idx
  ON public.items (user_id, category)
  WHERE archived = false;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'items_updated_at'
  ) THEN
    CREATE TRIGGER items_updated_at
      BEFORE UPDATE ON public.items
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "items_owner" ON public.items;
CREATE POLICY "items_owner" ON public.items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── Completions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.completions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id     uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  date        date NOT NULL,
  done        boolean NOT NULL DEFAULT false,
  value       numeric,          -- for benchmarked / numeric habits
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id, date)
);

CREATE INDEX IF NOT EXISTS completions_user_date_idx
  ON public.completions (user_id, date);

CREATE INDEX IF NOT EXISTS completions_item_date_idx
  ON public.completions (item_id, date);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'completions_updated_at'
  ) THEN
    CREATE TRIGGER completions_updated_at
      BEFORE UPDATE ON public.completions
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "completions_owner" ON public.completions;
CREATE POLICY "completions_owner" ON public.completions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── Daily Metrics (mood, sleep, water, weight) ────────────────────
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date NOT NULL,
  mood        numeric,   -- 1–5
  sleep       numeric,   -- hours
  water       numeric,   -- glasses
  weight      numeric,   -- kg
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'daily_metrics_updated_at'
  ) THEN
    CREATE TRIGGER daily_metrics_updated_at
      BEFORE UPDATE ON public.daily_metrics
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_metrics_owner" ON public.daily_metrics;
CREATE POLICY "daily_metrics_owner" ON public.daily_metrics
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── Journal Entries ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date NOT NULL,
  note        text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'journal_entries_updated_at'
  ) THEN
    CREATE TRIGGER journal_entries_updated_at
      BEFORE UPDATE ON public.journal_entries
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_entries_owner" ON public.journal_entries;
CREATE POLICY "journal_entries_owner" ON public.journal_entries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── User Settings (habit tracker specific: XP, monthly goal) ──────
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_goal int  NOT NULL DEFAULT 80,
  xp           int  NOT NULL DEFAULT 0,
  level        int  NOT NULL DEFAULT 1,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'user_settings_updated_at'
  ) THEN
    CREATE TRIGGER user_settings_updated_at
      BEFORE UPDATE ON public.user_settings
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_settings_owner" ON public.user_settings;
CREATE POLICY "user_settings_owner" ON public.user_settings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-create user_settings row on new signup
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_settings'
  ) THEN
    CREATE TRIGGER on_auth_user_created_settings
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();
  END IF;
END $$;


-- ─── Enable Realtime on habit tables ────────────────────────────────
-- Run these in the Supabase dashboard under Database > Replication
-- OR via the Supabase CLI:
--   supabase db push (after adding to supabase/migrations/)
-- The SQL equivalent:
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.completions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_settings;


-- ─── Verification queries ───────────────────────────────────────────
-- After running, verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
