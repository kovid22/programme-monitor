import type { Activity } from "../../../data/types";
import { cn } from "../../../lib/utils";

export interface RiskAlertsProps {
  activities: Activity[];
  onNavigateToActivities?: (filters?: { timelineStatus?: string[] }) => void;
  onOpenActivity?: (activity: Activity) => void;
}

export function RiskAlerts({ activities, onNavigateToActivities, onOpenActivity }: RiskAlertsProps) {
  return (
    <div className="w-full h-full min-h-[280px] bg-surface rounded-[24px] p-5 lg:p-6 flex flex-col shadow-sm border border-subtle">
      <h3 className="text-base font-semibold text-primary mb-4">Task Pending</h3>
      
      {activities.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted italic">
          No activities currently at risk.
        </div>
      ) : (
        <div className="flex flex-col flex-1">
          {activities.slice(0, 4).map(activity => {
            const isRed = activity.timelineStatus === 'Overdue' || activity.timelineStatus === 'Immediate';
            return (
              <button 
                type="button"
                key={activity.id} 
                onClick={() => onOpenActivity?.(activity)}
                className="flex w-full items-center justify-between gap-3 py-2.5 border-b border-subtle/50 last:border-0 hover:bg-elevated px-2 -mx-2 rounded-md transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-primary truncate">{activity.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[13px] font-medium text-secondary truncate">{activity.component}</span>
                    <span className="w-1 h-1 rounded-full bg-subtle shrink-0"></span>
                    <span className="text-[13px] text-muted truncate">{activity.agency}</span>
                    {activity.targetTiming && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-subtle shrink-0"></span>
                        <span className="text-[13px] text-muted shrink-0">Target: {activity.targetTiming}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right pl-2">
                  <span className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase",
                    isRed ? "bg-danger/10 text-danger" : "bg-surface border border-subtle text-secondary"
                  )}>
                    {activity.timelineStatus}
                  </span>
                </div>
              </button>
            );
          })}
          {activities.length > 4 && (
            <div className="mt-3 text-center">
              <button 
                onClick={() => onNavigateToActivities?.({ timelineStatus: ['Overdue', 'Immediate'] })}
                className="text-xs font-medium text-secondary hover:text-primary transition-colors inline-flex items-center gap-1 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              >
                View all {activities.length} at risk 
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
