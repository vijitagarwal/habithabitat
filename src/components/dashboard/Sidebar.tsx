import { useState, useRef } from "react";
import {
  LayoutDashboard,
  CalendarCheck2,
  CalendarDays,
  BarChart3,
  Grid3x3,
  Target,
  Trophy,
  NotebookPen,
  Smile,
  Moon,
  Droplets,
  Scale,
  Settings,
  CheckCircle2,
  Quote,
  X,
  LogOut,
  Snowflake,
} from "lucide-react";
import { useHabits } from "@/lib/habits-store";
import { ProfileModal } from "./ProfileModal";

export const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { key: "daily", label: "Daily Tracker", icon: CalendarCheck2, group: "Overview" },
  { key: "calendar", label: "Calendar View", icon: CalendarDays, group: "Overview" },
  { key: "analytics", label: "Analytics", icon: BarChart3, group: "Insights" },
  { key: "heatmap", label: "Heatmap", icon: Grid3x3, group: "Insights" },
  { key: "goals", label: "Goals", icon: Target, group: "Insights" },
  { key: "achievements", label: "Achievements", icon: Trophy, group: "Insights" },
  { key: "journal", label: "Journal", icon: NotebookPen, group: "Wellness" },
  { key: "mood", label: "Mood Tracker", icon: Smile, group: "Wellness" },
  { key: "sleep", label: "Sleep Tracker", icon: Moon, group: "Wellness" },
  { key: "water", label: "Water Tracker", icon: Droplets, group: "Wellness" },
  { key: "weight", label: "Weight Tracker", icon: Scale, group: "Wellness" },
  { key: "settings", label: "Settings", icon: Settings, group: "System" },
] as const;

const GROUP_ORDER = ["Overview", "Insights", "Wellness", "System"] as const;

interface Props {
  active: string;
  onSelect: (k: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onSignOut?: () => void;
}

function SidebarContent({
  active,
  onSelect,
  collapsed = false,
  onClose,
  onSignOut,
}: {
  active: string;
  onSelect: (k: string) => void;
  collapsed?: boolean;
  onClose?: () => void;
  onSignOut?: () => void;
}) {
  const s = useHabits();
  const xpMax = 3000;
  const pct = Math.min(100, Math.round((s.xp / xpMax) * 100));

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar">
      {/* ── Header ── */}
      <div
        className={`flex shrink-0 items-center border-b border-sidebar-border px-3 py-3 ${collapsed ? "justify-center" : "justify-between gap-2"}`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl gradient-brand shadow-lg shadow-primary/30">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">
                PREMIUM
              </div>
              <div className="truncate text-sm font-bold tracking-wide text-sidebar-foreground">
                HABIT TRACKER
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="grid h-8 w-8 place-items-center rounded-xl gradient-brand shadow-lg shadow-primary/30">
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
        )}
        <div className="flex items-center gap-1">
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Nav (independent scroll) ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
        {GROUP_ORDER.map((group) => {
          const items = NAV.filter((n) => n.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="mb-3">
              {!collapsed && (
                <div className="section-eyebrow px-3 pb-1.5 pt-1 text-muted-foreground/70">
                  {group}
                </div>
              )}
              {collapsed && <div className="mx-3 mb-1.5 h-px bg-sidebar-border/60" />}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = active === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => onSelect(item.key)}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex w-full items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} rounded-xl py-2.5 text-sm font-medium transition-all duration-150 hover:translate-x-0.5 ${
                        isActive
                          ? "bg-gradient-to-r from-primary/25 via-primary/10 to-transparent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full gradient-amber-teal" />
                      )}
                      <Icon
                        className={`shrink-0 ${isActive ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"}`}
                        strokeWidth={isActive ? 2.2 : 1.8}
                        size={18}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Level / XP + Quote (expanded only) ── */}
      {!collapsed && (
        <div className="shrink-0 space-y-2 border-t border-sidebar-border px-3 py-3">
          <div className="rounded-xl border border-sidebar-border bg-card/60 px-3 py-2.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full gradient-amber-teal text-[11px] font-bold text-white shadow-md shadow-primary/30">
                  {s.level}
                </span>
                <span className="font-semibold text-sidebar-foreground">Level {s.level}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {s.freezeTokens > 0 && (
                  <span className="flex items-center gap-0.5 rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-bold text-cyan-500 border border-cyan-500/20" title={`${s.freezeTokens} Streak Freezes Available`}>
                    <Snowflake className="h-2.5 w-2.5" />
                    {s.freezeTokens}
                  </span>
                )}
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Explorer
                </span>
              </div>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full gradient-amber-teal transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground">
              {s.xp.toLocaleString()} / {xpMax.toLocaleString()} XP
            </div>
          </div>
          <div className="rounded-xl border border-sidebar-border bg-card/40 px-3 py-2.5 text-xs text-muted-foreground">
            <Quote className="mb-1.5 h-3.5 w-3.5 text-primary/70" />
            <p className="italic leading-relaxed">
              Success is the sum of small efforts, repeated day in and day out.
            </p>
            <p className="mt-1.5 text-[11px] font-medium text-sidebar-foreground/70">
              – Robert Collier
            </p>
          </div>
        </div>
      )}
      {/* ── Footer: Profile / Sign out ── */}
      <div className={`shrink-0 border-t border-sidebar-border p-2 space-y-1`}>
        <div className={`flex items-center justify-center w-full`}>
          <ProfileModal onSignOut={onSignOut} compact={collapsed} position="sidebar" />
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  active,
  onSelect,
  mobileOpen,
  onCloseMobile,
  onSignOut,
}: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isHovered;
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  return (
    <>
      {/* Desktop sidebar — fixed 60px gutter, inner panel floats on hover */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative hidden lg:block shrink-0 h-full z-40 w-[60px]"
      >
        <div className={`absolute top-0 left-0 h-full flex flex-col overflow-hidden transition-all duration-300 bg-sidebar border-r border-sidebar-border z-40 ${!isExpanded ? "w-[60px]" : "w-[250px] shadow-2xl shadow-black/30"}`}>
          <SidebarContent
            active={active}
            onSelect={onSelect}
            collapsed={!isExpanded}
            onClose={onCloseMobile}
            onSignOut={onSignOut}
          />
        </div>
      </aside>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchStartX.current - touchEndX;
            const diffY = touchStartY.current - touchEndY;
            // Increased threshold and check horizontal vs vertical movement
            if (diffX > 60 && Math.abs(diffX) > Math.abs(diffY)) {
              onCloseMobile?.();
            }
          }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={onCloseMobile} />
          <aside className="relative flex h-full w-64 flex-col shadow-2xl">
            <SidebarContent
              active={active}
              onSelect={(k) => {
                onSelect(k);
                onCloseMobile?.();
              }}
              collapsed={false}
              onClose={onCloseMobile}
              onSignOut={onSignOut}
            />
          </aside>
        </div>
      )}
    </>
  );
}
