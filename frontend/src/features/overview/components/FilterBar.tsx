import { Select } from "../../../components/ui/Select";

interface FilterBarProps {
  filters: {
    selectedAgency: string;
    setSelectedAgency: (v: string) => void;
    availableAgencies: string[];
    selectedSubComponent: string;
    setSelectedSubComponent: (v: string) => void;
    availableSubComponents: string[];
    selectedTimeline: string;
    setSelectedTimeline: (v: string) => void;
    availableTimelines: string[];
  };
}

export function FilterBar({ filters }: FilterBarProps) {
  
  const agencyOptions = filters.availableAgencies.map(a => ({
    value: a,
    label: a === 'All' ? 'All Agencies' : a
  }));

  const subComponentOptions = filters.availableSubComponents.map(s => ({
    value: s,
    label: s === 'All' ? 'All Sub-Workstreams' : s
  }));

  const timelineOptions = filters.availableTimelines.map(t => ({
    value: t,
    label: t === 'All' ? 'All Statuses' : t
  }));

  return (
    <div className="flex flex-row flex-wrap items-center gap-3">
      <Select 
        label="Agency"
        value={filters.selectedAgency} 
        onChange={filters.setSelectedAgency}
        options={agencyOptions}
      />
      
      <Select 
        label="Sub-Workstream"
        value={filters.selectedSubComponent} 
        onChange={filters.setSelectedSubComponent}
        options={subComponentOptions}
      />
      
      <Select 
        label="Timeline"
        value={filters.selectedTimeline} 
        onChange={filters.setSelectedTimeline}
        options={timelineOptions}
      />
    </div>
  );
}
