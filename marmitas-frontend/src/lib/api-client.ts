/**
 * API Client for communicating with the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Default request headers
 */
const getDefaultHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Generic request function
 */
const request = async <T>(
  endpoint: string,
  method: string = 'GET',
  data?: unknown
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: getDefaultHeaders(),
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  // Handle HTTP errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
};

/**
 * API client with methods for different HTTP verbs
 */
export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) => request<T>(endpoint, 'POST', data),
  put: <T>(endpoint: string, data: unknown) => request<T>(endpoint, 'PUT', data),
  patch: <T>(endpoint: string, data: unknown) => request<T>(endpoint, 'PATCH', data),
  delete: <T>(endpoint: string) => request<T>(endpoint, 'DELETE'),
};

export default apiClient; 