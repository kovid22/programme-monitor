import type { Activity } from "../../../data/types";

interface ProgrammeHealthProps {
  metrics: {
    totalActivities: number;
    completionPercentage: number;
    atRiskActivities: Activity[];
    totalEstValue: number;
    totalEstValueAtRisk: number;
  };
}

export function ProgrammeHealth({ metrics }: ProgrammeHealthProps) {
  const completedActivities = Math.round((metrics.completionPercentage / 100) * metrics.totalActivities);

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      
      {/* Primary KPI - Completion */}
      <div className="bg-pastel-blue dark:bg-surface dark:border dark:border-subtle rounded-2xl px-5 py-4 lg:px-6 lg:py-5 flex flex-col justify-center min-h-[120px]">
        <h3 className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted mb-1.5">
          Overall Completion
        </h3>
        <div className="flex items-baseline gap-1 mt-auto">
          <span className="text-5xl font-light tracking-tighter text-primary leading-none">
            {metrics.completionPercentage}
          </span>
          <span className="text-2xl font-light text-secondary">%</span>
        </div>
        <p className="text-xs font-medium text-secondary mt-1.5">
          {completedActivities} of {metrics.totalActivities} completed
        </p>
      </div>

      {/* At Risk */}
      <div className="bg-pastel-purple dark:bg-surface dark:border dark:border-subtle rounded-2xl px-5 py-4 lg:px-6 lg:py-5 flex flex-col justify-center min-h-[120px]">
        <h3 className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted mb-1.5">
          Activities at Risk
        </h3>
        <span className="text-4xl font-light tracking-tighter text-primary mt-auto">
          {metrics.atRiskActivities.length}
        </span>
        <p className="text-xs font-medium text-danger mt-1.5 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-danger"></span>
          Immediate / Overdue
        </p>
      </div>

      {/* Estimated Value */}
      <div className="bg-pastel-blue dark:bg-surface dark:border dark:border-subtle rounded-2xl px-5 py-4 lg:px-6 lg:py-5 flex flex-col justify-center min-h-[120px]">
        <h3 className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted mb-1.5">
          Estimated Value
        </h3>
        <span className="text-4xl font-light tracking-tighter text-primary mt-auto">
          <span className="text-xl font-light text-muted mr-1">₹</span>
          {metrics.totalEstValue.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
          <span className="text-lg text-muted ml-1">L</span>
        </span>
        <p className="text-xs font-medium text-secondary mt-1.5">
          Total Programme
        </p>
      </div>

      {/* Value at Risk */}
      <div className="bg-pastel-purple dark:bg-surface dark:border dark:border-subtle rounded-2xl px-5 py-4 lg:px-6 lg:py-5 flex flex-col justify-center min-h-[120px]">
        <h3 className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted mb-1.5">
          Value at Risk
        </h3>
        <span className="text-4xl font-light tracking-tighter text-danger mt-auto">
          <span className="text-xl font-light text-danger/70 mr-1">₹</span>
          {metrics.totalEstValueAtRisk.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
          <span className="text-lg text-danger/70 ml-1">L</span>
        </span>
        <p className="text-xs font-medium text-danger mt-1.5">
          At-risk estimated value
        </p>
      </div>

    </div>
  );
}
