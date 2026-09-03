import type { Activity } from "../../../data/types";
import { formatCurrencyParts } from "../../../lib/utils";

interface ProgrammeHealthProps {
  metrics: {
    totalActivities: number;
    completionPercentage: number;
    atRiskActivities: Activity[];
    totalEstValue: number;
    dueSoonCount: number;
  };
}

export function ProgrammeHealth({ metrics }: ProgrammeHealthProps) {
  const completedActivities = Math.round((metrics.completionPercentage / 100) * metrics.totalActivities);
  const totalValParts = formatCurrencyParts(metrics.totalEstValue);

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      
      {/* Primary KPI - Completion */}
      <div className="bg-kpi-primary border border-subtle rounded-2xl px-5 py-3 lg:px-6 lg:py-4 flex flex-col justify-center min-h-[104px]">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-secondary mb-1">
          Overall Completion
        </h3>
        <div className="flex items-baseline gap-1 mt-auto">
          <span className="text-4xl font-light tracking-tighter text-primary leading-none">
            {metrics.completionPercentage}
          </span>
          <span className="text-xl font-medium text-secondary">%</span>
        </div>
        <p className="text-xs font-medium text-secondary mt-2">
          {completedActivities} of {metrics.totalActivities} completed
        </p>
      </div>

      {/* Estimated Value */}
      <div className="bg-kpi-secondary border border-subtle rounded-2xl px-5 py-3 lg:px-6 lg:py-4 flex flex-col justify-center min-h-[104px]">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-secondary mb-1">
          Estimated Value
        </h3>
        <div className="flex items-baseline mt-auto">
          <span className="text-xl font-medium text-secondary mr-1">₹</span>
          <span className="text-4xl font-light tracking-tighter text-primary leading-none">
            {totalValParts.value}
          </span>
          <span className="text-xl font-medium text-secondary ml-1">{totalValParts.unit}</span>
        </div>
        <p className="text-xs font-medium text-secondary mt-2">
          Total Programme
        </p>
      </div>

      {/* Due Soon */}
      <div className="bg-kpi-primary border border-subtle rounded-2xl px-5 py-3 lg:px-6 lg:py-4 flex flex-col justify-center min-h-[104px]">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-secondary mb-1">
          Due Soon
        </h3>
        <div className="flex items-baseline mt-auto">
          <span className="text-4xl font-light tracking-tighter text-primary leading-none">
            {metrics.dueSoonCount}
          </span>
        </div>
        <p className="text-xs font-medium text-warning mt-2 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-warning"></span>
          Upcoming deadlines
        </p>
      </div>

      {/* At Risk */}
      <div className="bg-kpi-secondary border border-subtle rounded-2xl px-5 py-3 lg:px-6 lg:py-4 flex flex-col justify-center min-h-[104px]">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-secondary mb-1">
          Activities at Risk
        </h3>
        <div className="flex items-baseline mt-auto">
          <span className="text-4xl font-light tracking-tighter text-primary leading-none">
            {metrics.atRiskActivities.length}
          </span>
        </div>
        <p className="text-xs font-medium text-danger mt-2 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-state-risk"></span>
          Immediate / Overdue
        </p>
      </div>

    </div>
  );
}
