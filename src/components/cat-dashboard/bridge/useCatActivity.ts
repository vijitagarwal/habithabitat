/**
 * useCatActivity.ts — bridge for CAT sections
 * Uses `any` cast for daily_activity table.
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCatAuth } from './useCatAuth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useActivity() {
  const { user } = useCatAuth();

  const markActivity = useCallback(async (delta = 1) => {
    if (!user) return;
    const date = todayKey();

    const { data: existing } = await db
      .from('daily_activity')
      .select('id, score')
      .eq('user_id', user.id)
      .eq('date', date)
      .maybeSingle();

    if (existing) {
      await db
        .from('daily_activity')
        .update({ score: (existing.score || 0) + delta })
        .eq('id', existing.id);
    } else {
      await db
        .from('daily_activity')
        .insert({ user_id: user.id, date, score: delta });
    }
  }, [user]);

  return { markActivity };
}
