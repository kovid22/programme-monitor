import { useState, useEffect, useRef } from "react";
import { OverviewDashboard } from "./features/overview/OverviewDashboard";
import { ActivitiesPage } from "./features/activities/ActivitiesPage";
import { LayoutDashboard, ListTodo, Moon, Sun, RefreshCw, AlertCircle, LogOut, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "./lib/utils";
import { useActivitiesData } from "./hooks/useActivitiesData";
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { AuthGate } from './features/auth/AuthGate';

type View = "overview" | "activities";
const SIDEBAR_COLLAPSED_KEY = "programme-monitor-sidebar-collapsed";

function formatRefreshedAt(isoString: string | null) {
  if (!isoString) return "Not yet refreshed";
  const d = new Date(isoString);
  const now = new Date();

  const dateOptions: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' };
  const dDate = new Intl.DateTimeFormat('en-IN', dateOptions).format(d);
  const nowDate = new Intl.DateTimeFormat('en-IN', dateOptions).format(now);
  const isToday = dDate === nowDate;

  const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  if (!isToday) {
    timeOptions.day = 'numeric';
    timeOptions.month = 'short';
  }

  const formatter = new Intl.DateTimeFormat('en-IN', timeOptions);
  let formatted = formatter.format(d);
  formatted = formatted.replace('am', 'AM').replace('pm', 'PM');
  return `Last refreshed ${formatted} IST`;
}

function UserAvatar({ photoUrl, name }: { photoUrl: string | null | undefined; name: string }) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-subtle bg-elevated text-xs font-semibold text-secondary">
      {photoUrl && failedPhotoUrl !== photoUrl ? (
        <img src={photoUrl} alt="" className="h-full w-full object-cover" onError={() => setFailedPhotoUrl(photoUrl)} />
      ) : (
        initials
      )}
    </div>
  );
}

