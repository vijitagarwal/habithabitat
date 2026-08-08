import { CalendarDays, ChevronDown, Moon, Sun, Menu, RotateCw } from "lucide-react";
import { useState } from "react";
import { DatePicker } from "./DatePicker";
import { DigitalClock } from "./DigitalClock";
import { todayISO, syncNow, useSyncStatus } from "@/lib/habits-store";
import { useTheme } from "@/hooks/useTheme";
import { useEffect } from "react";


interface Props {
  onNavigate?: (key: string) => void;
  onDateChange?: (iso: string) => void;
  onOpenMenu?: () => void;
  onSignOut?: () => void;
  title?: string;
  subtitle?: string;
}

export function Header({
  onNavigate,
  onDateChange,
  onOpenMenu,
  onSignOut,
  title = "Dashboard",
  subtitle = "Welcome back! Keep going, you're doing amazing. 🚀",
}: Props) {
  const { theme, setTheme } = useTheme();
  const [pickerDate, setPickerDate] = useState(todayISO());
  const [syncing, setSyncing] = useState(false);
  const syncStatus = useSyncStatus();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await syncNow();
    setTimeout(() => setSyncing(false), 500);
  };

  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {onOpenMenu && (
          <button
            onClick={onOpenMenu}
            className="rounded-xl border border-border bg-card/60 p-2 lg:hidden"
            title="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Date picker */}
        <DatePicker
          value={pickerDate}
          onChange={(iso) => {
            setPickerDate(iso);
            onDateChange?.(iso);
          }}
          align="end"
          size="md"
        />
        <div className="hidden sm:flex items-center justify-center rounded-xl border border-border bg-card/60 px-3 py-2 text-sm text-foreground/80 h-[38px]">
          <DigitalClock />
        </div>
        {/* Cloud Sync Button */}
        {syncStatus === "error" ? (
          <button
            onClick={handleSync}
            disabled={syncing}
            title="Sync failed. Click to retry."
            className="flex items-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium hover:border-destructive transition-colors disabled:opacity-50"
          >
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span className="hidden sm:inline text-destructive">Sync Error</span>
          </button>
        ) : syncStatus === "syncing" || syncing ? (
          <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-medium">
            <RotateCw className="h-4 w-4 text-amber-500 animate-spin" />
            <span className="hidden sm:inline text-amber-500">Saving...</span>
          </div>
        ) : (
          <button
            onClick={handleSync}
            disabled={syncing || isOffline}
            title={isOffline ? "Offline" : "All changes synced"}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm font-medium hover:border-primary/40 transition-colors disabled:opacity-50"
          >
            <div className={`h-2 w-2 rounded-full ${isOffline ? 'bg-amber-500' : 'bg-success'}`} />
            <span className="hidden sm:inline text-muted-foreground">{isOffline ? 'Offline' : 'Synced'}</span>
          </button>
        )}
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm font-medium hover:border-primary/40 transition-colors"
        >
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span className="capitalize">{theme}</span>
        </button>
      </div>
      {isOffline && (
        <div className="w-full mt-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-sm text-amber-500 text-center font-medium animate-in fade-in slide-in-from-top-2">
          Offline — changes saved locally, will sync when reconnected
        </div>
      )}
    </header>
  );
}
