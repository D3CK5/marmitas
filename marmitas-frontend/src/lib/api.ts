import axios from 'axios';

/**
 * Axios instance configured for API communication
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Simplified API client for type-safe requests
 * 
 * Notes:
 * 1. Token handling is done automatically via interceptors in AuthContext
 * 2. This uses the underlying axios instance which handles cookies for refresh tokens
 */
export const apiClient = {
  /**
   * GET request
   * @param endpoint API endpoint
   * @param params Query parameters
   * @returns Response data
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response = await api.get<{ success: boolean; data: T }>(endpoint, { params });
    return response.data.data;
  },
  
  /**
   * POST request
   * @param endpoint API endpoint
   * @param data Request body
   * @returns Response data
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await api.post<{ success: boolean; data: T }>(endpoint, data);
    return response.data.data;
  },
  
  /**
   * PUT request
   * @param endpoint API endpoint
   * @param data Request body
   * @returns Response data
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await api.put<{ success: boolean; data: T }>(endpoint, data);
    return response.data.data;
  },
  
  /**
   * PATCH request
   * @param endpoint API endpoint
   * @param data Request body
   * @returns Response data
   */
  async patch<T>(endpoint: string, data: any): Promise<T> {
    const response = await api.patch<{ success: boolean; data: T }>(endpoint, data);
    return response.data.data;
  },
  
  /**
   * DELETE request
   * @param endpoint API endpoint
   * @returns Response data
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await api.delete<{ success: boolean; data: T }>(endpoint);
    return response.data.data;
  }
};

export default apiClient; 