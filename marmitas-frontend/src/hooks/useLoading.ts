import { useState, useCallback } from 'react';

export interface UseLoadingOptions {
  initialLoading?: boolean;
  initialError?: Error | null;
}

export interface UseLoadingReturn {
  isLoading: boolean;
  error: Error | null;
  startLoading: () => void;
  stopLoading: (error?: Error | null) => void;
  resetError: () => void;
  wrapPromise: <T>(promise: Promise<T>) => Promise<T>;
}

/**
 * Hook for managing loading and error states
 * Useful for handling async operations
 */
export function useLoading({
  initialLoading = false,
  initialError = null,
}: UseLoadingOptions = {}): UseLoadingReturn {
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading);
  const [error, setError] = useState<Error | null>(initialError);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback((error: Error | null = null) => {
    setIsLoading(false);
    setError(error);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Wraps a promise with loading state management
   * Automatically sets loading state and handles errors
   */
  const wrapPromise = useCallback(
    async <T>(promise: Promise<T>): Promise<T> => {
      try {
        startLoading();
        const result = await promise;
        stopLoading();
        return result;
      } catch (err) {
        stopLoading(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    resetError,
    wrapPromise,
  };
}

export default useLoading; 