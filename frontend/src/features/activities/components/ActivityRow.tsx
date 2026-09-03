import type { Activity } from '../../../data/types';
import { StatusBadge } from '../../../components/ui/Badge';
import { formatCurrencyValue, cn } from '../../../lib/utils';

interface ActivityRowProps {
  activity: Activity;
  onClick: () => void;
  gridColsClass: string;
}

export function ActivityRow({ activity, onClick, gridColsClass }: ActivityRowProps) {
  const targetTiming = activity.targetTiming || 'Not Specified';
  const agenciesDisplay = activity.agencies ? activity.agencies.join(', ') : activity.agency;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full grid items-center gap-3 bg-surface py-3 px-5 text-left border-b border-subtle last:border-0 hover:bg-surface/50 transition-colors focus:outline-none focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary group",
        gridColsClass
      )}
    >
      {/* Component & Sub-Component */}
      <div className="flex flex-col pr-2 min-w-0">
        <span className="text-[13px] font-medium text-primary truncate" title={activity.component}>
          {activity.component}
        </span>
        <span className="text-xs text-secondary truncate mt-0.5" title={activity.subComponent}>
          {activity.subComponent}
        </span>
      </div>

      {/* Agency */}
      <div className="flex flex-col items-center justify-center px-2 min-w-0">
        <span className="text-[13px] font-medium text-secondary line-clamp-2 leading-snug text-center" title={agenciesDisplay}>
          {agenciesDisplay}
        </span>
      </div>

      {/* Activity Title & ID */}
      <div className="flex items-start gap-1.5 pr-2 min-w-0">
        {activity.id && (
          <span className="text-secondary font-normal shrink-0">{activity.id}.</span>
        )}
        <div className="min-w-0 flex-1">
          <span className="line-clamp-2 text-sm font-medium leading-snug text-primary" title={activity.title}>
            {activity.title}
          </span>
        </div>
      </div>

      {/* Target / Timing */}
      <div className="flex items-center justify-center px-2 min-w-0">
        <span className="text-[13px] text-secondary truncate text-center" title={targetTiming}>{targetTiming}</span>
      </div>

      {/* Value */}
      <div className="flex justify-center items-center px-2 min-w-0">
        <span className="text-[13px] font-semibold text-primary whitespace-nowrap text-center">
          {activity.estValue !== null && activity.estValue > 0 ? formatCurrencyValue(activity.estValue) : '-'}
        </span>
      </div>

      {/* Statuses */}
      <div className="flex flex-col items-end justify-center gap-1.5 min-w-0">
        <StatusBadge status={activity.completionStatus} variant="dot-text" />
        <StatusBadge status={activity.timelineStatus} variant="soft-pill" />
      </div>
    </button>
  );
}
