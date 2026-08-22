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
      <div className="bg-pastel-blue rounded-2xl px-5 py-3 lg:px-6 lg:py-4 flex flex-col justify-center min-h-[104px]">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-gray-700 mb-1">
          Overall Completion
        </h3>
        <div className="flex items-baseline gap-1 mt-auto">
          <span className="text-4xl font-light tracking-tighter text-gray-900 leading-none">
            {metrics.completionPercentage}
          </span>
          <span className="text-xl font-medium text-gray-700">%</span>
        </div>
        <p className="text-xs font-medium text-gray-500 mt-1">
          {completedActivities} of {metrics.totalActivities} completed
        </p>
      </div>

      {/* At Risk */}
      <div className="bg-pastel-purple rounded-2xl px-5 py-3 lg:px-6 lg:py-4 flex flex-col justify-center min-h-[104px]">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-gray-700 mb-1">
          Activities at Risk
        </h3>
        <div className="flex items-baseline mt-auto">
          <span className="text-4xl font-light tracking-tighter text-gray-900 leading-none">
            {metrics.atRiskActivities.length}
          </span>
        </div>
        <p className="text-xs font-medium text-red-600 mt-1 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
          Immediate / Overdue
        </p>
      </div>

      {/* Estimated Value */}
      <div className="bg-pastel-blue rounded-2xl px-5 py-3 lg:px-6 lg:py-4 flex flex-col justify-center min-h-[104px]">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-gray-700 mb-1">
          Estimated Value
        </h3>
        <div className="flex items-baseline mt-auto">
          <span className="text-xl font-medium text-gray-700 mr-1">₹</span>
          <span className="text-4xl font-light tracking-tighter text-gray-900 leading-none">
            {metrics.totalEstValue.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
          </span>
          <span className="text-xl font-medium text-gray-700 ml-1">L</span>
        </div>
        <p className="text-xs font-medium text-gray-500 mt-1">
          Total Programme
        </p>
      </div>

      {/* Value at Risk */}
      <div className="bg-pastel-purple rounded-2xl px-5 py-3 lg:px-6 lg:py-4 flex flex-col justify-center min-h-[104px]">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-gray-700 mb-1">
          Value at Risk
        </h3>
        <div className="flex items-baseline mt-auto">
          <span className="text-xl font-medium text-red-600 mr-1">₹</span>
          <span className="text-4xl font-light tracking-tighter text-red-600 leading-none">
            {metrics.totalEstValueAtRisk.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
          </span>
          <span className="text-xl font-medium text-red-600 ml-1">L</span>
        </div>
        <p className="text-xs font-medium text-gray-500 mt-1">
          At-risk estimated value
        </p>
      </div>

    </div>
  );
}
