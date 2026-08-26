import { useState, useEffect, useCallback } from 'react';
import type { Activity } from '../data/types';
import { ActivitiesApiError, fetchActivities } from '../api/activities';

export function useActivitiesData(onAuthenticationFailure: () => Promise<void>) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const { activities: newActivities, refreshedAt: newRefreshedAt } = await fetchActivities(forceRefresh);
      setActivities(newActivities);
      if (newRefreshedAt) {
        setRefreshedAt(newRefreshedAt);
      }
    } catch (error) {
      if (error instanceof ActivitiesApiError) {
        if (error.kind === 'authentication') {
          await onAuthenticationFailure();
          return;
        }
        if (error.kind === 'accessDenied') {
          setError('Your account is not authorized to access Programme Monitor.');
          return;
        }
        if (error.kind === 'authenticationService') {
          setError('Authentication service is temporarily unavailable. Please try again later.');
          return;
        }
      }
      setError('Unable to load programme data.');
    } finally {
      setIsLoading(false);
    }
  }, [onAuthenticationFailure]);

  useEffect(() => {
    // eslint-disable-next-line
    loadData();
  }, [loadData]);

  return {
    activities,
    isLoading,
    error,
    refresh: loadData,
    refreshedAt
  };
}
