import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Habit Tracker Dashboard" },
      { name: "description", content: "Track daily habits, streaks, and progress with a premium personal habit tracker dashboard." },
      { property: "og:title", content: "Habit Tracker Dashboard" },
      { property: "og:description", content: "Track daily habits, streaks, and progress with a premium personal habit tracker." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Dashboard,
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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <WeeklyProgress />
        <CategoryBreakdown />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
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

function renderView(active: string) {
  switch (active) {
    case "dashboard": return <DashboardHome />;
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
    default: return <DashboardHome />;
  }
}

function Dashboard() {
  const [active, setActive] = useState<string>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const meta = TITLES[active] ?? TITLES.dashboard;
  // Ensure valid key
  const validKeys = NAV.map((n) => n.key);
  const safeActive = validKeys.includes(active as (typeof validKeys)[number]) ? active : "dashboard";

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
        />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Header
            onNavigate={setActive}
            onOpenMenu={() => setMobileOpen(true)}
            title={meta.title}
            subtitle={meta.subtitle}
          />
          {renderView(safeActive)}
        </main>
      </div>
    </div>
  );
}