function AppContent() {
  const { user, logOut } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [showSidebarLabels, setShowSidebarLabels] = useState(() => !isSidebarCollapsed);
  const sidebarTransitionTimerRef = useRef<number | null>(null);
  const [activeView, setActiveView] = useState<View>("overview");
  const [initialFilters, setInitialFilters] = useState<{ timelineStatus?: string[] } | null>(null);
  const { activities, isLoading, error, refresh, refreshedAt } = useActivitiesData(logOut);
  const email = user?.email ?? "";
  const displayName = user?.displayName?.trim() || email.split("@")[0] || "User";
  const sidebarLabelClass = showSidebarLabels
    ? ""
    : "md:hidden";

  const handleNavigateToActivities = (filters?: { timelineStatus?: string[] }) => {
    if (filters) {
      setInitialFilters(filters);
    }
    setActiveView("activities");
  };

  const handleSidebarToggle = () => {
    if (sidebarTransitionTimerRef.current !== null) {
      window.clearTimeout(sidebarTransitionTimerRef.current);
      sidebarTransitionTimerRef.current = null;
    }

    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
      sidebarTransitionTimerRef.current = window.setTimeout(() => {
        setShowSidebarLabels(true);
        sidebarTransitionTimerRef.current = null;
      }, 150);
      return;
    }

    setShowSidebarLabels(false);
    setIsSidebarCollapsed(true);
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed));
    } catch {
      // Sidebar state persistence is an enhancement; continue if storage is unavailable.
    }
  }, [isSidebarCollapsed]);

  useEffect(() => () => {
    if (sidebarTransitionTimerRef.current !== null) {
      window.clearTimeout(sidebarTransitionTimerRef.current);
    }
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-canvas text-primary">
      {/* Sidebar / Mobile Header */}
      <aside className={cn(
        "flex w-full flex-shrink-0 flex-col border-b border-subtle bg-canvas px-4 py-4 transition-[width] duration-150 ease-out motion-reduce:transition-none md:border-r md:border-b-0 md:py-6",
        isSidebarCollapsed ? "md:w-[80px] md:px-3" : "md:w-[240px]"
      )}>
        <div className={cn("mb-4 flex h-11 items-center justify-end md:mb-10", !showSidebarLabels && "md:justify-center")}>
          <button
            type="button"
            onClick={handleSidebarToggle}
            className="hidden h-11 w-11 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none md:flex"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          </button>
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-xs text-muted opacity-60 leading-tight text-right hidden sm:block">
              {formatRefreshedAt(refreshedAt)}
            </span>
            <button 
              type="button"
              onClick={() => refresh(true)}
              disabled={isLoading}
              className="p-2 text-secondary hover:text-primary transition-colors rounded-lg hover:bg-surface/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Sync data"
            >
              <RefreshCw size={18} className={cn(isLoading && "animate-spin")} />
            </button>
            <button 
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="p-2 text-secondary hover:text-primary transition-colors rounded-lg hover:bg-surface/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              onClick={logOut}
              className="p-2 text-secondary hover:text-danger transition-colors rounded-lg hover:bg-surface/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <nav className={cn("flex flex-1 flex-row gap-2 overflow-x-auto pb-1 scrollbar-hide md:flex-col md:gap-1 md:overflow-visible md:pb-0", !showSidebarLabels && "md:items-center")}>
          <button
            type="button" 
            onClick={() => setActiveView("overview")}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none md:gap-3",
              !showSidebarLabels && "md:h-11 md:w-11 md:justify-center md:px-0",
              activeView === "overview" 
                ? "bg-surface text-primary shadow-sm border border-subtle" 
                : "text-secondary hover:text-primary hover:bg-surface/50 border border-transparent"
            )}
            aria-label="Overview"
            title={!showSidebarLabels ? "Overview" : undefined}
          >
            <LayoutDashboard size={showSidebarLabels ? 16 : 20} className={activeView === "overview" ? "text-brand" : "text-secondary"} />
            <span className={sidebarLabelClass}>Overview</span>
          </button>
          <button
            type="button" 
            onClick={() => handleNavigateToActivities({ timelineStatus: [] })}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none md:gap-3",
              !showSidebarLabels && "md:h-11 md:w-11 md:justify-center md:px-0",
              activeView === "activities" 
                ? "bg-surface text-primary shadow-sm border border-subtle" 
                : "text-secondary hover:text-primary hover:bg-surface/50 border border-transparent"
            )}
            aria-label="Activities"
            title={!showSidebarLabels ? "Activities" : undefined}
          >
            <ListTodo size={showSidebarLabels ? 16 : 20} className={activeView === "activities" ? "text-brand" : "text-secondary"} />
            <span className={sidebarLabelClass}>Activities</span>
          </button>
        </nav>

        <div className={cn("mt-auto hidden flex-col gap-1 md:flex", !showSidebarLabels && "md:items-center")}>
          <button
            type="button"
            onClick={() => refresh(true)}
            disabled={isLoading}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-surface/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
              !showSidebarLabels && "md:h-11 md:w-11 md:justify-center md:px-0 md:py-0"
            )}
            aria-label="Sync data"
            title={!showSidebarLabels ? formatRefreshedAt(refreshedAt) : undefined}
          >
            <RefreshCw size={showSidebarLabels ? 16 : 20} className={cn("shrink-0", showSidebarLabels ? "text-muted" : "text-secondary", isLoading && "animate-spin")} />
            <span className={cn("flex min-w-0 flex-col gap-0.5", sidebarLabelClass)}>
              <span className="text-sm font-medium text-secondary">Sync Data</span>
              <span className="truncate text-xs text-muted">{formatRefreshedAt(refreshedAt)}</span>
            </span>
          </button>
          <button 
            type="button"
            onClick={() => setIsDark(!isDark)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-secondary transition-colors duration-150 hover:bg-surface/50 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none",
              !showSidebarLabels && "md:h-11 md:w-11 md:justify-center md:px-0"
            )}
            aria-label={isDark ? "Use light mode" : "Use dark mode"}
            title={!showSidebarLabels ? (isDark ? "Light Mode" : "Dark Mode") : undefined}
          >
            {isDark ? <Sun size={showSidebarLabels ? 16 : 20} className={cn("shrink-0", showSidebarLabels ? "text-muted" : "text-secondary")} /> : <Moon size={showSidebarLabels ? 16 : 20} className={cn("shrink-0", showSidebarLabels ? "text-muted" : "text-secondary")} />}
            <span className={sidebarLabelClass}>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div className={cn("mt-4 border-t border-subtle pt-4", !showSidebarLabels && "md:flex md:flex-col md:items-center")}>
            <div className={cn("flex items-center gap-3 rounded-lg px-3 py-2", !showSidebarLabels && "md:px-0")} title={email || displayName}>
              <UserAvatar photoUrl={user?.photoURL} name={displayName} />
              <div className={cn("min-w-0 flex-1", sidebarLabelClass)}>
                <p className="truncate text-sm font-medium text-primary" title={displayName}>{displayName}</p>
                <p className="truncate text-xs text-muted" title={email || displayName}>{email || "No email available"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logOut}
              className={cn(
                "mt-1 flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-secondary transition-colors duration-150 hover:bg-surface/50 hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger motion-reduce:transition-none",
                !showSidebarLabels && "md:mt-2 md:h-11 md:w-11 md:px-0"
              )}
              aria-label="Sign out"
              title={!showSidebarLabels ? "Sign out" : undefined}
            >
              <LogOut size={showSidebarLabels ? 16 : 20} className="shrink-0" />
              <span className={sidebarLabelClass}>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-y-auto">
        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 md:px-8 pt-6 pb-10 lg:px-12 lg:pt-8 lg:pb-12">
          
          {isLoading && activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-secondary animate-pulse">
              <span className="text-sm font-medium">Loading programme data...</span>
            </div>
          ) : error && activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <AlertCircle size={32} className="text-danger mb-4 opacity-80" />
              <p className="text-primary font-medium mb-4">{error}</p>
              <button 
                onClick={() => refresh(false)}
                className="px-4 py-2 bg-surface text-primary border border-subtle rounded-lg text-sm font-medium hover:bg-surface/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-center gap-3 text-sm text-danger">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
              {activeView === "overview" ? (
                <OverviewDashboard activities={activities} onNavigateToActivities={handleNavigateToActivities} />
              ) : (
                <ActivitiesPage activities={activities} initialFilters={initialFilters} />
              )}
            </>
          )}

          {/* Footer */}
          <footer className="mt-auto pt-16 pb-4 text-center text-[13px] text-muted">
            © 2026 kovid22 · Programme Monitor · <a href="https://github.com/kovid22/programme-monitor/blob/main/LICENSE" target="_blank" rel="noreferrer" className="hover:text-secondary hover:underline underline-offset-2 transition-colors">MIT License</a>
          </footer>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <AppContent />
      </AuthGate>
    </AuthProvider>
  );
}

export default App;
