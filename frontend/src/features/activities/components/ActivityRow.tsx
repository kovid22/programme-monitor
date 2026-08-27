import type { Activity } from '../../../data/types';
import { StatusBadge } from '../../../components/ui/Badge';
import { formatCurrencyValue } from '../../../lib/utils';

interface ActivityRowProps {
  activity: Activity;
  onClick: () => void;
}

export function ActivityRow({ activity, onClick }: ActivityRowProps) {
  const targetTiming = activity.targetTiming || 'Not Specified';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full grid grid-cols-12 items-center gap-4 bg-surface py-3.5 px-5 text-left border-b border-subtle last:border-0 hover:bg-surface/50 transition-colors focus:outline-none focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary group"
    >
      {/* Activity Title & ID */}
      <div className="col-span-4 flex flex-col pr-2">
        {activity.id && <span className="text-[10px] font-mono text-muted group-hover:text-secondary transition-colors mb-0.5">{activity.id}</span>}
        <span className="text-sm font-medium text-primary line-clamp-2 leading-snug">{activity.title}</span>
      </div>

      {/* Context (Component / Sub-Component) */}
      <div className="col-span-3 flex flex-col pr-2">
        <span className="text-sm font-medium text-primary truncate">{activity.component}</span>
        <span className="text-xs text-secondary truncate mt-0.5">{activity.subComponent}</span>
      </div>

      {/* Agency */}
      <div className="col-span-2 flex items-center pr-2">
        <span className="text-xs font-medium text-secondary truncate">{activity.agency}</span>
      </div>

      {/* Target / Timing */}
      <div className="col-span-1 flex items-center">
        <span className="text-xs text-secondary whitespace-nowrap truncate">{targetTiming}</span>
      </div>

      {/* Value */}
      <div className="col-span-1 flex justify-end items-center pr-2">
        <span className="text-xs font-semibold text-primary whitespace-nowrap">
          {activity.estValue !== null && activity.estValue > 0 ? formatCurrencyValue(activity.estValue) : '-'}
        </span>
      </div>

      {/* Statuses */}
      <div className="col-span-1 flex flex-col items-end gap-1">
        <StatusBadge status={activity.completionStatus} />
        <StatusBadge status={activity.timelineStatus} />
      </div>
    </button>
  );
}
