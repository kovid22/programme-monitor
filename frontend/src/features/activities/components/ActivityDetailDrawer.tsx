import { useEffect, useRef } from 'react';
import { X, Calendar, User, Briefcase, IndianRupee } from 'lucide-react';
import type { Activity } from '../../../data/types';
import { StatusBadge } from '../../../components/ui/Badge';
import { parseLocalDate } from '../../../lib/dateUtils';

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

  const isRisk = activity.timelineStatus === 'Overdue' || activity.timelineStatus === 'Immediate';
  const targetDateStr = activity.targetDate ? parseLocalDate(activity.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC';

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
              <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${isRisk ? 'bg-danger/10 text-danger' : 'bg-surface border border-subtle text-secondary'}`}>
                {activity.timelineStatus}
              </span>
            </div>
          </div>

          <div className="h-px w-full bg-subtle" />

          {/* Properties Grid */}
          <div className="flex flex-col gap-6">
            <div className="flex gap-4 items-start">
              <Briefcase size={18} className="text-muted mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Workstream</span>
                <span className="text-sm font-medium text-primary">{activity.component}</span>
                <span className="text-xs text-secondary mt-1">{activity.subComponent}</span>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <User size={18} className="text-muted mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Agency</span>
                <span className="text-sm font-medium text-primary">{activity.agency}</span>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <Calendar size={18} className="text-muted mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Target Date</span>
                <span className="text-sm font-medium text-primary">{targetDateStr}</span>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <IndianRupee size={18} className="text-muted mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Estimated Value</span>
                <span className="text-sm font-medium text-primary">
                  {activity.estValue !== null && activity.estValue > 0 ? `₹${activity.estValue.toLocaleString('en-IN', { maximumFractionDigits: 1 })} Lakhs` : 'Not Specified'}
                </span>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-subtle" />
          
          <div className="p-4 bg-surface rounded-xl border border-subtle">
            <p className="text-sm text-secondary italic text-center">
              Detailed descriptions and edit controls will be available in a future release.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
