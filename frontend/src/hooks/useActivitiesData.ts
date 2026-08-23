import { useState, useEffect, useCallback } from 'react';
import type { Activity } from '../data/types';
import { fetchActivities } from '../api/activities';

export function useActivitiesData() {
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
    } catch {
      setError('Unable to load programme data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
