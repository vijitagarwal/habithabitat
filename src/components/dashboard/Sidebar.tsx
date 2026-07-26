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
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";
import { useHabits } from "@/lib/habits-store";

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
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

function SidebarContent({
  active,
  onSelect,
  collapsed = false,
  onToggleCollapsed,
  onClose,
}: {
  active: string;
  onSelect: (k: string) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onClose?: () => void;
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
          {onToggleCollapsed && (
            <button
              onClick={onToggleCollapsed}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="rounded-lg border border-sidebar-border bg-card/40 p-1.5 text-sidebar-foreground/70 hover:border-primary/40 hover:text-sidebar-foreground transition-colors"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
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
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Explorer
              </span>
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
    </div>
  );
}

export function Sidebar({
  active,
  onSelect,
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapsed,
}: Props) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex h-full shrink-0 flex-col transition-[width] duration-200 ${collapsed ? "w-[60px]" : "w-64"}`}
      >
        <SidebarContent
          active={active}
          onSelect={onSelect}
          collapsed={collapsed}
          onToggleCollapsed={onToggleCollapsed}
        />
      </aside>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
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
            />
          </aside>
        </div>
      )}
    </>
  );
}
