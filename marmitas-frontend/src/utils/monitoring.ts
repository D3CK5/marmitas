import { nanoid } from 'nanoid';

/**
 * Sistema de monitoramento de performance para a aplicação
 * Permite rastrear métricas, eventos e tempos de resposta
 */

// Definição de tipos
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  tags?: Record<string, string>;
  timestamp: number;
}

export interface PerformanceEvent {
  id: string;
  name: string;
  category?: string;
  duration?: number;
  startTime?: number;
  endTime?: number;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

// Configuração do monitor
interface MonitoringConfig {
  enabled: boolean;
  sampleRate: number; // 0 a 1, percentual de amostragem
  flushInterval: number; // Intervalo em ms para enviar dados
  endpoint?: string; // Endpoint para enviar dados
  bufferSize: number; // Tamanho máximo do buffer antes de enviar
  includeResourceTiming: boolean; // Incluir resource timing
  analyticsId?: string; // ID para integração com analytics
}

class PerformanceMonitor {
  private config: MonitoringConfig;
  private metrics: Metric[] = [];
  private events: PerformanceEvent[] = [];
  private activeEvents: Map<string, PerformanceEvent> = new Map();
  private flushIntervalId: number | null = null;
  private isInitialized = false;

  constructor() {
    // Configuração padrão
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      sampleRate: 0.1, // 10% das sessões por padrão
      flushInterval: 30000, // 30 segundos
      bufferSize: 50,
      includeResourceTiming: true,
    };
  }

  /**
   * Inicializa o monitor de performance
   */
  public init(config: Partial<MonitoringConfig> = {}): void {
    if (this.isInitialized) return;

    // Merge da configuração personalizada
    this.config = { ...this.config, ...config };
    
    // Verificar se o monitor deve estar ativo com base na taxa de amostragem
    const shouldSample = Math.random() <= this.config.sampleRate;
    
    if (!shouldSample) {
      this.config.enabled = false;
      return;
    }
    
    if (this.config.enabled && typeof window !== 'undefined') {
      // Iniciar monitoramento de Web Vitals
      this.setupWebVitalsMonitoring();
      
      // Iniciar monitoramento de recursos
      if (this.config.includeResourceTiming) {
        this.setupResourceTimingMonitoring();
      }
      
      // Configurar intervalo para envio de dados
      this.flushIntervalId = window.setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
      
      // Garantir que dados sejam enviados quando o usuário sair da página
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
      
      this.isInitialized = true;
    }
  }

  /**
   * Finaliza o monitor de performance
   */
  public shutdown(): void {
    if (!this.isInitialized) return;
    
    // Limpar intervalo
    if (this.flushIntervalId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.flushIntervalId);
      this.flushIntervalId = null;
    }
    
    // Enviar dados restantes
    this.flush();
    
