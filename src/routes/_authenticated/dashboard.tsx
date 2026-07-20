import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { setStoreUser } from "@/lib/habits-store";
import { Sidebar, NAV } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { StatCards } from "@/components/dashboard/StatCards";
import { WeeklyProgress } from "@/components/dashboard/WeeklyProgress";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { TodaysHabits } from "@/components/dashboard/TodaysHabits";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { TopHabits } from "@/components/dashboard/TopHabits";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { Insights } from "@/components/dashboard/Insights";
import { Achievements } from "@/components/dashboard/Achievements";
import { HabitManager } from "@/components/dashboard/HabitManager";
import { DailyTracker } from "@/components/dashboard/DailyTracker";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { JournalView } from "@/components/dashboard/JournalView";
import { GoalsView } from "@/components/dashboard/GoalsView";
import { MetricTracker, MOOD_CFG, SLEEP_CFG, WATER_CFG, WEIGHT_CFG } from "@/components/dashboard/MetricTracker";
import { GraduationCap, LayoutGrid, LogOut } from "lucide-react";

const search = z.object({
  scope: z.enum(["habit", "cat"]).optional(),
}).parse;

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (s) => search(s),
  component: DashboardPage,
});

function DashboardHome({ onNavigate }: { onNavigate: (v: string) => void }) {
  return (
    <>
      <StatCards />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px] [&>*]:min-w-0">
        <WeeklyProgress />
        <CategoryBreakdown />
        <TodaysHabits />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px] [&>*]:min-w-0">
        <Heatmap />
        <TopHabits />
        <QuickStats />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] [&>*]:min-w-0">
        <Insights />
        <Achievements onViewAll={() => onNavigate("achievements")} />
      </div>
    </>
  );
}

function AnalyticsView() {
  return (
    <div className="space-y-6">
      <StatCards />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <WeeklyProgress />
        <CategoryBreakdown />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] [&>*]:min-w-0">
        <TopHabits />
        <QuickStats />
      </div>
      <Insights />
    </div>
  );
}

const TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Welcome back! Keep going, you're doing amazing. 🚀" },
  daily: { title: "Daily Tracker", subtitle: "Check off habits for any date." },
  calendar: { title: "Calendar View", subtitle: "Browse your month and jump into any day." },
  analytics: { title: "Analytics", subtitle: "Deep dive into your habit performance." },
  heatmap: { title: "Heatmap", subtitle: "Your monthly consistency at a glance." },
  goals: { title: "Goals", subtitle: "Set targets and track how you're pacing." },
  achievements: { title: "Achievements", subtitle: "Milestones unlocked so far." },
  journal: { title: "Journal", subtitle: "Reflect on your day." },
  mood: { title: "Mood Tracker", subtitle: "Log how you feel over time." },
  sleep: { title: "Sleep Tracker", subtitle: "Log nightly sleep." },
  water: { title: "Water Tracker", subtitle: "Stay hydrated." },
  weight: { title: "Weight Tracker", subtitle: "Track your weight trend." },
  settings: { title: "Settings", subtitle: "Manage your habits and data." },
};

function renderView(active: string, onNavigate: (v: string) => void) {
  switch (active) {
    case "dashboard": return <DashboardHome onNavigate={onNavigate} />;
    case "daily": return <DailyTracker />;
    case "calendar": return <CalendarView />;
    case "analytics": return <AnalyticsView />;
    case "heatmap": return <Heatmap />;
    case "goals": return <GoalsView />;
    case "achievements":
      return (
        <div className="space-y-6">
          <Achievements />
          <QuickStats />
        </div>
      );
    case "journal": return <JournalView />;
    case "mood": return <MetricTracker cfg={MOOD_CFG} />;
    case "sleep": return <MetricTracker cfg={SLEEP_CFG} />;
    case "water": return <MetricTracker cfg={WATER_CFG} />;
    case "weight": return <MetricTracker cfg={WEIGHT_CFG} />;
    case "settings": return <HabitManager />;
    default: return <DashboardHome onNavigate={onNavigate} />;
  }
}

function DashboardPage() {
  const { scope = "habit" } = Route.useSearch();
  const nav = useNavigate();
  const [active, setActive] = useState<string>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const meta = TITLES[active] ?? TITLES.dashboard;
  const validKeys = NAV.map((n) => n.key);
  const safeActive = validKeys.includes(active as (typeof validKeys)[number]) ? active : "dashboard";

  // Bind the habit store to the signed-in user's isolated localStorage bucket.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setStoreUser(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setStoreUser(session?.user?.id ?? null);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setStoreUser(null);
    nav({ to: "/auth", replace: true });
  }

  const catActive = scope === "cat";

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar
          active={safeActive}
          onSelect={setActive}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          scope={scope}
          onSignOut={signOut}
        />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {/* Top scope toggle */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="inline-flex rounded-xl border border-border bg-card/60 p-1 text-sm shadow-sm">
              <button
                onClick={() => nav({ to: "/dashboard", search: { scope: "habit" } })}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition ${
                  !catActive ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-4 w-4" /> Habits
              </button>
              <button
                onClick={() => nav({ to: "/dashboard", search: { scope: "cat" } })}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition ${
                  catActive ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <GraduationCap className="h-4 w-4" /> CAT Prep
              </button>
            </div>
            <button
              onClick={signOut}
              className="hidden items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground sm:inline-flex"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
          <Header
            onNavigate={setActive}
            onOpenMenu={() => setMobileOpen(true)}
            title={catActive ? `CAT · ${meta.title}` : meta.title}
            subtitle={catActive ? "Your CAT prep tasks, filtered from your habits." : meta.subtitle}
          />
          {/* Scope filter is applied inside components via the useScope hook (see below). */}
          <ScopeProvider scope={scope}>
            {renderView(safeActive, setActive)}
          </ScopeProvider>
        </main>
      </div>
    </div>
  );
}

// ---------- Scope context (Habit view = all; CAT view = category "CAT Prep") ----------
import { createContext, useContext } from "react";
const ScopeCtx = createContext<"habit" | "cat">("habit");
function ScopeProvider({ scope, children }: { scope: "habit" | "cat"; children: React.ReactNode }) {
  return <ScopeCtx.Provider value={scope}>{children}</ScopeCtx.Provider>;
}
export function useScope() { return useContext(ScopeCtx); }
