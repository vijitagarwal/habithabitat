import {
  LayoutDashboard, CalendarCheck2, CalendarDays, BarChart3, Grid3x3,
  Target, Trophy, NotebookPen, Smile, Moon, Droplets, Scale, Settings, CheckCircle2, Quote, X,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useHabits } from "@/lib/habits-store";

export const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "daily", label: "Daily Tracker", icon: CalendarCheck2 },
  { key: "calendar", label: "Calendar View", icon: CalendarDays },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "heatmap", label: "Heatmap", icon: Grid3x3 },
  { key: "goals", label: "Goals", icon: Target },
  { key: "achievements", label: "Achievements", icon: Trophy },
  { key: "journal", label: "Journal", icon: NotebookPen },
  { key: "mood", label: "Mood Tracker", icon: Smile },
  { key: "sleep", label: "Sleep Tracker", icon: Moon },
  { key: "water", label: "Water Tracker", icon: Droplets },
  { key: "weight", label: "Weight Tracker", icon: Scale },
  { key: "settings", label: "Settings", icon: Settings },
] as const;

interface Props {
  active: string;
  onSelect: (k: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

function SidebarBody({
  active, onSelect, collapsed = false, onToggleCollapsed,
}: {
  active: string;
  onSelect: (k: string) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const s = useHabits();
  const xpMax = 3000;
  const pct = Math.min(100, Math.round((s.xp / xpMax) * 100));
  return (
    <>
      <div className={`flex items-center ${collapsed ? "flex-col gap-3" : "justify-between gap-3"}`}>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-brand shadow-lg shadow-primary/30">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">PREMIUM</div>
              <div className="text-sm font-bold tracking-wide text-sidebar-foreground">HABIT TRACKER</div>
            </div>
          )}
        </div>
        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-lg border border-sidebar-border bg-card/40 p-1.5 text-sidebar-foreground/80 hover:border-primary/40 hover:text-sidebar-foreground"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              title={collapsed ? item.label : undefined}
              className={`flex w-full items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} rounded-xl py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-inner"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={2} size={18} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      {!collapsed && (
        <>
          <div className="rounded-2xl border border-sidebar-border bg-card/60 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-sidebar-foreground">Level {s.level}</span>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">Explorer</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full gradient-brand" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{s.xp.toLocaleString()} / {xpMax.toLocaleString()} XP</div>
          </div>
          <div className="rounded-2xl border border-sidebar-border bg-card/40 p-4 text-xs text-muted-foreground">
            <Quote className="mb-2 h-4 w-4 text-primary/70" />
            <p className="italic leading-relaxed">
              Success is the sum of small efforts, repeated day in and day out.
            </p>
            <p className="mt-2 text-[11px] font-medium text-sidebar-foreground/70">– Robert Collier</p>
          </div>
        </>
      )}
    </>
  );
}

export function Sidebar({ active, onSelect, mobileOpen, onCloseMobile, collapsed, onToggleCollapsed }: Props) {
  return (
    <>
      <aside
        className={`hidden lg:flex ${collapsed ? "w-20" : "w-64"} shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar p-5 transition-[width] duration-200`}
      >
        <SidebarBody
          active={active}
          onSelect={onSelect}
          collapsed={collapsed}
          onToggleCollapsed={onToggleCollapsed}
        />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onCloseMobile} />
          <aside className="relative flex h-full w-72 flex-col gap-5 overflow-y-auto border-r border-sidebar-border bg-sidebar p-5 shadow-2xl">
            <button onClick={onCloseMobile} className="absolute right-3 top-3 rounded-lg border border-border bg-background p-1.5">
              <X className="h-4 w-4" />
            </button>
            <SidebarBody active={active} onSelect={(k) => { onSelect(k); onCloseMobile?.(); }} />
          </aside>
        </div>
      )}
    </>
  );
}

