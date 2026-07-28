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
import {
  MetricTracker,
  MOOD_CFG,
  SLEEP_CFG,
  WATER_CFG,
  WEIGHT_CFG,
} from "@/components/dashboard/MetricTracker";
import { CatDashboardShell } from "@/components/cat-dashboard/CatDashboardShell";
import { GraduationCap, LayoutGrid } from "lucide-react";
import { ScopeCtx } from "@/lib/scope";
import { QuickLogWidget } from "@/components/dashboard/QuickLogWidget";
import { WeeklyReviewBanner } from "@/components/dashboard/WeeklyReviewBanner";
import { AnalogueClock } from "@/components/dashboard/AnalogueClock";

const searchSchema = z.object({
  scope: z.enum(["habit", "cat"]).optional(),
});
type SearchParams = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (s: Record<string, unknown>): SearchParams => searchSchema.parse(s),
  component: DashboardPage,
});

function DashboardHome({ onNavigate }: { onNavigate: (v: string) => void }) {
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full">
          <StatCards />
        </div>
        <div className="hidden lg:flex shrink-0">
          <AnalogueClock />
        </div>
      </div>
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

function renderView(active: string, onNavigate: (v: string) => void, initialDate?: string) {
  switch (active) {
    case "dashboard":
      return <DashboardHome onNavigate={onNavigate} />;
    case "daily":
      return <DailyTracker initialDate={initialDate} />;
    case "calendar":
      return <CalendarView />;
    case "analytics":
      return <AnalyticsView />;
    case "heatmap":
      return <Heatmap />;
    case "goals":
      return <GoalsView />;
    case "achievements":
      return (
        <div className="space-y-6">
          <Achievements />
          <QuickStats />
        </div>
      );
    case "journal":
      return <JournalView />;
    case "mood":
      return <MetricTracker cfg={MOOD_CFG} />;
    case "sleep":
      return <MetricTracker cfg={SLEEP_CFG} />;
    case "water":
      return <MetricTracker cfg={WATER_CFG} />;
    case "weight":
      return <MetricTracker cfg={WEIGHT_CFG} />;
    case "settings":
      return <HabitManager />;
    default:
      return <DashboardHome onNavigate={onNavigate} />;
  }
}

function DashboardPage() {
  const { scope = "habit" } = Route.useSearch();
  const nav = useNavigate();
  const [active, setActive] = useState<string>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [headerDate, setHeaderDate] = useState<string | undefined>(undefined);
  const meta = TITLES[active] ?? TITLES.dashboard;
  const validKeys = NAV.map((n) => n.key);
  const safeActive = validKeys.includes(active as (typeof validKeys)[number])
    ? active
    : "dashboard";

  const catActive = scope === "cat";

  // Bind the habit store to the signed-in user's isolated localStorage bucket.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setStoreUser(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setStoreUser(session?.user?.id ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setStoreUser(null);
    nav({ to: "/auth", replace: true });
  }

  // ── CAT scope: full CAT dashboard shell (sidebar has scope toggle + sign out)
  if (catActive) {
    return (
      <div className="dark h-screen overflow-hidden bg-background text-foreground">
        <ScopeCtx.Provider value="cat">
          <CatDashboardShell />
          <QuickLogWidget />
        </ScopeCtx.Provider>
      </div>
    );
  }

  // ── Habit scope ───────────────────────────────────────────────────
  return (
    <div className="dark h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-full">
        <Sidebar
          active={safeActive}
          onSelect={setActive}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
        />
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* ── Topbar strip: scope toggle ── */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-background/70 px-4 py-2.5 backdrop-blur-md">
            <div className="flex min-w-0 items-center gap-3">
              <span className="section-eyebrow hidden sm:inline text-muted-foreground/70">
                Workspace
              </span>
              <div className="inline-flex rounded-xl border border-border bg-card/70 p-0.5 shadow-sm">
                <button
                  onClick={() => nav({ to: "/dashboard", search: { scope: "habit" } })}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    !catActive
                      ? "gradient-brand text-white shadow shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" /> Habits
                </button>
                <button
                  onClick={() => nav({ to: "/dashboard", search: { scope: "cat" } })}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    catActive
                      ? "gradient-brand text-white shadow shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GraduationCap className="h-4 w-4" /> CAT Prep
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Signed in</span>
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            </div>
          </div>
          {/* ── Scrollable content ── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Header
              onNavigate={setActive}
              onDateChange={(iso) => {
                setHeaderDate(iso);
                setActive("daily");
              }}
              onOpenMenu={() => setMobileOpen(true)}
              onSignOut={signOut}
              title={meta.title}
              subtitle={meta.subtitle}
            />
            <ScopeCtx.Provider value="habit">
              <WeeklyReviewBanner onNavigate={setActive} />
              {renderView(safeActive, setActive, headerDate)}
            </ScopeCtx.Provider>
          </div>
        </main>
      </div>
      <QuickLogWidget />
    </div>
  );
}
