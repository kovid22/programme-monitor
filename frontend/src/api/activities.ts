import type { Activity, TimelineStatus, CompletionStatus } from '../data/types';

export interface BackendActivity {
  id: string | null;
  workstream: string;
  subWorkstream: string;
  agency: string;
  title: string;
  estimatedValue: number | null;
  targetDate: string | null;
  timelineStatus: string;
  completionStatus: string;
}

export interface ActivitiesResponse {
  activities: BackendActivity[];
  count: number;
}

export interface FetchResult {
  activities: Activity[];
  refreshedAt: string | null;
}

export async function fetchActivities(forceRefresh: boolean = false): Promise<FetchResult> {
  let baseUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (!baseUrl) {
    if (import.meta.env.DEV) {
      baseUrl = 'http://localhost:8000';
    } else {
      throw new Error('VITE_API_BASE_URL is not configured for production environment');
    }
  }
  
  const url = forceRefresh ? `${baseUrl}/api/activities?force_refresh=true` : `${baseUrl}/api/activities`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }
  
  const refreshedAt = response.headers.get('X-Data-Refreshed-At');
  const data: ActivitiesResponse = await response.json();
  
  const mappedActivities = data.activities.map(act => ({
    id: act.id,
    component: act.workstream,
    subComponent: act.subWorkstream,
    agency: act.agency,
    title: act.title,
    estValue: act.estimatedValue,
    targetDate: act.targetDate,
    timelineStatus: act.timelineStatus as TimelineStatus,
    completionStatus: act.completionStatus as CompletionStatus
  }));

  return { activities: mappedActivities, refreshedAt };
}
