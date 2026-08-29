import type { Activity } from '../../../data/types';
import { StatusBadge } from '../../../components/ui/Badge';
import { formatCurrencyValue } from '../../../lib/utils';

interface ActivityCardProps {
  activity: Activity;
  onClick: () => void;
}

export function ActivityCard({ activity, onClick }: ActivityCardProps) {
  const targetTiming = activity.targetTiming || 'Not Specified';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex flex-col gap-3 bg-surface p-4 rounded-xl border border-subtle text-left mb-3 hover:border-primary/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm shadow-black/5"
    >
      <div className="flex justify-between items-start gap-3 w-full">
        <div className="flex flex-col">
          {activity.id && <span className="mb-1 text-xs font-mono text-muted">{activity.id}</span>}
          <span className="text-sm font-semibold text-primary leading-tight">{activity.title}</span>
        </div>
        <div className="shrink-0 pt-0.5">
          <StatusBadge status={activity.completionStatus} />
        </div>
      </div>

      <div className="flex w-full flex-col gap-1.5 rounded-lg bg-surface/50 p-3">
        <div className="flex justify-between items-center w-full">
          <span className="mr-2 truncate text-[13px] font-medium text-primary">{activity.component}</span>
          <span className="max-w-[40%] shrink-0 truncate text-right text-xs text-secondary">{activity.agency}</span>
        </div>
        <span className="truncate text-xs text-muted">{activity.subComponent}</span>
      </div>

      <div className="flex justify-between items-end w-full mt-1 px-1">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Target / Timing</span>
          <span className="text-[13px] font-medium text-primary">{targetTiming}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Timeline</span>
          <StatusBadge status={activity.timelineStatus} />
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Value</span>
          <span className="text-[13px] font-semibold text-primary">
            {activity.estValue !== null && activity.estValue > 0 ? formatCurrencyValue(activity.estValue) : '-'}
          </span>
        </div>
      </div>
    </button>
  );
}
