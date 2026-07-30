/**
 * ProfileModal.tsx
 *
 * Profile dropdown that appears when clicking the avatar button.
 * Shows: user name, email, editable profile fields, sign-out.
 * Used by both the Habit dashboard Header and the CAT sidebar footer.
 */

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import {
  User,
  Mail,
  MapPin,
  Target,
  BookOpen,
  Phone,
  LogOut,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  target_college: string | null;
  target_percentile: number | null;
  cat_year: number;
  phone: string | null;
  city: string | null;
}

interface Props {
  onSignOut?: () => void;
  /** If true, renders as an icon-only trigger (for narrow sidebars) */
  compact?: boolean;
  position?: "header" | "sidebar";
}

function getInitials(name: string | null, email: string): string {
  if (name && name.trim()) {
    return name
      .trim()
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export const ProfileModal = forwardRef<HTMLButtonElement, Props>(
  ({ onSignOut, compact, position = "header" }, ref) => {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Partial<Profile>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true);
      setEditing(false);
    },
    close: () => setOpen(false),
    toggle: () => {
      setOpen((v) => !v);
      setEditing(false);
    },
    // @ts-ignore - To maintain compatibility with any HTMLButtonElement usages
    click: () => {
      setOpen((v) => !v);
      setEditing(false);
    }
  }) as any);

  // Load session
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email ?? "" });
      }
    });
  }, []);

  // Synchronize draft when profile loads or user is available
  useEffect(() => {
    if (profile) {
      setDraft(profile);
    } else if (user) {
      // Robust fallback if no profile row exists yet
      setDraft({
        display_name: user.email?.split("@")[0] || "",
        cat_year: 2026,
      });
    }
  }, [profile, user]);

  // Load / auto-create profile when user is available
  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    db.from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(async ({ data, error }: { data: Profile | null; error: unknown }) => {
        if (error || !data) {
          const name = user.email.split("@")[0];
          const { data: created } = await db
            .from("profiles")
            .insert({ id: user.id, display_name: name, cat_year: 2026 })
            .select()
            .single();
          if (created) setProfile(created as Profile);
        } else {
          setProfile(data);
        }
      });
  }, [user]);

  // Close on outside click — also accounts for the portal panel in document.body
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const panel = document.getElementById("profile-modal-panel");
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        (!panel || !panel.contains(e.target as Node))
      ) {
        setOpen(false);
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Cleanup hover timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const startEdit = () => {
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    // Reset draft to current profile
    setDraft(profile || {});
  };

  const handleTriggerMouseEnter = () => {
    if (open) return; // already open, nothing to do
    hoverTimerRef.current = setTimeout(() => {
      setOpen(true);
      setEditing(false);
    }, 300);
  };

  const handleTriggerMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data, error } = await db
      .from("profiles")
      .upsert({ id: user.id, ...draft })
      .select()
      .single();

    if (error) {
      console.error("Failed to save profile:", error);
      // Optional: add a toast here if you have a toast hook
      setSaving(false);
      return;
    }

    if (data) setProfile(data as Profile);
    setSaving(false);
    setEditing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut?.();
  };

  const initials = user ? getInitials(profile?.display_name ?? null, user.email) : "??";
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <div ref={containerRef} className="relative overflow-visible">
      {/* ── Avatar trigger button ── */}
      <button
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
          setEditing(false);
        }}
        onMouseEnter={handleTriggerMouseEnter}
        onMouseLeave={handleTriggerMouseLeave}
        title="Profile & Settings"
        className={
          position === "sidebar" && !compact
            ? "flex w-full items-center gap-3 rounded-xl hover:bg-sidebar-accent/50 p-2 text-left transition-colors"
            : `flex items-center gap-2 rounded-full gradient-brand font-bold text-white shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity ${
                compact ? "h-9 w-9 justify-center text-sm" : "h-10 w-10 justify-center text-sm"
              }`
        }
      >
        {position === "sidebar" && !compact ? (
          <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-brand font-bold text-white shadow-md">
              {initials}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-sm font-semibold text-sidebar-foreground">{displayName}</span>
              <span className="truncate text-[10px] text-muted-foreground">{user?.email}</span>
            </div>
            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          </>
        ) : (
          <>
            {initials}
            {!compact && <ChevronDown className="sr-only" />}
          </>
        )}
      </button>

      {/* ── Fixed Centered Modal ── */}
      {open && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => { setOpen(false); setEditing(false); }} />
          <div id="profile-modal-panel" className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40 animate-in zoom-in-95 duration-200">
            {/* Header strip */}
          <div className="relative bg-gradient-to-br from-primary/20 to-brand-2/20 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full gradient-brand text-xl font-bold text-white shadow-lg">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                {profile?.target_college && (
                  <p className="mt-0.5 truncate text-xs text-primary/80">
                    🎯 {profile.target_college}
                  </p>
                )}
              </div>
            </div>
            {/* Edit button */}
            {!editing && (
              <button
                onClick={startEdit}
                className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/70 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <Edit3 className="h-3 w-3" /> Edit
              </button>
            )}
          </div>

          {/* Body */}
          <div className="divide-y divide-border">
            {/* ── View mode ── */}
            {!editing && (
              <div className="space-y-1 px-5 py-3">
                {[
                  {
                    icon: Target,
                    label: "Target Percentile",
                    value: profile?.target_percentile ? `${profile.target_percentile}%ile` : null,
                  },
                  { icon: Trophy, label: "CAT Year", value: `CAT ${profile?.cat_year ?? 2026}` },
                  { icon: MapPin, label: "City", value: profile?.city },
                  { icon: Phone, label: "Phone", value: profile?.phone },
                  { icon: BookOpen, label: "Bio", value: profile?.bio },
                ]
                  .filter((r) => r.value)
                  .map((row) => (
                    <div key={row.label} className="flex items-start gap-2.5 py-1">
                      <row.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {row.label}
                        </p>
                        <p className="truncate text-sm text-foreground">{row.value}</p>
                      </div>
                    </div>
                  ))}
                {!profile?.target_percentile && !profile?.city && !profile?.bio && (
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    Click <strong>Edit</strong> to complete your profile
                  </p>
                )}
              </div>
            )}

            {/* ── Edit mode ── */}
            {editing && (
              <div className="space-y-3 px-5 py-4">
                {/* Display name */}
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Name
                  </label>
                  <input
                    type="text"
                    value={draft.display_name || ""}
                    onChange={(e) => setDraft((d) => ({ ...d, display_name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {/* Bio */}
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Bio / Goal
                  </label>
                  <textarea
                    value={draft.bio ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                    placeholder="e.g. Targeting IIM-A in CAT 2026"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {/* Target college + percentile row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Target IIM
                    </label>
                    <input
                      type="text"
                      value={draft.target_college ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, target_college: e.target.value }))}
                      placeholder="IIM-A, B, C..."
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Target %ile
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={draft.target_percentile ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          target_percentile: parseFloat(e.target.value) || undefined,
                        }))
                      }
                      placeholder="99.5"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                {/* City + Phone row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      City
                    </label>
                    <input
                      type="text"
                      value={draft.city ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                      placeholder="Mumbai"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={draft.phone ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                      placeholder="+91 9876..."
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                {/* Save / Cancel */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {saving ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── Footer: Sign out ── */}
            <div className="px-4 py-3">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
        </div>,
        document.body
      )}
    </div>
    );
  }
);
