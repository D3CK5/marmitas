import { useCallback } from 'react';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from '@tanstack/react-query';
import useError from './useError';
import { apiClient } from '../state/api';

export type ApiResponse<T> = {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
};

export type ApiError = {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
};

export interface UseApiOptions {
  handleGlobalErrors?: boolean;
}

export interface UseApiReturn {
  get: <T>(
    url: string,
    config?: AxiosRequestConfig,
    queryOptions?: Omit<UseQueryOptions<ApiResponse<T>, ApiError>, 'queryKey' | 'queryFn'>
  ) => ReturnType<typeof useQuery<ApiResponse<T>, ApiError>>;
  
  post: <T, D = unknown>(
    url: string,
    mutationOptions?: Omit<UseMutationOptions<ApiResponse<T>, ApiError, D>, 'mutationFn'>
  ) => ReturnType<typeof useMutation<ApiResponse<T>, ApiError, D>> & {
    execute: (data: D, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  };
  
  put: <T, D = unknown>(
    url: string,
    mutationOptions?: Omit<UseMutationOptions<ApiResponse<T>, ApiError, D>, 'mutationFn'>
  ) => ReturnType<typeof useMutation<ApiResponse<T>, ApiError, D>> & {
    execute: (data: D, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  };
  
  patch: <T, D = unknown>(
    url: string,
    mutationOptions?: Omit<UseMutationOptions<ApiResponse<T>, ApiError, D>, 'mutationFn'>
  ) => ReturnType<typeof useMutation<ApiResponse<T>, ApiError, D>> & {
    execute: (data: D, config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  };
  
  delete: <T>(
    url: string,
    mutationOptions?: Omit<UseMutationOptions<ApiResponse<T>, ApiError, void>, 'mutationFn'>
  ) => ReturnType<typeof useMutation<ApiResponse<T>, ApiError, void>> & {
    execute: (config?: AxiosRequestConfig) => Promise<ApiResponse<T>>;
  };
}

/**
 * Hook para gerenciar requisições HTTP com Axios e React Query
 * Fornece métodos para realizar operações HTTP com gerenciamento de estado e cache
 */
export function useApi({ handleGlobalErrors = true }: UseApiOptions = {}): UseApiReturn {
  const { handleError } = useError();

  const processResponse = <T>(response: AxiosResponse<T>): ApiResponse<T> => ({
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers as Record<string, string>,
  });

  const processError = (error: unknown): ApiError => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data as Record<string, unknown>;
      
      const apiError: ApiError = {
        message: errorData?.message as string || axiosError.message || 'Erro na requisição',
        status: axiosError.response?.status,
        code: errorData?.code as string,
        details: errorData,
      };
      
      if (handleGlobalErrors) {
        handleError(apiError);
      }
      
      return apiError;
    }
    
    const defaultError: ApiError = {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    };
    
    if (handleGlobalErrors) {
      handleError(defaultError);
    }
    
    return defaultError;
  };

  const get = <T>(
    url: string,
    config?: AxiosRequestConfig,
    queryOptions?: Omit<UseQueryOptions<ApiResponse<T>, ApiError>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery<ApiResponse<T>, ApiError>({
      queryKey: [url, config],
      queryFn: async () => {
        try {
          const response = await apiClient.get<T>(url, config);
          return processResponse(response);
        } catch (error) {
          throw processError(error);
        }
      },
      ...queryOptions,
    });
  };

  const createMutation = <T, D = unknown>(
    method: 'post' | 'put' | 'patch' | 'delete',
    url: string,
    mutationOptions?: Omit<UseMutationOptions<ApiResponse<T>, ApiError, D>, 'mutationFn'>
  ) => {
    const mutation = useMutation<ApiResponse<T>, ApiError, D>({
      mutationFn: async (data?: D) => {
        try {
          let response;
          if (method === 'delete') {
            response = await apiClient.delete<T>(url);
          } else {
            response = await apiClient[method]<T>(url, data);
          }
          return processResponse(response);
        } catch (error) {
          throw processError(error);
        }
      },
      ...mutationOptions,
    });

    const execute = async (dataOrConfig?: D | AxiosRequestConfig, config?: AxiosRequestConfig) => {
      let data: D | undefined;
      let requestConfig: AxiosRequestConfig | undefined;

      if (method === 'delete') {
        requestConfig = dataOrConfig as AxiosRequestConfig;
        data = undefined;
      } else {
        data = dataOrConfig as D;
        requestConfig = config;
      }

      try {
        let response;
        if (method === 'delete') {
          response = await apiClient.delete<T>(url, requestConfig);
        } else {
          response = await apiClient[method]<T>(url, data, requestConfig);
        }
        return processResponse(response);
      } catch (error) {
        throw processError(error);
      }
    };

    return {
      ...mutation,
      execute: execute as any, // Cast to handle the different method signatures
    };
  };

  const post = useCallback(
    <T, D = unknown>(
      url: string,
      mutationOptions?: Omit<UseMutationOptions<ApiResponse<T>, ApiError, D>, 'mutationFn'>
    ) => createMutation<T, D>('post', url, mutationOptions),
    []
  );

  const put = useCallback(
    <T, D = unknown>(
      url: string,
      mutationOptions?: Omit<UseMutationOptions<ApiResponse<T>, ApiError, D>, 'mutationFn'>
    ) => createMutation<T, D>('put', url, mutationOptions),
    []
  );

  const patch = useCallback(
    <T, D = unknown>(
      url: string,
      mutationOptions?: Omit<UseMutationOptions<ApiResponse<T>, ApiError, D>, 'mutationFn'>
    ) => createMutation<T, D>('patch', url, mutationOptions),
    []
  );

  const deleteRequest = useCallback(
    <T>(
      url: string,
      mutationOptions?: Omit<UseMutationOptions<ApiResponse<T>, ApiError, void>, 'mutationFn'>
    ) => createMutation<T, void>('delete', url, mutationOptions),
    []
  );

  return {
    get,
    post,
    put,
    patch,
    delete: deleteRequest,
  };
}

export default useApi; 