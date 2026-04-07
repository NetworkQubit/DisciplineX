import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Flame,
  FolderUp,
  LayoutDashboard,
  ListTodo,
  LogOut,
  MoonStar,
  Trophy,
  Settings,
  SunMedium,
  Timer
} from "lucide-react";
import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import type { Profile } from "../../types";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/timer", label: "Timer", icon: Timer },
  { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/tasks", label: "Task Categories", icon: ListTodo },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/heatmap", label: "Heatmap", icon: Activity },
  { to: "/settings", label: "Settings", icon: Settings }
];

type AppShellProps = {
  children: ReactNode;
  profile?: Profile | null;
  saving?: boolean;
  onExportData?: () => Promise<void>;
  onImportData?: (file: File) => Promise<void>;
  onLogout?: () => void;
};

type ThemeMode = "light" | "dark";

function applyTheme(nextTheme: ThemeMode) {
  document.documentElement.classList.toggle("dark", nextTheme === "dark");
  document.documentElement.setAttribute("data-theme", nextTheme);
  document.documentElement.style.colorScheme = nextTheme;
}

function getInitials(name?: string) {
  if (!name) {
    return "S";
  }

  return name
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
}

export function AppShell({ children, profile, saving = false, onExportData, onImportData, onLogout }: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const storedTheme = window.localStorage.getItem("studyflow_theme");
    return storedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    const storedSidebar = window.localStorage.getItem("studyflow_sidebar_collapsed");

    if (storedSidebar === "true") {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("studyflow_sidebar_collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem("studyflow_theme", theme);
  }, [theme]);

  useEffect(() => {
    const preferenceTheme = profile?.preferences?.theme;

    if (preferenceTheme === "light" || preferenceTheme === "dark") {
      setTheme(preferenceTheme);
    }
  }, [profile?.preferences?.theme]);

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !onImportData) {
      return;
    }

    await onImportData(file);
    event.target.value = "";
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:gap-6 lg:px-6">
        <aside
          className={cn(
            "hidden flex-col rounded-[28px] border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition-all duration-300 dark:border-white/10 dark:bg-slate-900 dark:text-white lg:flex",
            isCollapsed ? "w-[96px]" : "w-[288px]"
          )}
        >
          <div className={cn("mb-6 flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
            {!isCollapsed ? (
              <p className="text-[11px] uppercase tracking-[0.34em] text-teal-600 dark:text-teal-300/70">DisciplineX</p>
            ) : null}
            <button
              className="rounded-2xl border border-slate-200 bg-white/90 p-3 text-slate-600 transition hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
              onClick={() => setIsCollapsed((value) => !value)}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          <nav className="space-y-2">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-2xl border border-transparent bg-transparent px-4 py-3 text-sm outline-none transition focus-visible:ring-1 focus-visible:ring-teal-300/30",
                    isCollapsed ? "justify-center" : "gap-3",
                    isActive
                      ? "bg-slate-950 text-white shadow-[0_14px_34px_rgba(15,23,42,0.24)] dark:border-teal-400/30 dark:bg-slate-800/90 dark:text-teal-100 dark:shadow-[0_16px_36px_rgba(8,145,178,0.12)]"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-slate-800/70 dark:hover:text-white"
                  )
                }
                title={isCollapsed ? label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed ? <span>{label}</span> : null}
              </NavLink>
            ))}
          </nav>

          <div className={cn("mt-auto rounded-[28px] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/70", isCollapsed && "hidden")}>
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{profile?.streak ?? 0} day streak</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Steady rhythm, calm progress.</p>
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-2">
              <button
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                onClick={() => void onExportData?.()}
              >
                <Download className="h-4 w-4" />
                Export Data
              </button>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                <FolderUp className="h-4 w-4" />
                Import Data
                <input type="file" accept="application/json" className="hidden" onChange={(event) => void handleImportFile(event)} />
              </label>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
          <div className="mb-4 rounded-[28px] border border-slate-200 bg-white px-4 py-4 text-slate-900 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-white lg:hidden">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs uppercase tracking-[0.3em] text-teal-600 dark:text-teal-300/70">DisciplineX</p>
                <button
                  className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5"
                  onClick={() => setTheme((value) => (value === "light" ? "dark" : "light"))}
                >
                  {theme === "light" ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
                  onClick={() => void onExportData?.()}
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5">
                  <FolderUp className="h-4 w-4" />
                  Import
                  <input type="file" accept="application/json" className="hidden" onChange={(event) => void handleImportFile(event)} />
                </label>
              </div>
            </div>
          </div>

          <header className="mb-6 flex justify-end rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:px-5">
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5"
                onClick={() => setTheme((value) => (value === "light" ? "dark" : "light"))}
                aria-label="Toggle theme"
              >
                {theme === "light" ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
              </button>
              {onLogout ? (
                <button
                  className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5"
                  onClick={onLogout}
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              ) : null}
              <div className="min-w-0 flex-1 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 sm:flex-none dark:border-white/10 dark:bg-slate-950 dark:text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                    {getInitials(profile?.username)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{profile?.username || "Workspace"}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      Goal: {profile?.studyGoalMinutes || 0} min daily {saving ? "· Saving..." : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>
          {children}
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-20 rounded-[28px] border border-white/50 bg-white/88 p-2 text-slate-900 shadow-[0_20px_50px_rgba(148,163,184,0.24)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90 dark:text-white dark:shadow-[0_18px_60px_rgba(2,6,23,0.5)] lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex min-w-[88px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-transparent bg-transparent px-3 py-3 text-xs outline-none transition focus-visible:ring-1 focus-visible:ring-teal-300/30",
                  isActive
                    ? "bg-slate-950 text-white dark:border-teal-400/30 dark:bg-slate-800/90 dark:text-teal-100"
                    : "text-slate-500 dark:text-slate-400 dark:hover:border-white/10 dark:hover:bg-slate-800/70 dark:hover:text-white"
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
