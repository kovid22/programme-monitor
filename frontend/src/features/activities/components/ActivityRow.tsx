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
      className="w-full grid grid-cols-12 items-center gap-4 bg-surface py-4 px-5 text-left border-b border-subtle last:border-0 hover:bg-surface/50 transition-colors focus:outline-none focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary group"
    >
      {/* Component */}
      <div className="col-span-2 flex items-center pr-2">
        <span className="text-sm font-medium text-primary truncate">{activity.component}</span>
      </div>

      {/* Agency */}
      <div className="col-span-2 flex items-center pr-2">
        <span className="truncate text-[13px] font-medium leading-snug text-secondary">{activity.agency}</span>
      </div>

      {/* Activity Title & ID */}
      <div className="col-span-3 flex flex-col pr-2">
        {activity.id && <span className="mb-1 text-xs font-mono text-muted transition-colors group-hover:text-secondary">{activity.id}</span>}
        <span className="line-clamp-2 text-sm font-medium leading-snug text-primary">{activity.title}</span>
      </div>

      {/* Sub-Component */}
      <div className="col-span-2 flex items-center pr-2">
        <span className="truncate text-[13px] leading-snug text-secondary">{activity.subComponent}</span>
      </div>

      {/* Target / Timing */}
      <div className="col-span-1 flex items-center">
        <span className="truncate whitespace-nowrap text-[13px] leading-snug text-secondary">{targetTiming}</span>
      </div>

      {/* Value */}
      <div className="col-span-1 flex justify-end items-center pr-2">
        <span className="whitespace-nowrap text-[13px] font-semibold leading-snug text-primary">
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
