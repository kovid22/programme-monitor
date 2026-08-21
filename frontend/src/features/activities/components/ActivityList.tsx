import type { Activity } from '../../../data/types';
import { ActivityRow } from './ActivityRow';
import { ActivityCard } from './ActivityCard';

interface ActivityListProps {
  activities: Activity[];
  onActivityClick: (a: Activity) => void;
  resetFilters: () => void;
}

export function ActivityList({ activities, onActivityClick, resetFilters }: ActivityListProps) {
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
          className="px-4 py-2 bg-primary text-inverted text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:ring-primary"
        >
          Reset Filters
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-canvas border border-subtle md:rounded-2xl overflow-hidden shadow-sm shadow-black/5 -mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full">
      {/* Desktop Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 py-3 px-5 bg-surface border-b border-subtle text-[10px] font-semibold uppercase tracking-wider text-muted sticky top-0 z-10">
        <div className="col-span-4 pr-2">Activity</div>
        <div className="col-span-3 pr-2">Context</div>
        <div className="col-span-2 pr-2">Agency</div>
        <div className="col-span-1">Target</div>
        <div className="col-span-1 text-right pr-2">Value</div>
        <div className="col-span-1 text-right">Status</div>
      </div>

      {/* Desktop Rows */}
      <div className="hidden md:flex flex-col">
        {activities.map(a => (
          <ActivityRow key={a.id} activity={a} onClick={() => onActivityClick(a)} />
        ))}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col p-4 bg-surface/30">
        {activities.map(a => (
          <ActivityCard key={a.id} activity={a} onClick={() => onActivityClick(a)} />
        ))}
      </div>
    </div>
  );
}
