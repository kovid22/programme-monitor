import { useState, useEffect, useCallback } from 'react';
import type { Activity } from '../data/types';
import { fetchActivities } from '../api/activities';

export function useActivitiesData() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchActivities();
      setActivities(data);
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
    refresh: loadData
  };
}
