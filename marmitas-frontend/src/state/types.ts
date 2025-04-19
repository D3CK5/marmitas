/**
 * Base types for state management
 * These types are used throughout the state management system
 */

// Common response type for all API responses
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  error?: string;
}

// Generic pagination interface
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Paginated response interface
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

// Status enum for async operations
export enum AsyncStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

// Generic async state interface
export interface AsyncState<T, E = Error> {
  data: T | null;
  status: AsyncStatus;
  error: E | null;
  timestamp?: number;
}

// Function to create an initial async state
export const createInitialAsyncState = <T, E = Error>(): AsyncState<T, E> => ({
  data: null,
  status: AsyncStatus.IDLE,
  error: null,
});

// Function to set loading state
export const setLoadingState = <T, E = Error>(state: AsyncState<T, E>): AsyncState<T, E> => ({
  ...state,
  status: AsyncStatus.LOADING,
  error: null,
});

// Function to set success state
export const setSuccessState = <T, E = Error>(data: T): AsyncState<T, E> => ({
  data,
  status: AsyncStatus.SUCCESS,
  error: null,
  timestamp: Date.now(),
});

// Function to set error state
export const setErrorState = <T, E = Error>(error: E): AsyncState<T, E> => ({
  data: null,
  status: AsyncStatus.ERROR,
  error,
  timestamp: Date.now(),
});

// Generic data entity interface with ID
export interface Entity {
  id: string | number;
}

// Generic normalized data store
export interface NormalizedData<T extends Entity> {
  byId: Record<string | number, T>;
  allIds: Array<string | number>;
}

// Function to create an empty normalized state
export const createEmptyNormalizedData = <T extends Entity>(): NormalizedData<T> => ({
  byId: {},
  allIds: [],
});

// Function to normalize an array of entities
export const normalizeData = <T extends Entity>(
  entities: T[]
): NormalizedData<T> => {
  return entities.reduce(
    (acc, entity) => {
      acc.byId[entity.id] = entity;
      if (!acc.allIds.includes(entity.id)) {
        acc.allIds.push(entity.id);
      }
      return acc;
    },
    createEmptyNormalizedData<T>()
  );
};

// Function to denormalize data
export const denormalizeData = <T extends Entity>(
  normalizedData: NormalizedData<T>
): T[] => {
  return normalizedData.allIds.map(id => normalizedData.byId[id]);
};

// Optimistic update helpers
export interface OptimisticUpdate<T> {
  id: string | number;
  originalData: T | null;
  pendingData: T;
}

// Generic state slice interface
export interface StateSlice<T> {
  // Add common state slice properties here
  isInitialized: boolean;
  lastUpdated?: number;
  data: T;
} 