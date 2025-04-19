import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';
import { queryClient } from './query-client';

interface QueryProviderProps {
  children: ReactNode;
  enableDevTools?: boolean;
}

/**
 * Provider component for React Query
 * Wraps the application with QueryClientProvider and optionally includes React Query DevTools
 */
export function QueryProvider({ 
  children, 
  enableDevTools = process.env.NODE_ENV === 'development' 
}: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {enableDevTools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
} 