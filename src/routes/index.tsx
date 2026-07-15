import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
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

function Dashboard() {
  const [active, setActive] = useState("dashboard");

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar active={active} onSelect={setActive} />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Header />
          <StatCards />
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr_320px]">
            <WeeklyProgress />
            <CategoryBreakdown />
            <TodaysHabits />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr_320px]">
            <Heatmap />
            <TopHabits />
            <QuickStats />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
            <Insights />
            <Achievements />
          </div>
        </main>
      </div>
    </div>
  );
}
