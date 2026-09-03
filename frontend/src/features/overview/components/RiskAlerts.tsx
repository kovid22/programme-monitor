import type { Activity } from "../../../data/types";
import { cn } from "../../../lib/utils";
import { ArrowRight } from "lucide-react";

export interface RiskAlertsProps {
  activities: Activity[];
  onNavigateToActivities?: (filters?: { timelineStatus?: string[] }) => void;
  onOpenActivity?: (activity: Activity) => void;
}

export function RiskAlerts({ activities, onNavigateToActivities, onOpenActivity }: RiskAlertsProps) {
  return (
    <div className="w-full h-full min-h-[280px] bg-surface rounded-[24px] p-5 lg:p-6 flex flex-col shadow-sm border border-subtle">
      <h3 className="mb-3 text-base font-semibold tracking-wide text-primary">Tasks Pending</h3>
      
      {activities.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted italic">
          No activities currently at risk.
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          {activities.slice(0, 4).map(activity => {
            const isRed = activity.timelineStatus === 'Overdue' || activity.timelineStatus === 'Immediate';
            return (
              <button 
                type="button"
                key={activity.id} 
                onClick={() => onOpenActivity?.(activity)}
                className="-mx-2 flex w-full items-center justify-between gap-3 rounded-lg border-b border-subtle/50 px-2 py-3 text-left transition-colors hover:bg-elevated last:border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight text-primary">{activity.title}</p>
                  <div className="mt-1.5 flex min-w-0 items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-secondary">{activity.component}</span>
                    <span className="w-1 h-1 rounded-full bg-subtle shrink-0"></span>
                    <span className="shrink-0 whitespace-nowrap text-[13px] text-secondary">{activity.agency}</span>
                    {activity.targetTiming && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-subtle shrink-0"></span>
                        <span className="shrink-0 text-[13px] text-secondary">Target: {activity.targetTiming}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right pl-1">
                  <span className={cn(
                    "rounded px-1.5 py-0.5 text-[11px] font-bold uppercase leading-none tracking-wider",
                    isRed ? "bg-danger/10 text-danger" : "bg-surface border border-subtle text-secondary"
                  )}>
                    {activity.timelineStatus}
                  </span>
                </div>
              </button>
            );
          })}
          {activities.length > 4 && (
            <div className="mt-2 text-center">
              <button 
                onClick={() => onNavigateToActivities?.({ timelineStatus: ['Overdue', 'Immediate'] })}
                className="text-xs font-medium text-secondary hover:text-primary transition-colors inline-flex items-center gap-1 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              >
                View all {activities.length} at risk 
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
