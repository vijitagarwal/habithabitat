import { CalendarDays, ChevronDown, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("theme") as "dark" | "light") ?? "dark";
  });
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);
  return { theme, setTheme };
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back! Keep going, you're doing amazing. 🚀</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm font-medium hover:border-primary/40">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          {today}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm font-medium hover:border-primary/40"
        >
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span className="capitalize">{theme}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <div className="grid h-10 w-10 place-items-center rounded-full gradient-brand text-sm font-bold text-white shadow-lg shadow-primary/30">
          P
        </div>
      </div>
    </header>
  );
}
