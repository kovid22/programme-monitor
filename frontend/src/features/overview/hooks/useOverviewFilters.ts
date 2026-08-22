import { useState, useMemo } from "react";
import type { Activity } from "../../../data/types";
import { isEffectivelyAtRisk } from "../../../lib/statusUtils";

export function useOverviewFilters(activities: Activity[]) {
  const [selectedAgency, setSelectedAgency] = useState<string[]>([]);
  const [selectedSubComponent, setSelectedSubComponent] = useState<string[]>([]);
  const [selectedTimeline, setSelectedTimeline] = useState<string[]>([]);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity: Activity) => {
      // Agency match (comma separated)
      const activityAgencies = activity.agency.split(",").map((a: string) => a.trim());
      const agencyMatch = selectedAgency.length === 0 || selectedAgency.some(ag => activityAgencies.includes(ag));
      
      const subCompMatch = selectedSubComponent.length === 0 || selectedSubComponent.includes(activity.subComponent);
      const timelineMatch = selectedTimeline.length === 0 || selectedTimeline.includes(activity.timelineStatus);
      
      return agencyMatch && subCompMatch && timelineMatch;
    });
  }, [activities, selectedAgency, selectedSubComponent, selectedTimeline]);

  // Derived Metrics
  const totalActivities = filteredActivities.length;
  const completedActivities = filteredActivities.filter((a: Activity) => a.completionStatus === "Completed").length;
  const completionPercentage = totalActivities === 0 ? 0 : Math.round((completedActivities / totalActivities) * 100);

  const atRiskActivities = filteredActivities.filter((a: Activity) => isEffectivelyAtRisk(a));
  
  const totalEstValue = filteredActivities.reduce((sum: number, a: Activity) => sum + (a.estValue || 0), 0);
  const totalEstValueAtRisk = atRiskActivities.reduce((sum: number, a: Activity) => sum + (a.estValue || 0), 0);

  // Available Filter Options
  const availableAgencies = useMemo(() => {
    const agencies = new Set<string>();
    activities.forEach((a: Activity) => {
      a.agency.split(",").forEach((ag: string) => agencies.add(ag.trim()));
    });
    return ["All", ...Array.from(agencies).sort()];
  }, [activities]);

  const availableSubComponents = useMemo(() => {
    const subComps = new Set<string>();
    activities.forEach((a: Activity) => subComps.add(a.subComponent));
    return ["All", ...Array.from(subComps).sort()];
  }, [activities]);

  const availableTimelines = ["All", "Overdue", "Immediate", "Due Soon", "On Track", "TBC"];

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
      selectedAgency,
      setSelectedAgency,
      availableAgencies,
      selectedSubComponent,
      setSelectedSubComponent,
      availableSubComponents,
      selectedTimeline,
      setSelectedTimeline,
      availableTimelines
    }
  };
}
