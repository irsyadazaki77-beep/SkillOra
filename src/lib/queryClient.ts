import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/apiClient';

/**
 * Intelligent retry logic:
 * - Do NOT retry client errors (400, 401, 403, 404, 422)
 * - Retry transient network failures or 5xx up to 2 times
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (error instanceof ApiError) {
    if (error.status >= 400 && error.status < 500) {
      return false;
    }
  }
  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 1000 * 60 * 2, // 2 minutes default stale time
      gcTime: 1000 * 60 * 10,   // 10 minutes cache garbage collection
    },
    mutations: {
      retry: false,
    },
  },
});

/**
 * Auth Cache Isolation Helper
 * Call this upon user logout or switching accounts to prevent any cross-user data leakage.
 */
export function clearAuthQueryCache(): void {
  queryClient.clear();
  queryClient.removeQueries();
}
