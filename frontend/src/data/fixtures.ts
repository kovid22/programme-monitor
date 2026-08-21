import type { Activity } from "./types";

import { toLocalDateString } from "../lib/dateUtils";

const getRelativeDateStr = (daysOffset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return toLocalDateString(d);
};

export const mockActivities: Activity[] = [
  {
    id: "1.1.1",
    component: "Workstream A",
    subComponent: "Sub-Workstream A1",
    agency: "Agency 1",
    title: "Activity 1 - Implementation Phase",
    targetDate: getRelativeDateStr(45), // Future
    estValue: 450.5,
    timelineStatus: "On Track",
    completionStatus: "In Progress"
  },
  {
    id: "1.1.2",
    component: "Workstream A",
    subComponent: "Sub-Workstream A1",
    agency: "Agency 1, Agency 2",
    title: "Activity 2 - Phase 1 Expansion",
    targetDate: getRelativeDateStr(-10), // Past
    estValue: 120.0,
    timelineStatus: "Overdue",
    completionStatus: "Delayed"
  },
  {
    id: "1.2.1",
    component: "Workstream A",
    subComponent: "Sub-Workstream A2",
    agency: "Agency 2",
    title: "Activity 3 - Structural Works",
    targetDate: getRelativeDateStr(14), // Near future
    estValue: 300.0,
    timelineStatus: "Due Soon",
    completionStatus: "In Progress"
  },
  {
    id: "1.2.2",
    component: "Workstream A",
    subComponent: "Sub-Workstream A2",
    agency: "Agency 2",
    title: "Activity 4 - Support Framework",
    targetDate: getRelativeDateStr(2), // Imminent
    estValue: 75.5,
    timelineStatus: "Immediate",
    completionStatus: "Not Started"
  },
  {
    id: "2.1.1",
    component: "Workstream B",
    subComponent: "Sub-Workstream B1",
    agency: "Agency 3",
    title: "Activity 5 - Team Onboarding",
    targetDate: getRelativeDateStr(-5), // Past but completed
    estValue: 15.0,
    timelineStatus: "On Track",
    completionStatus: "Completed"
  },
  {
    id: "2.1.2",
    component: "Workstream B",
    subComponent: "Sub-Workstream B1",
    agency: "Agency 3, Agency 1",
    title: "Activity 6 - Advanced Workshop",
    targetDate: null,
    estValue: null,
    timelineStatus: "TBC",
    completionStatus: "Not Started"
  },
  {
    id: "3.1.1",
    component: "Workstream C",
    subComponent: "Sub-Workstream C1",
    agency: "Agency 4",
    title: "Activity 7 - Baseline Assessment",
    targetDate: getRelativeDateStr(-25), // Past
    estValue: 40.0,
    timelineStatus: "Overdue",
    completionStatus: "In Progress"
  },
  {
    id: "3.1.2",
    component: "Workstream C",
    subComponent: "Sub-Workstream C1",
    agency: "Agency 4",
    title: "Activity 8 - Mid-term Review",
    targetDate: getRelativeDateStr(120), // Far future
    estValue: 60.0,
    timelineStatus: "On Track",
    completionStatus: "Not Started"
  },
  {
    id: "4.1.1",
    component: "Workstream D",
    subComponent: "Sub-Workstream D1",
    agency: "Agency 4",
    title: "Activity 9 - Policy Drafting",
    targetDate: getRelativeDateStr(5), // Near future
    estValue: 0,
    timelineStatus: "Immediate",
    completionStatus: "In Progress"
  },
  {
    id: "4.1.2",
    component: "Workstream D",
    subComponent: "Sub-Workstream D1",
    agency: "Agency 4, Agency 2",
    title: "Activity 10 - Digital Integration",
    targetDate: getRelativeDateStr(60), // Future
    estValue: 200.0,
    timelineStatus: "On Track",
    completionStatus: "In Progress"
  }
];
