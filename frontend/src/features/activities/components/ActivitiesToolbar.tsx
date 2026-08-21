import { Search, X, ListFilter } from 'lucide-react';
import { Select } from "../../../components/ui/Select";
import type { SortOption } from '../hooks/useActivitiesFilters';

import type { useActivitiesFilters } from '../hooks/useActivitiesFilters';

interface ActivitiesToolbarProps {
  filters: ReturnType<typeof useActivitiesFilters>;
}

export function ActivitiesToolbar({ filters }: ActivitiesToolbarProps) {
  const sortOptions = [
    { value: 'urgency', label: 'Operational Urgency' },
    { value: 'date_asc', label: 'Target Date (Closest)' },
    { value: 'date_desc', label: 'Target Date (Furthest)' },
    { value: 'value_desc', label: 'Est. Value (High to Low)' },
    { value: 'status', label: 'Timeline Status' },
    { value: 'alpha', label: 'Activity A-Z' },
  ];

  const workstreamOptions = filters.availableWorkstreams.map((w: string) => ({
    value: w, label: w === 'All' ? 'All Workstreams' : w
  }));
  const agencyOptions = filters.availableAgencies.map((a: string) => ({
    value: a, label: a === 'All' ? 'All Agencies' : a
  }));
  const timelineOptions = filters.availableTimelineStatuses.map((t: string) => ({
    value: t, label: t === 'All' ? 'All Timeline Statuses' : t
  }));
  const completionOptions = filters.availableCompletionStatuses.map((c: string) => ({
    value: c, label: c === 'All' ? 'All Completion Statuses' : c
  }));

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            <Search size={16} />
          </div>
          <input
            type="text"
            className="w-full bg-surface border border-subtle text-primary text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent placeholder:text-muted transition-colors"
            placeholder="Search activities, IDs, agencies..."
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
          />
          {filters.search && (
            <button
              onClick={() => filters.setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-primary transition-colors focus:outline-none"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select
            label="Sort by"
            value={filters.sortBy}
            onChange={(v) => filters.setSortBy(v as SortOption)}
            options={sortOptions}
          />
          {filters.hasActiveFilters && (
            <button
              onClick={filters.resetFilters}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-secondary hover:text-primary bg-surface border border-subtle rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ml-2"
            >
              <X size={14} />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-row flex-wrap items-center gap-3 p-3 bg-surface border border-subtle rounded-xl">
        <div className="flex items-center gap-2 mr-2 text-secondary">
          <ListFilter size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
        </div>
        <Select 
          label="Workstream"
          value={filters.workstream}
          onChange={filters.setWorkstream}
          options={workstreamOptions}
        />
        <Select 
          label="Agency"
          value={filters.agency}
          onChange={filters.setAgency}
          options={agencyOptions}
        />
        <Select 
          label="Timeline Status"
          value={filters.timelineStatus}
          onChange={filters.setTimelineStatus}
          options={timelineOptions}
        />
        <Select 
          label="Completion Status"
          value={filters.completionStatus}
          onChange={filters.setCompletionStatus}
          options={completionOptions}
        />
        
        {filters.hasActiveFilters && (
          <button
            onClick={filters.resetFilters}
            className="md:hidden flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary bg-canvas border border-subtle rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ml-auto"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
