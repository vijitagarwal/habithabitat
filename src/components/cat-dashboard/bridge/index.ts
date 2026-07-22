/**
 * cat-bridge/index.ts
 *
 * Re-exports that allow copied CAT sections to work inside the
 * habit-tracker without any changes to the section files.
 */

import { supabase as _typedSupabase } from '@/integrations/supabase/client';

// ── Supabase: exported as `any` so sections can call .from() on CAT-specific
// tables (kv_store, error_log, mock_results, profiles, etc.) without TS errors.
// Both apps share the same Supabase project — safe at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = _typedSupabase as any;

// ── Auth ──────────────────────────────────────────────────────────────
export { useCatAuth as useAuth, CatAuthProvider as AuthProvider } from './useCatAuth';

// ── Realtime, KV, Activity, Toast ─────────────────────────────────────
export { useRealtime, useRealtimeStatus } from './useCatRealtime';
export { useKV } from './useCatKV';
export { useActivity } from './useCatActivity';
export { useToast, ToastProvider } from './useCatToast';
