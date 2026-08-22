import { useState, useEffect } from "react";
import { OverviewDashboard } from "./features/overview/OverviewDashboard";
import { ActivitiesPage } from "./features/activities/ActivitiesPage";
import { LayoutDashboard, ListTodo, Moon, Sun, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "./lib/utils";
import { useActivitiesData } from "./hooks/useActivitiesData";

type View = "overview" | "activities";

function App() {
  const [isDark, setIsDark] = useState(false);
  const [activeView, setActiveView] = useState<View>("overview");
  const [initialFilters, setInitialFilters] = useState<{ timelineStatus?: string[] } | null>(null);
  const { activities, isLoading, error, refresh } = useActivitiesData();

  const handleNavigateToActivities = (filters?: { timelineStatus?: string[] }) => {
    if (filters) {
      setInitialFilters(filters);
    }
    setActiveView("activities");
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-canvas text-primary">
      {/* Sidebar / Mobile Header */}
      <aside className="w-full md:w-[240px] flex-shrink-0 flex flex-col md:border-r border-b md:border-b-0 border-subtle bg-canvas px-4 py-4 md:py-6">
        <div className="flex items-center justify-between md:justify-start px-2 mb-4 md:mb-10">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-brand shadow-sm shadow-brand/20"></div>
            <span className="font-semibold tracking-wide text-sm text-primary">Programme Monitor</span>
          </div>
          <div className="flex items-center gap-1 md:hidden">
            <button 
              type="button"
              onClick={refresh}
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
          </div>
        </div>

        <nav className="flex flex-row md:flex-col gap-2 md:gap-1 flex-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0 scrollbar-hide">
          <button 
            type="button" 
            onClick={() => setActiveView("overview")}
            className={cn(
              "flex items-center gap-2 md:gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              activeView === "overview" 
                ? "bg-surface text-primary shadow-sm border border-subtle" 
                : "text-secondary hover:text-primary hover:bg-surface/50 border border-transparent"
            )}
          >
            <LayoutDashboard size={16} className={activeView === "overview" ? "text-brand" : "text-muted"} />
            Overview
          </button>
          <button 
            type="button" 
            onClick={() => handleNavigateToActivities({ timelineStatus: [] })}
            className={cn(
              "flex items-center gap-2 md:gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              activeView === "activities" 
                ? "bg-surface text-primary shadow-sm border border-subtle" 
                : "text-secondary hover:text-primary hover:bg-surface/50 border border-transparent"
            )}
          >
            <ListTodo size={16} className={activeView === "activities" ? "text-brand" : "text-muted"} />
            Activities
          </button>
        </nav>

        <div className="hidden md:flex flex-col gap-1 mt-auto">
          <button 
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-secondary hover:text-primary hover:bg-surface/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <RefreshCw size={16} className={cn("text-muted", isLoading && "animate-spin")} />
            Sync Data
          </button>
          <button 
            type="button"
            onClick={() => setIsDark(!isDark)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-secondary hover:text-primary hover:bg-surface/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isDark ? <Sun size={16} className="text-muted" /> : <Moon size={16} className="text-muted" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
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
                onClick={refresh}
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
                  <span>Unable to refresh data. Showing previously loaded activities.</span>
                </div>
              )}
              {activeView === "overview" ? (
                <OverviewDashboard activities={activities} onNavigateToActivities={handleNavigateToActivities} />
              ) : (
                <ActivitiesPage activities={activities} initialFilters={initialFilters} />
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;