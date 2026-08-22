import type { Activity } from "../data/types";

export type PresentationState = 'completed' | 'risk' | 'upcoming' | 'normal' | 'tbc';

export function getPresentationState(activity: Activity): PresentationState {
  if (activity.completionStatus === 'Completed') {
    return 'completed';
  }
  
  if (activity.timelineStatus === 'Overdue' || activity.timelineStatus === 'Immediate') {
    return 'risk';
  }
  
  if (activity.timelineStatus === 'Due Soon') {
    return 'upcoming';
  }
  
  if (activity.timelineStatus === 'On Track') {
    return 'normal';
  }
  
  return 'tbc';
}

export function isEffectivelyAtRisk(activity: Activity): boolean {
  return getPresentationState(activity) === 'risk';
}
