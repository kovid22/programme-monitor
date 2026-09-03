import type { Activity } from '../../../data/types';
import { cn } from '../../../lib/utils';
import { ActivityRow } from './ActivityRow';
import { ActivityCard } from './ActivityCard';

interface ActivityListProps {
  activities: Activity[];
  onActivityClick: (a: Activity) => void;
  resetFilters: () => void;
  hasActiveFilters?: boolean;
}

export function ActivityList({ activities, onActivityClick, resetFilters, hasActiveFilters }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-canvas rounded-2xl border border-subtle">
        <div className="w-16 h-16 bg-surface border border-subtle rounded-2xl flex items-center justify-center mb-4">
          <span className="text-2xl">🔍</span>
        </div>
        <h3 className="text-base font-semibold text-primary mb-2">No activities found</h3>
        <p className="text-sm text-secondary max-w-md mx-auto mb-6">
          No activities match the current filters.
        </p>
        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-surface hover:bg-elevated text-primary border border-subtle text-sm font-medium rounded-lg transition-colors focus:outline-none"
        >
          {hasActiveFilters ? 'Clear search & filters' : 'Clear search'}
        </button>
      </div>
    );
  }

  const gridColsClass = "grid-cols-[minmax(0,5.5fr)_minmax(0,2fr)_minmax(0,9fr)_minmax(0,1.7fr)_minmax(0,1.3fr)_minmax(0,2.2fr)]";

  return (
    <div className="w-full bg-canvas border border-subtle md:rounded-2xl overflow-hidden shadow-sm shadow-black/5 -mx-4 md:mx-auto w-[calc(100%+2rem)] md:w-full md:max-w-[1360px]">
      {/* Desktop Header */}
      <div className={cn("hidden md:grid gap-3 py-3 px-5 bg-surface border-b border-subtle text-xs font-bold uppercase tracking-wider text-secondary sticky top-0 z-10", gridColsClass)}>
        <div className="pr-2 min-w-0 truncate">Component</div>
        <div className="text-center px-2 min-w-0 truncate">Agency</div>
        <div className="pr-2 min-w-0 truncate">Activity</div>
        <div className="text-center px-2 min-w-0 truncate">Target</div>
        <div className="text-center px-2 min-w-0 truncate">Value</div>
        <div className="text-right min-w-0 truncate">Status</div>
      </div>

      {/* Desktop Rows */}
      <div className="hidden md:flex flex-col">
        {activities.map((a, i) => (
          <ActivityRow key={a.id || `act-${i}`} activity={a} onClick={() => onActivityClick(a)} gridColsClass={gridColsClass} />
        ))}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col p-4 bg-surface/30">
        {activities.map((a, i) => (
          <ActivityCard key={a.id || `act-${i}`} activity={a} onClick={() => onActivityClick(a)} />
        ))}
      </div>
    </div>
  );
}
