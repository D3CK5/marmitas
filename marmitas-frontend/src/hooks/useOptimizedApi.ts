import { useCallback } from 'react';
import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { optimizedApiClient } from '../state/api/optimizedClient';
import useError from './useError';

export type OptimizedApiResponse<T> = {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  fromCache?: boolean;
};

export type OptimizedApiError = {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
};

export interface UseOptimizedApiOptions {
  handleGlobalErrors?: boolean;
  cacheTime?: number;
  staleTime?: number;
}

export interface UseOptimizedApiReturn {
  get: <T>(
    url: string,
    config?: AxiosRequestConfig,
    queryOptions?: Omit<UseQueryOptions<OptimizedApiResponse<T>, OptimizedApiError>, 'queryKey' | 'queryFn'>
  ) => ReturnType<typeof useQuery<OptimizedApiResponse<T>, OptimizedApiError>>;
  
  post: <T, D = unknown>(
    url: string,
    mutationOptions?: Omit<UseMutationOptions<OptimizedApiResponse<T>, OptimizedApiError, D>, 'mutationFn'>
  ) => ReturnType<typeof useMutation<OptimizedApiResponse<T>, OptimizedApiError, D>> & {
    execute: (data: D, config?: AxiosRequestConfig) => Promise<OptimizedApiResponse<T>>;
  };
  
  put: <T, D = unknown>(
    url: string,
    mutationOptions?: Omit<UseMutationOptions<OptimizedApiResponse<T>, OptimizedApiError, D>, 'mutationFn'>
  ) => ReturnType<typeof useMutation<OptimizedApiResponse<T>, OptimizedApiError, D>> & {
    execute: (data: D, config?: AxiosRequestConfig) => Promise<OptimizedApiResponse<T>>;
  };
  
  patch: <T, D = unknown>(
    url: string,
    mutationOptions?: Omit<UseMutationOptions<OptimizedApiResponse<T>, OptimizedApiError, D>, 'mutationFn'>
  ) => ReturnType<typeof useMutation<OptimizedApiResponse<T>, OptimizedApiError, D>> & {
    execute: (data: D, config?: AxiosRequestConfig) => Promise<OptimizedApiResponse<T>>;
  };
  
  delete: <T>(
    url: string,
    mutationOptions?: Omit<UseMutationOptions<OptimizedApiResponse<T>, OptimizedApiError, void>, 'mutationFn'>
  ) => ReturnType<typeof useMutation<OptimizedApiResponse<T>, OptimizedApiError, void>> & {
    execute: (config?: AxiosRequestConfig) => Promise<OptimizedApiResponse<T>>;
  };
  
  clearCache: (url?: string) => void;
}

/**
 * Hook para usar o cliente API otimizado com melhor performance
 * Integra o cliente otimizado com React Query para gerenciamento de estado
 */
export function useOptimizedApi({
  handleGlobalErrors = true,
  cacheTime = 5 * 60 * 1000, // 5 minutos
  staleTime = 30 * 1000, // 30 segundos
}: UseOptimizedApiOptions = {}): UseOptimizedApiReturn {
  const { handleError } = useError();

  const processResponse = <T>(response: AxiosResponse<T>): OptimizedApiResponse<T> => {
    const fromCache = response.statusText.includes('from cache');
    
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
      fromCache,
    };
  };

  const processError = (error: unknown): OptimizedApiError => {
    let apiError: OptimizedApiError;
    
    if (error instanceof Error) {
      apiError = {
        message: error.message || 'Erro na requisição',
      };
    } else if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, any>;
      apiError = {
        message: errorObj.message || 'Erro desconhecido',
        status: errorObj.status,
        code: errorObj.code,
        details: error,
      };
    } else {
      apiError = {
        message: String(error) || 'Erro desconhecido'
      };
    }
    
    if (handleGlobalErrors) {
      handleError(apiError);
    }
    
    return apiError;
  };

  /**
   * Hook para requisições GET com cache e otimizações
   */
  const get = <T>(
    url: string,
    config?: AxiosRequestConfig,
    queryOptions?: Omit<UseQueryOptions<OptimizedApiResponse<T>, OptimizedApiError>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery<OptimizedApiResponse<T>, OptimizedApiError>({
      queryKey: [url, config],
      queryFn: async () => {
        try {
          const response = await optimizedApiClient.get<T>(url, config);
          return processResponse(response);
        } catch (error) {
          throw processError(error);
        }
      },
      // Otimizações de cache do React Query
      cacheTime,
      staleTime,
      // Opções adicionais
      ...queryOptions,
    });
  };

  /**
   * Criador de hooks para mutações (POST, PUT, PATCH, DELETE)
   */
  const createMutation = <T, D = unknown>(
    method: 'post' | 'put' | 'patch' | 'delete',
    url: string,
    mutationOptions?: Omit<UseMutationOptions<OptimizedApiResponse<T>, OptimizedApiError, D>, 'mutationFn'>
  ) => {
    const mutation = useMutation<OptimizedApiResponse<T>, OptimizedApiError, D>({
      mutationFn: async (data?: D) => {
        try {
          let response;
          
          switch (method) {
            case 'post':
              response = await optimizedApiClient.post<T>(url, data);
              break;
            case 'put':
              response = await optimizedApiClient.put<T>(url, data);
              break;
            case 'patch':
              response = await optimizedApiClient.patch<T>(url, data);
              break;
            case 'delete':
              response = await optimizedApiClient.delete<T>(url);
              break;
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
        
        switch (method) {
          case 'post':
            response = await optimizedApiClient.post<T>(url, data, requestConfig);
            break;
          case 'put':
            response = await optimizedApiClient.put<T>(url, data, requestConfig);
            break;
          case 'patch':
            response = await optimizedApiClient.patch<T>(url, data, requestConfig);
            break;
          case 'delete':
            response = await optimizedApiClient.delete<T>(url, requestConfig);
            break;
        }
        
        return processResponse(response);
      } catch (error) {
        throw processError(error);
      }
    };

    return {
      ...mutation,
      execute: execute as any, // Cast para lidar com as diferentes assinaturas de método
    };
  };

  const clearCache = useCallback((url?: string) => {
    optimizedApiClient.clearCache(url);
  }, []);

  const post = useCallback(
    <T, D = unknown>(
      url: string,
      mutationOptions?: Omit<UseMutationOptions<OptimizedApiResponse<T>, OptimizedApiError, D>, 'mutationFn'>
    ) => createMutation<T, D>('post', url, mutationOptions),
    []
  );

  const put = useCallback(
    <T, D = unknown>(
      url: string,
      mutationOptions?: Omit<UseMutationOptions<OptimizedApiResponse<T>, OptimizedApiError, D>, 'mutationFn'>
    ) => createMutation<T, D>('put', url, mutationOptions),
    []
  );

  const patch = useCallback(
    <T, D = unknown>(
      url: string,
      mutationOptions?: Omit<UseMutationOptions<OptimizedApiResponse<T>, OptimizedApiError, D>, 'mutationFn'>
    ) => createMutation<T, D>('patch', url, mutationOptions),
    []
  );

  const deleteRequest = useCallback(
    <T>(
      url: string,
      mutationOptions?: Omit<UseMutationOptions<OptimizedApiResponse<T>, OptimizedApiError, void>, 'mutationFn'>
    ) => createMutation<T, void>('delete', url, mutationOptions),
    []
  );

  return {
    get,
    post,
    put,
    patch,
    delete: deleteRequest,
    clearCache,
  };
}

export default useOptimizedApi; 