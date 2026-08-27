import { useState, useMemo } from "react";
import type { Activity } from "../../../data/types";
import { isEffectivelyAtRisk } from "../../../lib/statusUtils";

export function useOverviewFilters(activities: Activity[]) {
  const [component, setComponent] = useState<string[]>([]);
  const [subComponent, setSubComponent] = useState<string[]>([]);
  const [agency, setAgency] = useState<string[]>([]);
  const [subAgency, setSubAgency] = useState<string[]>([]);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity: Activity) => {
      const componentMatch = component.length === 0 || component.includes(activity.component);
      const subComponentMatch = subComponent.length === 0 || subComponent.includes(activity.subComponent);
      
      const aMatch = agency.length === 0 || agency.some(ag => activity.agencies.includes(ag));
      const subAgencyMatch = subAgency.length === 0 || (
        activity.subAgency !== null && subAgency.includes(activity.subAgency)
      );
      
      return componentMatch && subComponentMatch && aMatch && subAgencyMatch;
    });
  }, [activities, component, subComponent, agency, subAgency]);

  // Derived Metrics
  const totalActivities = filteredActivities.length;
  const completedActivities = filteredActivities.filter((a: Activity) => a.completionStatus === "Completed").length;
  const completionPercentage = totalActivities === 0 ? 0 : Math.round((completedActivities / totalActivities) * 100);

  const atRiskActivities = filteredActivities.filter((a: Activity) => isEffectivelyAtRisk(a));
  const dueSoonCount = filteredActivities.filter((a: Activity) => a.timelineStatus === "Due Soon").length;
  
  const totalEstValue = filteredActivities.reduce((sum: number, a: Activity) => sum + (a.estValue || 0), 0);

  // Available Filter Options
  const availableComponents = useMemo(() => {
    const set = new Set(activities.map(a => a.component));
    return Array.from(set).sort();
  }, [activities]);

  const availableSubComponents = useMemo(() => {
    const filteredForSub = component.length > 0
      ? activities.filter(activity => component.includes(activity.component))
      : activities;
    const set = new Set(filteredForSub.map(a => a.subComponent));
    return Array.from(set).sort();
  }, [activities, component]);

  const availableAgencies = useMemo(() => {
    const agencies = new Set<string>();
    activities.forEach((a: Activity) => {
      a.agencies.forEach(agencyValue => agencies.add(agencyValue));
    });
    return Array.from(agencies).sort();
  }, [activities]);

  const availableSubAgencies = useMemo(
    () => Array.from(new Set(
      activities.flatMap(activity => activity.subAgency ? [activity.subAgency] : [])
    )).sort(),
    [activities],
  );

  const resetFilters = () => {
    setComponent([]);
    setSubComponent([]);
    setAgency([]);
    setSubAgency([]);
  };

  return {
    filteredActivities,
    metrics: {
      totalActivities,
      completionPercentage,
      atRiskActivities,
      totalEstValue,
      dueSoonCount,
    },
    filters: {
      component,
      setComponent,
      availableComponents,
      subComponent,
      setSubComponent,
      availableSubComponents,
      agency,
      setAgency,
      availableAgencies,
      subAgency,
      setSubAgency,
      availableSubAgencies,
      resetFilters,
      totalCount: activities.length,
      filteredCount: totalActivities
    }
  };
}
