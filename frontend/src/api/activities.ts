import type { Activity, TimelineStatus, CompletionStatus } from '../data/types';
import { getAuthToken } from '../lib/firebase';

export interface BackendActivity {
  id: string | null;
  component: string;
  subComponent: string;
  agency: string;
  agencies: string[];
  subAgency: string | null;
  title: string;
  estimatedValue: number | null;
  estimatedValueRaw: string;
  targetTiming: string;
  targetDate: string | null;
  timelineStatus: string;
  completionStatus: string;
  pmcResourceAligned: string | null;
  remarks: string | null;
}

export interface ActivitiesResponse {
  activities: BackendActivity[];
  count: number;
}

export interface FetchResult {
  activities: Activity[];
  refreshedAt: string | null;
}

export type ActivitiesApiErrorKind =
  | 'authentication'
  | 'accessDenied'
  | 'authenticationService'
  | 'rateLimited'
  | 'refreshCooldown'
  | 'other';

export class ActivitiesApiError extends Error {
  readonly kind: ActivitiesApiErrorKind;

  constructor(kind: ActivitiesApiErrorKind) {
    super('Unable to fetch activities.');
    this.name = 'ActivitiesApiError';
    this.kind = kind;
  }
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
  const token = await getAuthToken();

  if (!token) {
    throw new ActivitiesApiError('authentication');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new ActivitiesApiError('other');
  }
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new ActivitiesApiError('authentication');
    }
    if (response.status === 403) {
      throw new ActivitiesApiError('accessDenied');
    }
    if (response.status === 503) {
      throw new ActivitiesApiError('authenticationService');
    }
    if (response.status === 429) {
      const errorBody: { detail?: unknown } | null = await response.json().catch(() => null);
      throw new ActivitiesApiError(
        errorBody?.detail === 'Data was refreshed recently. Please wait before refreshing again.'
          ? 'refreshCooldown'
          : 'rateLimited'
      );
    }
    throw new ActivitiesApiError('other');
  }
  
  const refreshedAt = response.headers.get('X-Data-Refreshed-At');
  const data: ActivitiesResponse = await response.json();
  
  const mappedActivities = data.activities.map(act => ({
    id: act.id,
    component: act.component,
    subComponent: act.subComponent,
    agency: act.agency,
    agencies: act.agencies,
    subAgency: act.subAgency,
    title: act.title,
    estValue: act.estimatedValue,
    estimatedValueRaw: act.estimatedValueRaw,
    targetTiming: act.targetTiming,
    targetDate: act.targetDate,
    timelineStatus: act.timelineStatus as TimelineStatus,
    completionStatus: act.completionStatus as CompletionStatus,
    pmcResourceAligned: act.pmcResourceAligned,
    remarks: act.remarks,
  }));

  return { activities: mappedActivities, refreshedAt };
}
