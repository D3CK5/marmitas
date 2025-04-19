import React from 'react';
import { AsyncStatus } from '../../state/types';
import { Spinner } from '../ui/Spinner';

export interface ContentLoaderProps<T> {
  status: AsyncStatus;
  data: T | null;
  error: Error | null;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode | ((error: Error) => React.ReactNode);
  emptyComponent?: React.ReactNode;
  children: (data: T) => React.ReactNode;
  retry?: () => void;
}

/**
 * ContentLoader component
 * Manages loading, error, and empty states for data fetching
 */
export function ContentLoader<T>({
  status,
  data,
  error,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
  retry,
}: ContentLoaderProps<T>): React.ReactElement {
  // Show loading state
  if (status === AsyncStatus.LOADING) {
    return (
      <>
        {loadingComponent || (
          <div className="flex justify-center items-center py-8">
            <Spinner size="lg" />
          </div>
        )}
      </>
    );
  }

  // Show error state
  if (status === AsyncStatus.ERROR && error) {
    if (errorComponent) {
      return (
        <>
          {typeof errorComponent === 'function'
            ? errorComponent(error)
            : errorComponent}
        </>
      );
    }

    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              {error.message || 'An error occurred'}
            </h3>
            {retry && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={retry}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 dark:text-red-200 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (status === AsyncStatus.SUCCESS && (!data || (Array.isArray(data) && data.length === 0))) {
    return (
      <>
        {emptyComponent || (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-md">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No data found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              There's no data available at the moment.
            </p>
          </div>
        )}
      </>
    );
  }

  // Show success state with data
  if (status === AsyncStatus.SUCCESS && data) {
    return <>{children(data)}</>;
  }

  // Default idle state
  return (
    <div className="flex justify-center items-center py-8">
      <p className="text-gray-500 dark:text-gray-400">Waiting to load data...</p>
    </div>
  );
}

export default ContentLoader; 