import { useState, useMemo } from 'react';
import type { Activity } from '../../../data/types';
import { parseLocalDate } from '../../../lib/dateUtils';

export type SortOption = 'urgency' | 'date_asc' | 'date_desc' | 'value_desc' | 'status' | 'alpha';

export function useActivitiesFilters(activities: Activity[]) {
  const [search, setSearch] = useState('');
  const [workstream, setWorkstream] = useState('All');
  const [agency, setAgency] = useState('All');
  const [timelineStatus, setTimelineStatus] = useState('All');
  const [completionStatus, setCompletionStatus] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('urgency');

  const filtered = useMemo(() => {
    // We create a shallow copy first to avoid mutating original arrays, though filter does this.
    let result = activities.filter(() => true);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.agency.toLowerCase().includes(q) ||
        a.component.toLowerCase().includes(q) ||
        a.subComponent.toLowerCase().includes(q)
      );
    }

    if (workstream !== 'All') {
      result = result.filter(a => a.component === workstream);
    }
    if (agency !== 'All') {
      result = result.filter(a => a.agency.includes(agency));
    }
    if (timelineStatus !== 'All') {
      result = result.filter(a => a.timelineStatus === timelineStatus);
    }
    if (completionStatus !== 'All') {
      result = result.filter(a => a.completionStatus === completionStatus);
    }

    // Sort
    const urgencyMap: Record<string, number> = {
      'Overdue': 1,
      'Immediate': 2,
      'Due Soon': 3,
      'On Track': 4,
      'TBC': 5
    };

    result.sort((a, b) => {
      if (sortBy === 'urgency') {
        const uA = urgencyMap[a.timelineStatus] || 99;
        const uB = urgencyMap[b.timelineStatus] || 99;
        if (uA !== uB) return uA - uB;
        if (!a.targetDate && !b.targetDate) return 0;
        if (!a.targetDate) return 1;
        if (!b.targetDate) return -1;
        return parseLocalDate(a.targetDate).getTime() - parseLocalDate(b.targetDate).getTime();
      }
      if (sortBy === 'date_asc') {
        if (!a.targetDate && !b.targetDate) return 0;
        if (!a.targetDate) return 1;
        if (!b.targetDate) return -1;
        return parseLocalDate(a.targetDate).getTime() - parseLocalDate(b.targetDate).getTime();
      }
      if (sortBy === 'date_desc') {
        if (!a.targetDate && !b.targetDate) return 0;
        if (!a.targetDate) return 1;
        if (!b.targetDate) return -1;
        return parseLocalDate(b.targetDate).getTime() - parseLocalDate(a.targetDate).getTime();
      }
      if (sortBy === 'value_desc') {
        return (b.estValue || 0) - (a.estValue || 0);
      }
      if (sortBy === 'status') {
        const uA = urgencyMap[a.timelineStatus] || 99;
        const uB = urgencyMap[b.timelineStatus] || 99;
        return uA - uB;
      }
      if (sortBy === 'alpha') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [activities, search, workstream, agency, timelineStatus, completionStatus, sortBy]);

  const availableWorkstreams = useMemo(() => ["All", ...Array.from(new Set(activities.map(a => a.component))).sort()], [activities]);
  
  const availableAgencies = useMemo(() => {
    const set = new Set<string>();
    activities.forEach(a => {
      a.agency.split(',').forEach(ag => set.add(ag.trim()));
    });
    return ["All", ...Array.from(set).sort()];
  }, [activities]);

  const availableTimelineStatuses = ["All", "Overdue", "Immediate", "Due Soon", "On Track", "TBC"];
  const availableCompletionStatuses = useMemo(() => ["All", ...Array.from(new Set(activities.map(a => a.completionStatus))).sort()], [activities]);

  const resetFilters = () => {
    setSearch('');
    setWorkstream('All');
    setAgency('All');
    setTimelineStatus('All');
    setCompletionStatus('All');
    setSortBy('urgency');
  };

  const hasActiveFilters = search.trim() !== '' || workstream !== 'All' || agency !== 'All' || timelineStatus !== 'All' || completionStatus !== 'All';

  return {
    search, setSearch,
    workstream, setWorkstream,
    agency, setAgency,
    timelineStatus, setTimelineStatus,
    completionStatus, setCompletionStatus,
    sortBy, setSortBy,
    filtered,
    availableWorkstreams,
    availableAgencies,
    availableTimelineStatuses,
    availableCompletionStatuses,
    resetFilters,
    hasActiveFilters
  };
}
