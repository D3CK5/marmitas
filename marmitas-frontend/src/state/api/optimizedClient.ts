import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';
import { apiClient } from './index';

// Cache em memória para respostas de API
interface CacheRecord {
  data: any;
  timestamp: number;
  expiresAt: number;
}

// Mapa de requisições em andamento
interface PendingRequest {
  source: CancelTokenSource;
  timestamp: number;
}

// Configurações de otimização
export interface ApiOptimizationOptions {
  enableCache?: boolean;
  cacheTTL?: number; // Tempo de vida do cache em milisegundos
  deduplicateRequests?: boolean; // Deduplica requisições idênticas
  retryCount?: number; // Número de tentativas em caso de falha
  retryDelay?: number; // Tempo entre tentativas em milisegundos
  timeout?: number; // Tempo limite para requisições em milisegundos
  enableCompression?: boolean; // Ativa compressão de dados
}

/**
 * Cliente HTTP otimizado para melhor performance
 * Implementa caching, deduplicação de requisições, retry automático e mais
 */
export class OptimizedApiClient {
  private client: AxiosInstance;
  private cache: Map<string, CacheRecord> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private options: ApiOptimizationOptions;
  
  constructor(options: ApiOptimizationOptions = {}) {
    this.options = {
      enableCache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutos por padrão
      deduplicateRequests: true,
      retryCount: 2,
      retryDelay: 1000,
      timeout: 30000,
      enableCompression: true,
      ...options
    };
    
    this.client = apiClient;
    
    // Configurar interceptors
    this.setupInterceptors();
  }
  
