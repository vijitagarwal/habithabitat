/**
 * CatDashboardShell.tsx — Production-grade CAT dashboard
 *
 * Design:
 * - Collapsible sidebar (220px expanded / 60px icon-only), matching habit sidebar style
 * - Independent scroll: sidebar nav scrolls separately from main content
 * - h-screen layout: no page-level scroll, each panel scrolls independently
 * - Scope toggle + sign-out in sidebar footer (no redundant topbar buttons)
 * - Compact sticky topbar: hamburger | Mission CAT 2026 | live countdown | stats
 * - Proper card/section wrapper for content area
 */

import { useState, useEffect, Suspense, lazy, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import "./cat-styles.css";
import { ProfileModal } from "@/components/dashboard/ProfileModal";
import {
  Home,
  Zap,
  Map,
  Wind,
  Brain,
  Timer,
  BarChart2,
  BookOpen,
  BookMarked,
  AlertCircle,
  Flame,
  KanbanSquare,
  CheckSquare2,
  Target,
  Code2,
  Pin,
  Shield,
  Heart,
  Download,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useScopedStats } from "@/lib/scope-aware-stats";
import { CatAuthProvider, useCatAuth } from "./bridge/useCatAuth";
import { ToastProvider } from "./bridge/useCatToast";
import { useRealtime } from "./bridge/useCatRealtime";

// ── Lazy-loaded sections ───────────────────────────────────────────────
const Overview = lazy(() => import("./sections/Overview"));
const RightNow = lazy(() => import("./sections/RightNow"));
const CampaignMap = lazy(() => import("./sections/CampaignMap"));
const Breathwork = lazy(() => import("./sections/Breathwork"));
const Meditation = lazy(() => import("./sections/Meditation"));
const FocusTimer = lazy(() => import("./sections/FocusTimer"));
const Analytics = lazy(() => import("./sections/Analytics"));
const MockTracker = lazy(() => import("./sections/MockTracker"));
const TopicTracker = lazy(() => import("./sections/TopicTracker"));
const ErrorLog = lazy(() => import("./sections/ErrorLog"));
const CatHeatmap = lazy(() => import("./sections/Heatmap"));
const WeeklyBoard = lazy(() => import("./sections/WeeklyBoard"));
const Checklist = lazy(() => import("./sections/Checklist"));
const CatCore = lazy(() => import("./sections/CatCore"));
const TechLadder = lazy(() => import("./sections/TechLadder"));
const StandingOrders = lazy(() => import("./sections/StandingOrders"));
const Contingency = lazy(() => import("./sections/Contingency"));
const Health = lazy(() => import("./sections/Health"));
const DataExport = lazy(() => import("./sections/DataExport"));

function SectionFallback() {
  return (
    <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-border bg-card/30">
      <div className="flex flex-col items-center gap-3">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs text-muted-foreground">Loading section…</span>
      </div>
    </div>
  );
}

// ── Nav definition ─────────────────────────────────────────────────────
interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}
interface NavGroup {
  group: string;
  items: NavItem[];
}

const CAT_NAV: NavGroup[] = [
  {
    group: "MISSION",
    items: [
      { id: "overview", label: "Overview", icon: Home },
      { id: "rightnow", label: "Right Now", icon: Zap },
      { id: "campaign", label: "Campaign Map", icon: Map },
    ],
  },
  {
    group: "TOOLS",
    items: [
      { id: "breathe", label: "Breathwork", icon: Wind },
      { id: "meditate", label: "Meditation", icon: Brain },
      { id: "focus", label: "Focus Timer", icon: Timer },
    ],
  },
  {
    group: "TRACKING",
    items: [
      { id: "analytics", label: "Analytics", icon: BarChart2 },
      { id: "mocks", label: "Mock Tests", icon: BookOpen },
      { id: "syllabus", label: "Topic Tracker", icon: BookMarked },
      { id: "errorlog", label: "Error Log", icon: AlertCircle },
      { id: "heatmap", label: "Heatmap", icon: Flame },
    ],
  },
  {
    group: "PLANNING",
    items: [
      { id: "weeklyboard", label: "Weekly Board", icon: KanbanSquare },
      { id: "tasks", label: "Checklist", icon: CheckSquare2 },
    ],
  },
  {
    group: "STRATEGY",
    items: [
      { id: "core", label: "CAT Core", icon: Target },
      { id: "tech", label: "Tech Ladder", icon: Code2 },
      { id: "orders", label: "Standing Orders", icon: Pin },
      { id: "contingency", label: "Contingency", icon: Shield },
    ],
  },
  {
    group: "HEALTH",
    items: [
      { id: "health", label: "Health Protocol", icon: Heart },
      { id: "export", label: "Export / Import", icon: Download },
    ],
  },
];

