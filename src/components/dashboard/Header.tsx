import { CalendarDays, ChevronDown, Menu, Moon, Sun, User } from "lucide-react";
import { useEffect, useState } from "react";

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("theme")) as "dark" | "light" | null;
    if (stored) setTheme(stored);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);
  return { theme, setTheme };
}

interface Props {
  onNavigate?: (key: string) => void;
  onOpenMenu?: () => void;
  title?: string;
  subtitle?: string;
}

export function Header({ onNavigate, onOpenMenu, title = "Dashboard", subtitle = "Welcome back! Keep going, you're doing amazing. 🚀" }: Props) {
  const { theme, setTheme } = useTheme();
  const [today, setToday] = useState<string>("");
  useEffect(() => {
    setToday(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
  }, []);

  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {onOpenMenu && (
          <button onClick={onOpenMenu} className="rounded-xl border border-border bg-card/60 p-2 lg:hidden" title="Menu">
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate?.("calendar")}
          className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm font-medium hover:border-primary/40"
        >
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span suppressHydrationWarning>{today || "\u00A0"}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm font-medium hover:border-primary/40"
        >
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span className="capitalize">{theme}</span>
        </button>
        <button
          onClick={() => onNavigate?.("settings")}
          title="Profile & Settings"
          className="grid h-10 w-10 place-items-center rounded-full gradient-brand text-sm font-bold text-white shadow-lg shadow-primary/30 hover:opacity-90"
        >
          <User className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
