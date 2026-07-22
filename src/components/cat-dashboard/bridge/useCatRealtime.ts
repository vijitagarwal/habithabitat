/**
 * useCatRealtime.ts — bridge for CAT sections
 * Identical logic to mission-cat-pro/src/hooks/useRealtime.ts
 * but uses the habit-tracker's supabase client.
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type RealtimeStatus = 'connecting' | 'connected' | 'disconnected';

export function useRealtime(
  table: string,
  onChange: () => void,
  enabled = true,
): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const channelName = useRef(`rt-${table}-${Math.random().toString(36).slice(2, 9)}`);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel(channelName.current)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        onChangeRef.current();
      })
      .subscribe((s) => {
        if (s === 'SUBSCRIBED')    setStatus('connected');
        if (s === 'CLOSED')        setStatus('disconnected');
        if (s === 'CHANNEL_ERROR') setStatus('disconnected');
      });
    return () => { supabase.removeChannel(channel); };
  }, [table, enabled]);

  return status;
}

export function useRealtimeStatus(): boolean {
  const [connected, setConnected] = useState(false);
  const channelName = useRef(`rt-heartbeat-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    const channel = supabase
      .channel(channelName.current)
      .subscribe((s) => { setConnected(s === 'SUBSCRIBED'); });
    return () => { supabase.removeChannel(channel); };
  }, []);

  return connected;
}
