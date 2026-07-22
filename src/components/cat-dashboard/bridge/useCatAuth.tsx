/**
 * useCatAuth.tsx — bridge for CAT sections
 * Provides useAuth() matching the shape CAT sections expect,
 * powered by the habit-tracker's shared Supabase session.
 *
 * Uses `any` casts for CAT-specific tables (profiles, kv_store, etc.)
 * that exist in the shared project but aren't in the habit-tracker's
 * generated Database type.
 */

import {
  createContext, useContext, useEffect, useState, useCallback, type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Bypass typed client for CAT-specific tables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Profile {
  id: string;
  exam_date: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface CatAuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const CatAuthContext = createContext<CatAuthContextType>(null!);

async function seedIfNeeded(userId: string) {
  const { data: existing } = await db
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!existing) {
    await db.from('profiles').insert({ id: userId, exam_date: '2026-11-29' });
  }
}

export function CatAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    await seedIfNeeded(userId);
    const { data } = await db
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data as Profile | null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) loadProfile(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT') {
        setSession(null); setProfile(null); setLoading(false);
      } else if (s?.user) {
        setSession(s);
        loadProfile(s.user.id).catch(console.error);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <CatAuthContext.Provider value={{
      session, user: session?.user ?? null, profile, loading, signIn, signOut,
    }}>
      {children}
    </CatAuthContext.Provider>
  );
}

export function useCatAuth() {
  return useContext(CatAuthContext);
}
