import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

/**
 * Default stale time (5 minutes)
 */
export const DEFAULT_STALE_TIME = 5 * 60 * 1000;

/**
 * Default cache time (30 minutes)
 */
export const DEFAULT_CACHE_TIME = 30 * 60 * 1000;

/**
 * Default retry function
 * - Retries up to 3 times
 * - Doesn't retry for 401, 403, 404 errors
 */
export const defaultRetryFn = (failureCount: number, error: unknown) => {
  // Maximum 3 retry attempts
  if (failureCount >= 3) {
    return false;
  }
  
  // Don't retry for certain API errors
  if (error instanceof ApiError) {
    const nonRetryableStatuses = [401, 403, 404];
    if (nonRetryableStatuses.includes(error.status)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Create React Query client
 */
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_CACHE_TIME,
        retry: defaultRetryFn,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

/**
 * Global query client instance
 */
export const queryClient = createQueryClient(); 