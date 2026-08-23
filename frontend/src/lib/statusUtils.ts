import type { Activity } from "../data/types";
import { PRESENTATION_STATES, type PresentationState } from "../data/constants";

export function getPresentationState(activity: Activity): PresentationState {
  if (activity.completionStatus === 'Completed') {
    return PRESENTATION_STATES.COMPLETED;
  }
  
  if (activity.timelineStatus === 'Overdue' || activity.timelineStatus === 'Immediate') {
    return PRESENTATION_STATES.AT_RISK;
  }
  
  if (activity.timelineStatus === 'Due Soon' || activity.timelineStatus === 'On Track') {
    return PRESENTATION_STATES.SCHEDULED;
  }
  
  return PRESENTATION_STATES.TBC;
}

export function isEffectivelyAtRisk(activity: Activity): boolean {
  return getPresentationState(activity) === PRESENTATION_STATES.AT_RISK;
}
