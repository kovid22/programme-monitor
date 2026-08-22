import { useState, useMemo } from 'react';
import type { Activity } from '../../../data/types';
import { parseLocalDate } from '../../../lib/dateUtils';
import { isEffectivelyAtRisk } from '../../../lib/statusUtils';

export type SortOption = 'urgency' | 'date_asc' | 'date_desc' | 'value_desc' | 'status' | 'alpha';

export function useActivitiesFilters(
  activities: Activity[],
  initialFilters?: { timelineStatus?: string[] } | null
) {
  const [search, setSearch] = useState('');
  const [workstream, setWorkstream] = useState<string[]>([]);
  const [agency, setAgency] = useState<string[]>([]);
  const [timelineStatus, setTimelineStatus] = useState<string[]>(initialFilters?.timelineStatus || []);
  const [completionStatus, setCompletionStatus] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('urgency');

  const [prevInitialFilters, setPrevInitialFilters] = useState(initialFilters);
  if (initialFilters !== prevInitialFilters) {
    setPrevInitialFilters(initialFilters);
    if (initialFilters?.timelineStatus) {
      setTimelineStatus(initialFilters.timelineStatus);
    }
  }

  const filtered = useMemo(() => {
    // We create a shallow copy first to avoid mutating original arrays, though filter does this.
    let result = activities.filter(() => true);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(q) ||
        (a.id && a.id.toLowerCase().includes(q)) ||
        a.agency.toLowerCase().includes(q) ||
        a.component.toLowerCase().includes(q) ||
        a.subComponent.toLowerCase().includes(q)
      );
    }

    if (workstream.length > 0) {
      result = result.filter(a => workstream.includes(a.component));
    }
    if (agency.length > 0) {
      result = result.filter(a => agency.some(ag => a.agency.includes(ag)));
    }
    if (timelineStatus.length > 0) {
      result = result.filter(a => {
        if (!timelineStatus.includes(a.timelineStatus)) return false;
        // Apply completion-over-risk rule for risk statuses
        if (a.timelineStatus === 'Overdue' || a.timelineStatus === 'Immediate') {
          return isEffectivelyAtRisk(a);
        }
        return true;
      });
    }
    if (completionStatus.length > 0) {
      result = result.filter(a => completionStatus.includes(a.completionStatus));
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
    setWorkstream([]);
    setAgency([]);
    setTimelineStatus([]);
    setCompletionStatus([]);
    setSortBy('urgency');
  };

  const hasActiveFilters = search.trim() !== '' || workstream.length > 0 || agency.length > 0 || timelineStatus.length > 0 || completionStatus.length > 0;

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
