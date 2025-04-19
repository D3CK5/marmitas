import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../stores';

/**
 * API configuration
 */
export const API_URL = import.meta.env.VITE_API_URL || 'https://api.marmitas.com.br';

/**
 * API request methods
 */
export enum ApiMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

/**
 * API request options
 */
export interface ApiRequestOptions extends AxiosRequestConfig {
  requiresAuth?: boolean;
  cacheKey?: string;
  cacheTTL?: number; // Time to live in milliseconds
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  status: number;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[]>;

  constructor(error: ApiErrorResponse) {
    super(error.message);
    this.name = 'ApiError';
    this.status = error.status;
    this.code = error.code;
    this.errors = error.errors;
  }
}

/**
 * Create API client
 */
export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add auth token if available
      const token = useAuthStore.getState().token;
      
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const { status, data } = error.response;
        
        // Handle 401 Unauthorized - logout user
        if (status === 401) {
          useAuthStore.getState().logout();
        }
        
        // Create API error
        const apiError: ApiErrorResponse = {
          status,
          message: typeof data === 'object' && data !== null && 'message' in data
            ? String(data.message)
            : 'An unexpected error occurred',
          code: typeof data === 'object' && data !== null && 'code' in data
            ? String(data.code)
            : undefined,
          errors: typeof data === 'object' && data !== null && 'errors' in data
            ? data.errors as Record<string, string[]>
            : undefined,
        };
        
        return Promise.reject(new ApiError(apiError));
      } else if (error.request) {
        // The request was made but no response was received
        return Promise.reject(new ApiError({
          status: 0,
          message: 'No response received from server. Please check your internet connection.',
        }));
      } else {
        // Something happened in setting up the request
        return Promise.reject(new ApiError({
          status: 0,
          message: error.message || 'An unexpected error occurred',
        }));
      }
    }
  );

  return client;
};

/**
 * Global API client instance
 */
export const apiClient = createApiClient();

/**
 * Simple in-memory cache for API responses
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const responseCache = new Map<string, CacheItem<any>>();

/**
 * Check if cache item is expired
 */
const isCacheExpired = <T>(cacheItem: CacheItem<T>): boolean => {
  const now = Date.now();
  return now - cacheItem.timestamp > cacheItem.ttl;
};

/**
 * Set cache item
 */
const setCacheItem = <T>(key: string, data: T, ttl: number): void => {
  responseCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
};

/**
 * Get cache item
 */
const getCacheItem = <T>(key: string): T | null => {
  const cacheItem = responseCache.get(key) as CacheItem<T> | undefined;
  
  if (!cacheItem) {
    return null;
  }
  
  if (isCacheExpired(cacheItem)) {
    responseCache.delete(key);
    return null;
  }
  
  return cacheItem.data;
};

/**
 * Clear cache
 */
export const clearApiCache = (): void => {
  responseCache.clear();
};

/**
 * Clear specific cache entry
 */
export const clearApiCacheItem = (key: string): void => {
  responseCache.delete(key);
};

/**
 * Default cache TTL (5 minutes)
 */
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

/**
 * Make API request with caching
 */
export const apiRequest = async <T>(
  method: ApiMethod,
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const {
    requiresAuth = true,
    cacheKey,
    cacheTTL = DEFAULT_CACHE_TTL,
    ...axiosOptions
  } = options;
  
  // Check authentication if required
  if (requiresAuth && !useAuthStore.getState().isAuthenticated) {
    throw new ApiError({
      status: 401,
      message: 'Authentication required',
    });
  }
  
  // Check cache for GET requests if cacheKey is provided
  if (method === ApiMethod.GET && cacheKey) {
    const cachedData = getCacheItem<T>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
  }
  
  try {
    const response: AxiosResponse<T> = await apiClient.request({
      method,
      url,
      ...axiosOptions,
    });
    
    // Cache successful GET responses if cacheKey is provided
    if (method === ApiMethod.GET && cacheKey) {
      setCacheItem<T>(cacheKey, response.data, cacheTTL);
    }
    
    return response.data;
  } catch (error) {
    // If error is already an ApiError, just rethrow it
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Otherwise, create a new ApiError
    throw new ApiError({
      status: 500,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Convenience methods for API requests
 */
export const api = {
  get: <T>(url: string, options?: ApiRequestOptions) =>
    apiRequest<T>(ApiMethod.GET, url, options),
    
  post: <T>(url: string, data?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(ApiMethod.POST, url, { ...options, data }),
    
  put: <T>(url: string, data?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(ApiMethod.PUT, url, { ...options, data }),
    
  patch: <T>(url: string, data?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(ApiMethod.PATCH, url, { ...options, data }),
    
  delete: <T>(url: string, options?: ApiRequestOptions) =>
    apiRequest<T>(ApiMethod.DELETE, url, options),
}; 