    this.isInitialized = false;
  }

  /**
   * Configura monitoramento de Web Vitals
   */
  private setupWebVitalsMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
    
    // LCP (Largest Contentful Paint)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric('web_vitals_lcp', 'gauge', lastEntry.startTime);
      });
      
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.error('Failed to observe LCP:', e);
    }
    
    // FID (First Input Delay)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const delay = entry.processingStart - entry.startTime;
          this.recordMetric('web_vitals_fid', 'gauge', delay);
        });
      });
      
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.error('Failed to observe FID:', e);
    }
    
    // CLS (Cumulative Layout Shift)
    try {
      let clsValue = 0;
      
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.recordMetric('web_vitals_cls', 'gauge', clsValue);
          }
        });
      });
      
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.error('Failed to observe CLS:', e);
    }
  }

  /**
   * Configura monitoramento de carregamento de recursos
   */
  private setupResourceTimingMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
    
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const resourceTiming = entry as PerformanceResourceTiming;
          
          // Registrar apenas recursos relevantes (ignorar beacons, analytics, etc)
          const url = resourceTiming.name;
          if (
            url.includes('beacon') || 
            url.includes('analytics') || 
            url.includes('monitoring')
          ) {
            return;
          }
          
          // Extrair tipo de recurso (js, css, img, etc)
          const resourceType = this.getResourceType(resourceTiming.initiatorType, url);
          
          this.recordEvent({
            name: 'resource_timing',
            category: 'performance',
            duration: resourceTiming.duration,
            startTime: resourceTiming.startTime,
            endTime: resourceTiming.startTime + resourceTiming.duration,
            tags: {
              type: resourceType,
              url: this.sanitizeUrl(url),
            },
            metadata: {
              transferSize: resourceTiming.transferSize,
              encodedBodySize: resourceTiming.encodedBodySize,
              decodedBodySize: resourceTiming.decodedBodySize,
            },
          });
        });
      });
      
      resourceObserver.observe({ type: 'resource', buffered: true });
    } catch (e) {
      console.error('Failed to observe Resource Timing:', e);
    }
  }

  /**
   * Obtém o tipo de recurso com base no iniciador e URL
   */
  private getResourceType(initiatorType: string, url: string): string {
    if (initiatorType !== 'other') {
      return initiatorType;
    }
    
    // Tentar detectar o tipo pelo URL
    if (url.match(/\.(js)(\?.*)?$/i)) return 'script';
    if (url.match(/\.(css)(\?.*)?$/i)) return 'style';
    if (url.match(/\.(jpe?g|png|gif|webp|avif|svg)(\?.*)?$/i)) return 'image';
    if (url.match(/\.(woff2?|ttf|otf|eot)(\?.*)?$/i)) return 'font';
    if (url.match(/\.(json)(\?.*)?$/i)) return 'json';
    
    return 'other';
  }

  /**
   * Limpa URLs para evitar enviar dados sensíveis
   */
  private sanitizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      // Remover parâmetros sensíveis
      parsedUrl.search = '';
      return parsedUrl.toString();
    } catch {
      return url.split('?')[0];
    }
  }

  /**
   * Registra uma métrica
   */
  public recordMetric(
    name: string,
    type: MetricType = 'counter',
    value: number,
    tags?: Record<string, string>
  ): void {
    if (!this.config.enabled) return;
    
    this.metrics.push({
      name,
      type,
      value,
      tags,
      timestamp: Date.now(),
    });
    
    // Verificar se é necessário enviar os dados
    if (this.metrics.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  /**
   * Incrementa uma métrica contador
   */
  public incrementCounter(name: string, value = 1, tags?: Record<string, string>): void {
    this.recordMetric(name, 'counter', value, tags);
  }

  /**
   * Registra um valor gauge (valor instantâneo)
   */
  public recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(name, 'gauge', value, tags);
  }

  /**
   * Registra um valor de histograma
   */
  public recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(name, 'histogram', value, tags);
  }

  /**
   * Inicia um evento de performance
   */
  public startEvent(name: string, category?: string, tags?: Record<string, string>): string {
    if (!this.config.enabled) return '';
    
    const eventId = nanoid();
    const event: PerformanceEvent = {
      id: eventId,
      name,
      category,
      startTime: performance.now(),
      tags,
    };
    
    this.activeEvents.set(eventId, event);
    return eventId;
  }

  /**
   * Finaliza um evento de performance iniciado anteriormente
   */
  public endEvent(eventId: string, metadata?: Record<string, any>): void {
    if (!this.config.enabled || !eventId) return;
    
    const event = this.activeEvents.get(eventId);
    if (!event) return;
    
    const endTime = performance.now();
    event.endTime = endTime;
    event.duration = event.startTime ? endTime - event.startTime : undefined;
    event.metadata = { ...event.metadata, ...metadata };
    
    this.activeEvents.delete(eventId);
    this.events.push(event);
    
    // Verificar se é necessário enviar os dados
    if (this.events.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  /**
   * Registra um evento completo de uma vez
   */
  public recordEvent(event: Omit<PerformanceEvent, 'id' | 'timestamp'>): string {
    if (!this.config.enabled) return '';
    
    const eventId = nanoid();
    const fullEvent: PerformanceEvent = {
      id: eventId,
      ...event,
    };
    
    this.events.push(fullEvent);
    
    // Verificar se é necessário enviar os dados
    if (this.events.length >= this.config.bufferSize) {
      this.flush();
    }
    
    return eventId;
  }

  /**
   * Envia os dados coletados para o servidor
   */
  public flush(): void {
    if (!this.config.enabled || (!this.metrics.length && !this.events.length)) return;
    
    const payload = {
      metrics: [...this.metrics],
      events: [...this.events],
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
    
    // Limpar buffers
    this.metrics = [];
    this.events = [];
    
    // Enviar os dados para o servidor
    if (this.config.endpoint) {
      try {
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          // Usar Beacon API para envio assíncrono, não bloqueante
          navigator.sendBeacon(
            this.config.endpoint,
            JSON.stringify(payload)
          );
        } else {
          // Fallback para fetch
          fetch(this.config.endpoint, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
              'Content-Type': 'application/json',
            },
            // Usar keepalive para garantir que a requisição termine mesmo se a página for fechada
            keepalive: true,
          }).catch(e => {
            console.error('Failed to send monitoring data:', e);
          });
        }
      } catch (e) {
        console.error('Failed to send monitoring data:', e);
      }
    } else if (process.env.NODE_ENV === 'development') {
      // Em desenvolvimento, apenas logar
      console.log('[Performance Monitoring] Data:', payload);
    }
  }
}

// Exportar instância singleton
export const performanceMonitor = new PerformanceMonitor();

// Funções auxiliares para uso fácil
export const startPerformanceEvent = (name: string, category?: string, tags?: Record<string, string>): string => {
  return performanceMonitor.startEvent(name, category, tags);
};

export const endPerformanceEvent = (eventId: string, metadata?: Record<string, any>): void => {
  performanceMonitor.endEvent(eventId, metadata);
};

export const incrementCounter = (name: string, value = 1, tags?: Record<string, string>): void => {
  performanceMonitor.incrementCounter(name, value, tags);
};

export const measurePerformance = <T>(name: string, fn: () => T): T => {
  const eventId = startPerformanceEvent(name);
  try {
    return fn();
  } finally {
    endPerformanceEvent(eventId);
  }
};

export const measurePromisePerformance = async <T>(
  name: string, 
  promise: Promise<T>,
  category = 'async'
): Promise<T> => {
  const eventId = startPerformanceEvent(name, category);
  try {
    return await promise;
  } finally {
    endPerformanceEvent(eventId);
  }
};

export default performanceMonitor; 