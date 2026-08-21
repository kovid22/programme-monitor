import { StatusBadge } from "../../../components/ui/Badge";
import type { Activity } from "../../../data/types";

export function RiskAlerts({ activities }: { activities: Activity[] }) {
  return (
    <div className="w-full h-full min-h-[280px] bg-surface rounded-[24px] p-5 lg:p-6 flex flex-col">
      <h3 className="text-sm font-semibold text-primary mb-4">Needs Attention</h3>
      
      {activities.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted italic">
          No activities currently at risk.
        </div>
      ) : (
        <div className="flex flex-col gap-1 flex-1">
          {activities.slice(0, 4).map(activity => (
            <div 
              key={activity.id} 
              className="flex items-start justify-between gap-3 bg-canvas p-2 lg:px-3 rounded-lg border border-transparent hover:border-subtle transition-colors cursor-pointer group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-primary truncate group-hover:text-pastel-blue transition-colors">{activity.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-secondary truncate">{activity.component}</span>
                  <span className="w-1 h-1 rounded-full bg-subtle"></span>
                  <span className="text-[10px] text-muted truncate">{activity.agency}</span>
                  {activity.targetDate && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-subtle"></span>
                      <span className="text-[10px] text-muted">Due {activity.targetDate}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <StatusBadge status={activity.timelineStatus} />
              </div>
            </div>
          ))}
          {activities.length > 4 && (
            <div className="mt-1 pt-1 text-center">
              <button className="text-[10px] font-medium text-secondary hover:text-primary transition-colors cursor-pointer">
                + View all {activities.length} at risk
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
