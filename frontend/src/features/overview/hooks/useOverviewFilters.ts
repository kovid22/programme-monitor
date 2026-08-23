import { useState, useMemo } from "react";
import type { Activity } from "../../../data/types";
import { isEffectivelyAtRisk } from "../../../lib/statusUtils";

export function useOverviewFilters(activities: Activity[]) {
  const [workstream, setWorkstream] = useState<string[]>([]);
  const [subWorkstream, setSubWorkstream] = useState<string[]>([]);
  const [agency, setAgency] = useState<string[]>([]);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity: Activity) => {
      const wMatch = workstream.length === 0 || workstream.includes(activity.component);
      const swMatch = subWorkstream.length === 0 || subWorkstream.includes(activity.subComponent);
      
      const activityAgencies = activity.agency.split(",").map((a: string) => a.trim());
      const aMatch = agency.length === 0 || agency.some(ag => activityAgencies.includes(ag));
      
      return wMatch && swMatch && aMatch;
    });
  }, [activities, workstream, subWorkstream, agency]);

  // Derived Metrics
  const totalActivities = filteredActivities.length;
  const completedActivities = filteredActivities.filter((a: Activity) => a.completionStatus === "Completed").length;
  const completionPercentage = totalActivities === 0 ? 0 : Math.round((completedActivities / totalActivities) * 100);

  const atRiskActivities = filteredActivities.filter((a: Activity) => isEffectivelyAtRisk(a));
  
  const totalEstValue = filteredActivities.reduce((sum: number, a: Activity) => sum + (a.estValue || 0), 0);
  const totalEstValueAtRisk = atRiskActivities.reduce((sum: number, a: Activity) => sum + (a.estValue || 0), 0);

  // Available Filter Options
  const availableWorkstreams = useMemo(() => {
    const set = new Set(activities.map(a => a.component));
    return Array.from(set).sort();
  }, [activities]);

  const availableSubWorkstreams = useMemo(() => {
    // If workstreams are selected, only show subworkstreams for those workstreams
    const filteredForSub = workstream.length > 0 
      ? activities.filter(a => workstream.includes(a.component))
      : activities;
    const set = new Set(filteredForSub.map(a => a.subComponent));
    return Array.from(set).sort();
  }, [activities, workstream]);

  const availableAgencies = useMemo(() => {
    const agencies = new Set<string>();
    activities.forEach((a: Activity) => {
      a.agency.split(",").forEach((ag: string) => agencies.add(ag.trim()));
    });
    return Array.from(agencies).sort();
  }, [activities]);

  const resetFilters = () => {
    setWorkstream([]);
    setSubWorkstream([]);
    setAgency([]);
  };

  return {
    filteredActivities,
    metrics: {
      totalActivities,
      completionPercentage,
      atRiskActivities,
      totalEstValue,
      totalEstValueAtRisk
    },
    filters: {
      workstream,
      setWorkstream,
      availableWorkstreams,
      subWorkstream,
      setSubWorkstream,
      availableSubWorkstreams,
      agency,
      setAgency,
      availableAgencies,
      resetFilters,
      totalCount: activities.length,
      filteredCount: totalActivities
    }
  };
}
