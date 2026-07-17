import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Polls /api/dashboard every `intervalMs` milliseconds.
 * Returns { dashboardData, isLoading, error, refresh }
 */
export function useDashboard(intervalMs = 8000) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard`);
      if (!res.ok) throw new Error('Dashboard fetch failed');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const id = setInterval(fetchDashboard, intervalMs);
    return () => clearInterval(id);
  }, [fetchDashboard, intervalMs]);

  return { data, isLoading, error, refresh: fetchDashboard };
}
