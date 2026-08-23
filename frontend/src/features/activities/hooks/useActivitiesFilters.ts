import { useState, useMemo } from 'react';
import type { Activity } from '../../../data/types';
import { parseLocalDate } from '../../../lib/dateUtils';
import { isEffectivelyAtRisk } from '../../../lib/statusUtils';

export type SortOption = 'default' | 'serial_asc' | 'serial_desc' | 'date_asc' | 'date_desc' | 'value_asc' | 'value_desc' | 'urgency_asc' | 'urgency_desc' | 'alpha_asc' | 'alpha_desc' | 'status_asc' | 'status_desc';

export function useActivitiesFilters(
  activities: Activity[],
  initialFilters?: { timelineStatus?: string[] } | null
) {
  const [search, setSearch] = useState('');
  const [workstream, setWorkstream] = useState<string[]>([]);
  const [subWorkstream, setSubWorkstream] = useState<string[]>([]);
  const [agency, setAgency] = useState<string[]>([]);
  const [timelineStatus, setTimelineStatus] = useState<string[]>(initialFilters?.timelineStatus || []);
  const [completionStatus, setCompletionStatus] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const [prevInitialFilters, setPrevInitialFilters] = useState(initialFilters);
  if (initialFilters !== prevInitialFilters) {
    setPrevInitialFilters(initialFilters);
    if (initialFilters?.timelineStatus) {
      setTimelineStatus(initialFilters.timelineStatus);
    }
  }

  const filtered = useMemo(() => {
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
    if (subWorkstream.length > 0) {
      result = result.filter(a => subWorkstream.includes(a.subComponent));
    }
    if (agency.length > 0) {
      result = result.filter(a => agency.some(ag => a.agency.includes(ag)));
    }
    if (timelineStatus.length > 0) {
      result = result.filter(a => {
        if (!timelineStatus.includes(a.timelineStatus)) return false;
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

    const statusMap: Record<string, number> = {
      'Completed': 1,
      'In Progress': 2,
      'Not Started': 3,
      'Cancelled': 4,
      'Delayed': 5
    };

    result.sort((a, b) => {
      if (sortBy === 'default') return 0;
      
      if (sortBy === 'urgency_asc' || sortBy === 'urgency_desc') {
        const uA = urgencyMap[a.timelineStatus] || 99;
        const uB = urgencyMap[b.timelineStatus] || 99;
        const diff = uA - uB;
        if (diff !== 0) return sortBy === 'urgency_asc' ? diff : -diff;
        
        // Fallback to date
        if (!a.targetDate && !b.targetDate) return 0;
        if (!a.targetDate) return sortBy === 'urgency_asc' ? 1 : -1;
        if (!b.targetDate) return sortBy === 'urgency_asc' ? -1 : 1;
        const dateDiff = parseLocalDate(a.targetDate).getTime() - parseLocalDate(b.targetDate).getTime();
        return sortBy === 'urgency_asc' ? dateDiff : -dateDiff;
      }
      
      if (sortBy === 'date_asc' || sortBy === 'date_desc') {
        if (!a.targetDate && !b.targetDate) return 0;
        if (!a.targetDate) return 1;
        if (!b.targetDate) return -1;
        const diff = parseLocalDate(a.targetDate).getTime() - parseLocalDate(b.targetDate).getTime();
        return sortBy === 'date_asc' ? diff : -diff;
      }
      
      if (sortBy === 'value_asc' || sortBy === 'value_desc') {
        const diff = (a.estValue || 0) - (b.estValue || 0);
        return sortBy === 'value_asc' ? diff : -diff;
      }
      
      if (sortBy === 'status_asc' || sortBy === 'status_desc') {
        const sA = statusMap[a.completionStatus] || 99;
        const sB = statusMap[b.completionStatus] || 99;
        const diff = sA - sB;
        if (diff !== 0) return sortBy === 'status_asc' ? diff : -diff;
        return sortBy === 'status_asc' ? a.completionStatus.localeCompare(b.completionStatus) : b.completionStatus.localeCompare(a.completionStatus);
      }
      
      if (sortBy === 'alpha_asc' || sortBy === 'alpha_desc') {
        const diff = a.title.localeCompare(b.title);
        return sortBy === 'alpha_asc' ? diff : -diff;
      }
      
      if (sortBy === 'serial_asc' || sortBy === 'serial_desc') {
        const getNum = (id?: string | null) => parseInt((id || '0').replace(/\D/g, ''), 10) || 0;
        const nA = getNum(a.id);
        const nB = getNum(b.id);
        if (nA !== nB) {
          return sortBy === 'serial_asc' ? nA - nB : nB - nA;
        }
        return sortBy === 'serial_asc' ? (a.id || '').localeCompare(b.id || '') : (b.id || '').localeCompare(a.id || '');
      }
      
      return 0;
    });

    return result;
  }, [activities, search, workstream, subWorkstream, agency, timelineStatus, completionStatus, sortBy]);

  const availableWorkstreams = useMemo(() => ["All", ...Array.from(new Set(activities.map(a => a.component))).sort()], [activities]);
  
  const availableSubWorkstreams = useMemo(() => {
    // If workstreams are selected, only show subworkstreams for those workstreams
    const filteredForSub = workstream.length > 0 
      ? activities.filter(a => workstream.includes(a.component))
      : activities;
    const set = new Set(filteredForSub.map(a => a.subComponent));
    return ["All", ...Array.from(set).sort()];
  }, [activities, workstream]);
  
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
    setSubWorkstream([]);
    setAgency([]);
    setTimelineStatus([]);
    setCompletionStatus([]);
    // Do not reset sort! The prompt says "Changing filters must not reset the selected sort."
  };

  const hasActiveFilters = search.trim() !== '' || workstream.length > 0 || subWorkstream.length > 0 || agency.length > 0 || timelineStatus.length > 0 || completionStatus.length > 0;

  return {
    search, setSearch,
    workstream, setWorkstream,
    subWorkstream, setSubWorkstream,
    agency, setAgency,
    timelineStatus, setTimelineStatus,
    completionStatus, setCompletionStatus,
    sortBy, setSortBy,
    filtered,
    availableWorkstreams,
    availableSubWorkstreams,
    availableAgencies,
    availableTimelineStatuses,
    availableCompletionStatuses,
    resetFilters,
    hasActiveFilters,
    totalCount: activities.length,
    filteredCount: filtered.length
  };
}
