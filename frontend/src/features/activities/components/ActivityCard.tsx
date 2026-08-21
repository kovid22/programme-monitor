import type { Activity } from '../../../data/types';
import { StatusBadge } from '../../../components/ui/Badge';
import { parseLocalDate } from '../../../lib/dateUtils';

interface ActivityCardProps {
  activity: Activity;
  onClick: () => void;
}

export function ActivityCard({ activity, onClick }: ActivityCardProps) {
  const isRisk = activity.timelineStatus === 'Overdue' || activity.timelineStatus === 'Immediate';
  const targetDateStr = activity.targetDate ? parseLocalDate(activity.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex flex-col gap-3 p-4 bg-canvas rounded-xl border border-subtle text-left mb-3 hover:border-primary/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm shadow-black/5"
    >
      <div className="flex justify-between items-start gap-3 w-full">
        <div className="flex flex-col">
          {activity.id && <span className="text-[10px] font-mono text-muted mb-0.5">{activity.id}</span>}
          <span className="text-sm font-semibold text-primary leading-tight">{activity.title}</span>
        </div>
        <div className="shrink-0 pt-0.5">
          <StatusBadge status={activity.completionStatus} />
        </div>
      </div>

      <div className="flex flex-col gap-1 w-full bg-surface/50 rounded-lg p-3">
        <div className="flex justify-between items-center w-full">
          <span className="text-xs font-medium text-primary truncate mr-2">{activity.component}</span>
          <span className="text-[10px] text-secondary truncate shrink-0 max-w-[40%] text-right">{activity.agency}</span>
        </div>
        <span className="text-[10px] text-muted truncate">{activity.subComponent}</span>
      </div>

      <div className="flex justify-between items-end w-full mt-1 px-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] uppercase tracking-wider text-muted font-medium">Target</span>
          <span className="text-xs text-primary font-medium">{targetDateStr}</span>
        </div>
        <div className="flex flex-col gap-0.5 items-center">
          <span className="text-[9px] uppercase tracking-wider text-muted font-medium">Timeline</span>
          <span className={`text-xs font-semibold ${isRisk ? 'text-danger' : 'text-secondary'}`}>
            {activity.timelineStatus}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 items-end">
          <span className="text-[9px] uppercase tracking-wider text-muted font-medium">Value</span>
          <span className="text-xs font-semibold text-primary">
            {activity.estValue !== null && activity.estValue > 0 ? `₹${activity.estValue.toLocaleString('en-IN', { maximumFractionDigits: 1 })}L` : '-'}
          </span>
        </div>
      </div>
    </button>
  );
}