  /**
   * Configura interceptors para otimizações
   */
  private setupInterceptors(): void {
    // Interceptor de requisição
    this.client.interceptors.request.use((config) => {
      // Adicionar headers de compressão se necessário
      if (this.options.enableCompression) {
        config.headers = config.headers || {};
        config.headers['Accept-Encoding'] = 'gzip, deflate, br';
      }
      
      // Configurar timeout
      if (this.options.timeout) {
        config.timeout = this.options.timeout;
      }
      
      return config;
    });
    
    // Interceptor de resposta
    this.client.interceptors.response.use(
      (response) => {
        // Armazenar em cache se necessário
        if (this.options.enableCache && this.isCacheable(response.config)) {
          this.setCacheEntry(this.getCacheKey(response.config), response.data);
        }
        
        // Remover da lista de requisições pendentes
        const requestKey = this.getRequestKey(response.config);
        this.pendingRequests.delete(requestKey);
        
        return response;
      },
      async (error) => {
        // Se a requisição foi cancelada, não fazer nada
        if (axios.isCancel(error)) {
          return Promise.reject(error);
        }
        
        const config = error.config;
        
        // Remover da lista de requisições pendentes
        if (config) {
          const requestKey = this.getRequestKey(config);
          this.pendingRequests.delete(requestKey);
          
          // Implementar retry automático
          if (this.options.retryCount && config.__retryCount < this.options.retryCount && this.isRetryable(error)) {
            config.__retryCount = config.__retryCount || 0;
            config.__retryCount += 1;
            
            // Aguardar antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
            
            // Tentar novamente
            return this.client(config);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Verifica se uma requisição pode ser armazenada em cache
   */
  private isCacheable(config: AxiosRequestConfig): boolean {
    return config.method?.toLowerCase() === 'get' && config.cache !== false;
  }
  
  /**
   * Verifica se um erro pode ser reprocessado
   */
  private isRetryable(error: any): boolean {
    // Retentar em caso de erros de rede ou servidor (5xx)
    return (
      !error.response || 
      (error.response.status >= 500 && error.response.status < 600)
    );
  }
  
  /**
   * Gera uma chave única para cache baseada na configuração
   */
  private getCacheKey(config: AxiosRequestConfig): string {
    const { url, method, params, data } = config;
    return `${method}:${url}:${JSON.stringify(params || {})}:${JSON.stringify(data || {})}`;
  }
  
  /**
   * Gera uma chave única para identificar requisições pendentes
   */
  private getRequestKey(config: AxiosRequestConfig): string {
    return this.getCacheKey(config);
  }
  
  /**
   * Adiciona ou atualiza uma entrada no cache
   */
  private setCacheEntry(key: string, data: any): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + (this.options.cacheTTL || 0),
    });
    
    // Limpar entradas antigas periodicamente
    if (this.cache.size % 10 === 0) {
      this.cleanCache();
    }
  }
  
  /**
   * Remove entradas expiradas do cache
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Limpa o cache completamente ou para uma URL específica
   */
  public clearCache(url?: string): void {
    if (url) {
      // Limpar apenas entradas para a URL específica
      for (const [key] of this.cache.entries()) {
        if (key.includes(url)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Limpar todo o cache
      this.cache.clear();
    }
  }
  
  /**
   * Realiza uma requisição GET otimizada
   */
  public async get<T = any>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    const finalConfig = { ...config, method: 'get', url };
    
    // Verificar cache se habilitado
    if (this.options.enableCache && this.isCacheable(finalConfig)) {
      const cacheKey = this.getCacheKey(finalConfig);
      const cached = this.cache.get(cacheKey);
      
      if (cached && cached.expiresAt > Date.now()) {
        // Retornar dados do cache
        return Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK (from cache)',
          headers: {},
          config: finalConfig,
        } as AxiosResponse<T>);
      }
    }
    
    // Verificar requisições pendentes idênticas
    if (this.options.deduplicateRequests) {
      const requestKey = this.getRequestKey(finalConfig);
      const pendingRequest = this.pendingRequests.get(requestKey);
      
      if (pendingRequest) {
        // Cancelar a requisição pendente se estiver demorando muito
        const now = Date.now();
        if (now - pendingRequest.timestamp > 10000) {
          pendingRequest.source.cancel('Request timeout');
          this.pendingRequests.delete(requestKey);
        } else {
          // Cancelar esta nova requisição já que existe uma idêntica em andamento
          throw new Error('Requisição duplicada em andamento');
        }
      }
      
      // Registrar esta nova requisição
      const source = axios.CancelToken.source();
      this.pendingRequests.set(requestKey, {
        source,
        timestamp: Date.now(),
      });
      
      finalConfig.cancelToken = source.token;
    }
    
    // Inicializar contador de retentativas
    finalConfig.__retryCount = 0;
    
    // Realizar a requisição
    return this.client(finalConfig);
  }
  
  /**
   * Realiza uma requisição POST otimizada
   */
  public async post<T = any>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    const finalConfig = { ...config, method: 'post', url, data };
    finalConfig.__retryCount = 0;
    
    // Opcional: implementar batching de requisições POST aqui
    
    return this.client(finalConfig);
  }
  
  /**
   * Realiza uma requisição PUT otimizada
   */
  public async put<T = any>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    const finalConfig = { ...config, method: 'put', url, data };
    finalConfig.__retryCount = 0;
    
    return this.client(finalConfig);
  }
  
  /**
   * Realiza uma requisição PATCH otimizada
   */
  public async patch<T = any>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    const finalConfig = { ...config, method: 'patch', url, data };
    finalConfig.__retryCount = 0;
    
    return this.client(finalConfig);
  }
  
  /**
   * Realiza uma requisição DELETE otimizada
   */
  public async delete<T = any>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    const finalConfig = { ...config, method: 'delete', url };
    finalConfig.__retryCount = 0;
    
    // Invalidar cache para este recurso após deletar
    if (this.options.enableCache) {
      this.clearCache(url);
    }
    
    return this.client(finalConfig);
  }
  
  /**
   * Realiza múltiplas requisições em paralelo
   */
  public async all<T>(requests: Promise<T>[]): Promise<T[]> {
    return Promise.all(requests);
  }
}

// Exportar instância padrão
export const optimizedApiClient = new OptimizedApiClient();

export default optimizedApiClient; 