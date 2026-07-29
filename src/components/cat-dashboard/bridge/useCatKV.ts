/**
 * useCatKV.ts — bridge for CAT sections
 * Identical to mission-cat-pro/src/hooks/useKV.ts
 * but uses the habit-tracker's supabase client.
 *
 * Note: We cast the supabase client to `any` for CAT-specific table access
 * (kv_store, profiles, error_log, etc.) because those tables exist in the
 * shared Supabase project but are NOT in the habit-tracker's generated types.
 * This is safe because both apps share the same Supabase project.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCatAuth } from "./useCatAuth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useKV<T>(
  key: string,
  defaultValue: T,
): {
  value: T;
  setValue: (v: T) => Promise<void>;
  loading: boolean;
} {
  const { user } = useCatAuth();
  const [value, setValueState] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const pendingRef = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const fetchValue = async () => {
      try {
        const { data } = await db
          .from("kv_store")
          .select("value")
          .eq("user_id", user.id)
          .eq("key", key)
          .maybeSingle();
        if (cancelled) return;
        if (data?.value !== undefined && data?.value !== null) {
          setValueState(data.value as T);
        } else {
          const local = localStorage.getItem(`mcp_kv_${key}`);
          if (local) {
            try {
              setValueState(JSON.parse(local) as T);
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        const local = localStorage.getItem(`mcp_kv_${key}`);
        if (local) {
          try {
            setValueState(JSON.parse(local) as T);
          } catch {
            /* ignore */
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchValue();

    const handleUpdate = (e: Event) => {
      const event = e as CustomEvent<{ key: string; value: T }>;
      if (event.detail.key === key) {
        setValueState(event.detail.value);
      }
    };
    window.addEventListener("mcp_kv_update", handleUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("mcp_kv_update", handleUpdate);
    };
  }, [user, key]);

  const setValue = useCallback(
    async (newValue: T) => {
      setValueState(newValue);
      localStorage.setItem(`mcp_kv_${key}`, JSON.stringify(newValue));
      window.dispatchEvent(new CustomEvent("mcp_kv_update", { detail: { key, value: newValue } }));
      pendingRef.current = newValue;
      if (!user) return;
      try {
        await db
          .from("kv_store")
          .upsert(
            { user_id: user.id, key, value: newValue, updated_at: new Date().toISOString() },
            { onConflict: "user_id,key" },
          );
      } catch {
        /* queued in localStorage */
      }
    },
    [user, key],
  );

  return { value, setValue, loading };
}
