import { useEffect, useRef } from 'react';
import { X, Calendar, User, Briefcase, IndianRupee } from 'lucide-react';
import type { Activity } from '../../../data/types';
import { StatusBadge } from '../../../components/ui/Badge';
import { formatCurrencyValue } from '../../../lib/utils';

interface ActivityDetailDrawerProps {
  activity: Activity | null;
  onClose: () => void;
}

export function ActivityDetailDrawer({ activity, onClose }: ActivityDetailDrawerProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activity) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, activity]);

  useEffect(() => {
    if (activity && closeBtnRef.current) {
      // Small delay to ensure drawer is visible before focusing
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
    }
  }, [activity]);

  if (!activity) return null;

  const remarks = activity.remarks?.trim();

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className="fixed inset-y-0 right-0 w-full max-w-md bg-canvas shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-subtle"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-subtle">
          <h2 id="drawer-title" className="text-sm font-semibold text-primary">Activity Detail</h2>
          <button 
            ref={closeBtnRef}
            type="button" 
            onClick={onClose}
            className="p-2 -mr-2 text-secondary hover:text-primary rounded-lg hover:bg-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-3">
            {activity.id && <span className="text-xs font-mono text-muted">{activity.id}</span>}
            <h1 className="text-xl font-bold text-primary leading-tight">{activity.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <StatusBadge status={activity.completionStatus} />
              <StatusBadge status={activity.timelineStatus} />
            </div>
          </div>

          <div className="h-px w-full bg-subtle" />

          {/* Properties Grid */}
          <div className="flex flex-col gap-7">
            <div className="flex gap-4 items-start">
              <Briefcase size={18} className="text-muted mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Component</span>
                <span className="text-sm font-medium text-primary">{activity.component}</span>
                <span className="text-xs text-secondary mt-1">Sub-Component: {activity.subComponent}</span>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <User size={18} className="text-muted mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Agency / Responsible</span>
                <span className="text-sm font-medium text-primary">{activity.agency}</span>
                {activity.subAgency && (
                  <span className="text-xs text-secondary mt-1">Sub Agency: {activity.subAgency}</span>
                )}
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <Calendar size={18} className="text-muted mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Target / Timing</span>
                <span className="text-sm font-medium text-primary">{activity.targetTiming || 'Not Specified'}</span>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <IndianRupee size={18} className="text-muted mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Estimated Value</span>
                <span className="text-sm font-medium text-primary">
                  {activity.estValue !== null ? formatCurrencyValue(activity.estValue) : activity.estimatedValueRaw || 'Not Specified'}
                </span>
              </div>
            </div>

            {activity.pmcResourceAligned && (
              <div className="flex gap-4 items-start">
                <Briefcase size={18} className="text-muted mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">PMC Resource Aligned</span>
                  <span className="text-sm font-medium text-primary">{activity.pmcResourceAligned}</span>
                </div>
              </div>
            )}
          </div>

          {remarks && (
            <>
              <div className="h-px w-full bg-subtle" />
              <div className="rounded-xl border border-subtle bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Remarks</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-secondary">{remarks}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
