export const PRESENTATION_STATES = {
  COMPLETED: "Completed",
  AT_RISK: "At Risk",
  SCHEDULED: "Scheduled",
  TBC: "TBC",
} as const;

export type PresentationState = typeof PRESENTATION_STATES[keyof typeof PRESENTATION_STATES];
