export type TimelineStatus = 'Immediate' | 'Overdue' | 'Due Soon' | 'On Track' | 'TBC';
export type CompletionStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';

export interface Activity {
  id: string;               // Maps to "No."
  component: string;        // Maps to "Workstream"
  subComponent: string;     // Maps to "Sub-Workstream"
  agency: string;           // Maps to "Agency / Responsible" (comma-separated string)
  title: string;            // Maps to "Action / Activity"
  targetDate: string | null;// Maps to "Target Date"
  estValue: number | null;  // Maps to "Est. Value (INR Lakh)"
  timelineStatus: TimelineStatus;
  completionStatus: CompletionStatus;
}
