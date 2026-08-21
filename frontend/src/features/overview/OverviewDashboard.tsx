import { FilterBar } from "./components/FilterBar";
import { ProgrammeHealth } from "./components/ProgrammeHealth";
import { DeliveryCalendar } from "./components/DeliveryCalendar";
import { DeliveryFlow } from "./components/DeliveryFlow";
import { ValueConcentration } from "./components/ValueConcentration";
import { RiskAlerts } from "./components/RiskAlerts";
import { useOverviewFilters } from "./hooks/useOverviewFilters";
import type { Activity } from "../../data/types";

export interface OverviewDashboardProps {
  activities: Activity[];
}

export function OverviewDashboard({ activities }: OverviewDashboardProps) {
  const { filteredActivities, metrics, filters } = useOverviewFilters(activities);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary mb-1.5">
            Programme Overview
          </h1>
          <p className="text-sm text-secondary">
            Monitor key activities, risks, and completion status.
          </p>
        </div>
        <FilterBar filters={filters} />
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 mt-6 text-center bg-canvas rounded-2xl border border-subtle">
          <h3 className="text-base font-semibold text-primary mb-2">No programme data</h3>
          <p className="text-sm text-secondary max-w-md mx-auto">
            The dashboard cannot be rendered because there are no activities in the source system.
          </p>
        </div>
      ) : (
        <>
          {/* Primary KPI Tray */}
          <ProgrammeHealth metrics={metrics} />

          {/* Row 1: Timeline & Needs Attention */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 flex flex-col">
              <DeliveryCalendar activities={filteredActivities} />
            </div>
            <div className="lg:col-span-2 flex flex-col">
              <RiskAlerts activities={metrics.atRiskActivities} />
            </div>
          </div>

          {/* Row 2: Structure & Value */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 flex flex-col">
              <ValueConcentration activities={filteredActivities} />
            </div>
            <div className="lg:col-span-3 flex flex-col min-w-0 overflow-hidden">
              <DeliveryFlow activities={filteredActivities} />
            </div>
          </div>
        </>
      )}
      
    </div>
  );
}
