import { useState, useMemo } from "react";
import type { Activity } from "../../../data/types";
import { mockActivities } from "../../../data/fixtures";

export function useOverviewFilters() {
  const [selectedAgency, setSelectedAgency] = useState<string>("All");
  const [selectedSubComponent, setSelectedSubComponent] = useState<string>("All");
  const [selectedTimeline, setSelectedTimeline] = useState<string>("All");

  const filteredActivities = useMemo(() => {
    return mockActivities.filter((activity: Activity) => {
      // Agency match (comma separated)
      const activityAgencies = activity.agency.split(",").map((a: string) => a.trim());
      const agencyMatch = selectedAgency === "All" || activityAgencies.includes(selectedAgency);
      
      const subCompMatch = selectedSubComponent === "All" || activity.subComponent === selectedSubComponent;
      const timelineMatch = selectedTimeline === "All" || activity.timelineStatus === selectedTimeline;
      
      return agencyMatch && subCompMatch && timelineMatch;
    });
  }, [selectedAgency, selectedSubComponent, selectedTimeline]);

  // Derived Metrics
  const totalActivities = filteredActivities.length;
  const completedActivities = filteredActivities.filter((a: Activity) => a.completionStatus === "Completed").length;
  const completionPercentage = totalActivities === 0 ? 0 : Math.round((completedActivities / totalActivities) * 100);

  const atRiskActivities = filteredActivities.filter(
    (a: Activity) => a.timelineStatus === "Immediate" || a.timelineStatus === "Overdue"
  );
  
  const totalEstValue = filteredActivities.reduce((sum: number, a: Activity) => sum + (a.estValue || 0), 0);
  const totalEstValueAtRisk = atRiskActivities.reduce((sum: number, a: Activity) => sum + (a.estValue || 0), 0);

  // Available Filter Options
  const availableAgencies = useMemo(() => {
    const agencies = new Set<string>();
    mockActivities.forEach((a: Activity) => {
      a.agency.split(",").forEach((ag: string) => agencies.add(ag.trim()));
    });
    return ["All", ...Array.from(agencies).sort()];
  }, []);

  const availableSubComponents = useMemo(() => {
    const subComps = new Set<string>();
    mockActivities.forEach((a: Activity) => subComps.add(a.subComponent));
    return ["All", ...Array.from(subComps).sort()];
  }, []);

  const availableTimelines = ["All", "Immediate", "Overdue", "Due Soon", "On Track", "TBC"];

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
