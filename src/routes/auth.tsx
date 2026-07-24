import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, Mail, Lock, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: AuthPage,
});

type AuthMode = "signin" | "signup" | "magic";

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) nav({ to: "/dashboard" });
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setInfo(null); setBusy(true);
    try {
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setInfo("✅ Magic link sent! Check your inbox and click the link to sign in.");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        setInfo("Check your inbox to confirm your email, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setErr(null); setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/dashboard" },
      });
      if (error) throw error;
    } catch (e: any) {
      setErr(e?.message ?? "Google sign-in failed");
      setBusy(false);
    }
  }

  const modeLabel = mode === "signup" ? "Create account" : mode === "magic" ? "Magic link" : "Sign in";

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Aurora background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="aurora-orb absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-3xl" />
        <div className="aurora-orb absolute top-1/3 -right-40 h-[26rem] w-[26rem] rounded-full bg-[oklch(0.72_0.18_55)]/15 blur-3xl" style={{ animationDelay: "-4s" }} />
        <div className="aurora-orb absolute -bottom-40 left-1/4 h-[24rem] w-[24rem] rounded-full bg-[oklch(0.62_0.2_155)]/15 blur-3xl" style={{ animationDelay: "-8s" }} />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo / Brand */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand shadow-xl shadow-primary/30">
              <GraduationCap className="h-9 w-9 text-white" />
            </div>
            <div className="text-[10px] font-semibold tracking-[0.25em] text-muted-foreground">UNIFIED MISSION CONTROL</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Habit + CAT Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Your holistic daily operating system</p>
          </div>

          <div className="card-glass rounded-2xl p-8 shadow-2xl">
            {/* Mode tabs */}
            <div className="mb-6 flex rounded-xl border border-border bg-background p-1 text-sm">
              {(["signin", "signup", "magic"] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
                    mode === m ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => { setMode(m); setErr(null); setInfo(null); }}
                >
                  {m === "signin" ? "Sign in" : m === "signup" ? "Create account" : "Magic link"}
                </button>
              ))}
            </div>

            {/* Mode descriptions */}
            {mode === "magic" && (
              <p className="mb-4 rounded-xl bg-primary/10 p-3 text-xs text-muted-foreground">
                <Mail className="mr-1.5 inline h-3.5 w-3.5 text-primary" />
                Get a sign-in link emailed to you — no password needed. Works with existing accounts too.
              </p>
            )}

            <form onSubmit={submit} className="space-y-3">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary/60"
                />
              </div>

              {mode !== "magic" && (
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password" required minLength={6}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min 6 chars)"
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary/60"
                  />
                </div>
              )}

              {err && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>}
              {info && <p className="rounded-lg bg-success/10 px-3 py-2 text-xs text-success">{info}</p>}

              <button
                type="submit" disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {modeLabel}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
            </div>

            <button
              onClick={google} disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-sm font-medium hover:border-primary/40 hover:bg-card/80 disabled:opacity-60 transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.12A6.98 6.98 0 0 1 5.47 12c0-.74.13-1.45.36-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.96l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            One account gives you access to both your habit tracker and CAT mission control.
          </p>
        </div>
      </div>
    </div>
  );
}