// ── Countdown ──────────────────────────────────────────────────────────
const EXAM_DATE = new Date("2026-11-29T00:00:00+05:30");
function pad2(n: number) {
  return n.toString().padStart(2, "0");
}
function useCountdown() {
  const [cd, setCd] = useState({ d: 0, h: "00", m: "00", s: "00" });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, EXAM_DATE.getTime() - Date.now());
      setCd({
        d: Math.floor(diff / 86400000),
        h: pad2(Math.floor((diff % 86400000) / 3600000)),
        m: pad2(Math.floor((diff % 3600000) / 60000)),
        s: pad2(Math.floor((diff % 60000) / 1000)),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return cd;
}

// ── Sidebar ────────────────────────────────────────────────────────────
function CatSidebar({
  open,
  collapsed,
  active,
  onNavigate,
  onClose,
  onToggleCollapsed,
  onScopeSwitch,
  onSignOut,
}: {
  open: boolean;
  collapsed: boolean;
  active: string;
  onNavigate: (id: string) => void;
  onClose: () => void;
  onToggleCollapsed: () => void;
  onScopeSwitch: () => void;
  onSignOut: () => void;
}) {
  const { user } = useCatAuth();
  const { overall, streak, todayStats } = useScopedStats();

  const sidebarContent = (
    <div className="flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar">
      {/* ── Header ── */}
      <div
        className={`flex shrink-0 items-center border-b border-sidebar-border px-3 py-3 ${collapsed ? "justify-center" : "justify-between gap-2"}`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-500/20 border border-amber-500/30">
              <GraduationCap className="h-4.5 w-4.5 text-amber-400" strokeWidth={2} size={18} />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">
                MISSION
              </div>
              <div className="truncate text-sm font-bold text-sidebar-foreground">CAT 2026</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/20 border border-amber-500/30">
            <GraduationCap className="h-4.5 w-4.5 text-amber-400" strokeWidth={2} size={18} />
          </div>
        )}
        <button
          onClick={onToggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`rounded-lg border border-sidebar-border bg-card/40 p-1.5 text-sidebar-foreground/70 hover:border-primary/40 hover:text-sidebar-foreground transition-colors ${collapsed ? "hidden lg:flex" : ""}`}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
        {!collapsed && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Quick Stats (expanded only) ── */}
      {!collapsed && (
        <div className="mx-3 mt-3 shrink-0 rounded-xl border border-amber-500/20 bg-amber-500/8 p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-amber-400">
                {todayStats.done}/{todayStats.total}
              </div>
              <div className="text-[10px] text-muted-foreground">Today</div>
            </div>
            <div>
              <div className="text-sm font-bold text-orange-400">{streak}🔥</div>
              <div className="text-[10px] text-muted-foreground">Streak</div>
            </div>
            <div>
              <div
                className={`text-sm font-bold ${overall >= 60 ? "text-green-400" : "text-amber-400"}`}
              >
                {overall}%
              </div>
              <div className="text-[10px] text-muted-foreground">30d avg</div>
            </div>
          </div>
          {user && (
            <div className="mt-2 truncate text-center text-[10px] text-muted-foreground border-t border-amber-500/15 pt-2">
              {user.email}
            </div>
          )}
        </div>
      )}

      {/* ── Nav (independent scroll) ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        {CAT_NAV.map((group) => (
          <div key={group.group} className={collapsed ? "mt-2" : "mt-3"}>
            {!collapsed && (
              <div className="px-3 pb-1 pt-1 text-[10px] font-semibold tracking-[0.15em] text-muted-foreground/70">
                {group.group}
              </div>
            )}
            {collapsed && <div className="mx-auto my-1 h-px w-8 bg-sidebar-border" />}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`flex w-full items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} rounded-xl py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-inner"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer: scope toggle + profile/sign out ── */}
      <div className={`shrink-0 border-t border-sidebar-border p-2 space-y-1`}>
        <button
          onClick={onScopeSwitch}
          title={collapsed ? "Switch to Habit Tracker" : undefined}
          className={`flex w-full items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} rounded-xl py-2 text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground transition-colors`}
        >
          <LayoutGrid className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
          {!collapsed && <span>Habit Tracker</span>}
        </button>
        {/* Profile dropdown (includes sign-out) */}
        <div className={`flex ${collapsed ? "justify-center" : "items-center gap-3 px-1"} py-1`}>
          <ProfileModal onSignOut={onSignOut} compact={collapsed} />
          {!collapsed && (
            <span className="text-sm font-medium text-sidebar-foreground/75">
              Profile &amp; Sign out
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} />}

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex shrink-0 flex-col h-full transition-[width] duration-200 ${collapsed ? "w-[60px]" : "w-[220px]"}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar drawer */}
      {open && (
        <aside className="fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col lg:hidden">
          {sidebarContent}
        </aside>
      )}
    </>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────
function CatTopbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { d, h, m, s } = useCountdown();
  const { overall, streak, todayStats } = useScopedStats();

  return (
    <div className="flex shrink-0 h-12 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm">
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-amber-400" />
        <span
          className="hidden text-sm font-bold text-amber-400 sm:block"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          Mission CAT 2026
        </span>
      </div>

      <div className="hidden items-center sm:flex">
        <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono text-xs text-amber-300">
          {d}d {h}:{m}:{s}
        </span>
      </div>

      <div className="hidden items-center gap-4 text-xs lg:flex">
        <span className="text-muted-foreground">
          Today:{" "}
          <span className="font-semibold text-foreground">
            {todayStats.done}/{todayStats.total}
          </span>
        </span>
        <span className="text-muted-foreground">
          Streak: <span className="font-semibold text-orange-400">{streak}d 🔥</span>
        </span>
        <span className="text-muted-foreground">
          30d:{" "}
          <span className={`font-semibold ${overall >= 60 ? "text-green-400" : "text-amber-400"}`}>
            {overall}%
          </span>
        </span>
      </div>
    </div>
  );
}

