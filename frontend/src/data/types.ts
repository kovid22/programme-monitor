export type TimelineStatus = 'Immediate' | 'Overdue' | 'Due Soon' | 'On Track' | 'To Be Confirmed';
export type CompletionStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';

export interface Activity {
  id?: string | null;
  component: string;
  subComponent: string;
  agency: string;
  agencies: string[];
  subAgency: string | null;
  title: string;
  estValue: number | null;
  estimatedValueRaw: string;
  targetTiming: string;
  targetDate: string | null;
  timelineStatus: TimelineStatus;
  completionStatus: CompletionStatus;
  pmcResourceAligned: string | null;
  remarks: string | null;
}
