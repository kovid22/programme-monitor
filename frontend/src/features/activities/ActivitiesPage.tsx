import { useState, useRef } from 'react';
import type { Activity } from '../../data/types';
import { useActivitiesFilters } from './hooks/useActivitiesFilters';
import { ActivitiesToolbar } from './components/ActivitiesToolbar';
import { ActivityList } from './components/ActivityList';
import { ActivityDetailDrawer } from './components/ActivityDetailDrawer';

export interface ActivitiesPageProps {
  activities: Activity[];
  initialFilters?: { timelineStatus?: string[] } | null;
}

export function ActivitiesPage({ activities, initialFilters }: ActivitiesPageProps) {
  const filters = useActivitiesFilters(activities, initialFilters);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const handleOpenDetail = (activity: Activity) => {
    triggerRef.current = document.activeElement as HTMLElement;
    setSelectedActivity(activity);
  };

  const handleCloseDetail = () => {
    setSelectedActivity(null);
    if (triggerRef.current) {
      // Restore focus to the element that opened the drawer
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 10);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-[1200px] mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-2">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Activities</h1>
          <p className="text-sm text-secondary mt-1">
            Showing {filters.filtered.length} of {activities.length} activities
          </p>
        </div>
      </div>

      <ActivitiesToolbar filters={filters} />
      
      <div className="flex-1 relative">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-canvas rounded-2xl border border-subtle">
            <h3 className="text-base font-semibold text-primary mb-2">No activities available</h3>
            <p className="text-sm text-secondary max-w-md mx-auto">
              There is currently no programme data to display. Please ensure the source system is populated.
            </p>
          </div>
        ) : (
          <ActivityList 
            activities={filters.filtered} 
            onActivityClick={handleOpenDetail} 
            resetFilters={filters.resetFilters}
            hasActiveFilters={
              filters.component.length > 0 ||
              filters.subComponent.length > 0 ||
              filters.agency.length > 0 ||
              filters.subAgency.length > 0 ||
              filters.timelineStatus.length > 0 ||
              filters.completionStatus.length > 0
            }
          />
        )}
      </div>

      <ActivityDetailDrawer 
        activity={selectedActivity} 
        onClose={handleCloseDetail} 
      />
    </div>
  );
}