// ── Section Router ────────────────────────────────────────────────────
function CatSection({ active }: { active: string }) {
  return (
    <Suspense fallback={<SectionFallback />}>
      {active === "overview" && <Overview />}
      {active === "rightnow" && <RightNow />}
      {active === "campaign" && <CampaignMap />}
      {active === "breathe" && <Breathwork />}
      {active === "meditate" && <Meditation />}
      {active === "focus" && <FocusTimer />}
      {active === "analytics" && <Analytics />}
      {active === "mocks" && <MockTracker />}
      {active === "syllabus" && <TopicTracker />}
      {active === "errorlog" && <ErrorLog />}
      {active === "heatmap" && <CatHeatmap />}
      {active === "weeklyboard" && <WeeklyBoard />}
      {active === "tasks" && <Checklist />}
      {active === "core" && <CatCore />}
      {active === "tech" && <TechLadder />}
      {active === "orders" && <StandingOrders />}
      {active === "contingency" && <Contingency />}
      {active === "health" && <Health />}
      {active === "export" && <DataExport />}
    </Suspense>
  );
}

// ── Inner shell ────────────────────────────────────────────────────────
function CatShellInner() {
  const nav = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("overview");
  const bump = useCallback(() => {}, []);

  useRealtime("daily_activity", bump);
  useRealtime("board_cards", bump);

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  function switchToHabits() {
    nav({ to: "/dashboard", search: { scope: "habit" } });
  }

  return (
    <div className="flex h-full overflow-hidden">
      <CatSidebar
        open={sidebarOpen}
        collapsed={collapsed}
        active={active}
        onNavigate={setActive}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        onScopeSwitch={switchToHabits}
        onSignOut={signOut}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <CatTopbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="cat-shell relative flex-1 overflow-y-auto px-4 sm:px-6 pb-8">
          {/* Ambient background orbs (same as original CAT app) */}
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
          <div className="relative z-10">
            <CatSection active={active} />
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────
export function CatDashboardShell() {
  return (
    <CatAuthProvider>
      <ToastProvider>
        <CatShellInner />
      </ToastProvider>
    </CatAuthProvider>
  );
}
