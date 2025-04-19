import { useEffect, useRef, useState } from 'react';

/**
 * Utilitários para otimização de performance no frontend
 */

/**
 * Mede o tempo de carregamento de um componente
 * @param componentName Nome do componente a ser medido
 */
export function measureComponentRender(componentName: string): void {
  if (process.env.NODE_ENV === 'development') {
    const startTime = performance.now();
    
    // Usar setTimeout para executar após o render
    setTimeout(() => {
      const endTime = performance.now();
      console.log(`[Performance] ${componentName} renderizado em ${(endTime - startTime).toFixed(2)}ms`);
    }, 0);
  }
}

/**
 * Hook para medir o tempo de renderização de um componente
 * @param componentName Nome do componente
 * @param dependencies Array de dependências que causam nova renderização
 */
export function useRenderTiming(componentName: string, dependencies: any[] = []): void {
  const renderCount = useRef(0);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      
      renderCount.current += 1;
      
      setTimeout(() => {
        const endTime = performance.now();
        console.log(
          `[Performance] ${componentName} renderização #${renderCount.current} em ${(endTime - startTime).toFixed(2)}ms`
        );
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

/**
 * Registra métricas de Web Vitals
 */
export function reportWebVitals(): void {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Registrar LCP (Largest Contentful Paint)
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('[Web Vitals] LCP:', lastEntry.startTime);
      
      // Enviar para analytics
      // analyticsSendEvent('web_vitals', { name: 'LCP', value: lastEntry.startTime });
    });
    
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    
    // Registrar FID (First Input Delay)
    const fidObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const delay = entry.processingStart - entry.startTime;
        console.log('[Web Vitals] FID:', delay);
        
        // Enviar para analytics
        // analyticsSendEvent('web_vitals', { name: 'FID', value: delay });
      });
    });
    
    fidObserver.observe({ type: 'first-input', buffered: true });
    
    // Registrar CLS (Cumulative Layout Shift)
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      
      list.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      console.log('[Web Vitals] CLS:', clsValue);
      
      // Enviar para analytics
      // analyticsSendEvent('web_vitals', { name: 'CLS', value: clsValue });
    });
    
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  }
}

/**
 * Hook para lidar com carregamento de imagem otimizada
 * @param src URL da imagem
 * @param options Opções de carregamento
 */
export function useImagePreload(src: string, options: { priority?: boolean } = {}): { isLoaded: boolean; error: Error | null } {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!src) return;
    
    const img = new Image();
    
    if (options.priority) {
      img.fetchPriority = 'high';
    }
    
    img.onload = () => {
      setIsLoaded(true);
    };
    
    img.onerror = (e) => {
      setError(e instanceof Error ? e : new Error('Failed to load image'));
    };
    
    img.src = src;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, options.priority]);
  
  return { isLoaded, error };
}

/**
 * Função para agrupar leituras/escritas do DOM para evitar layout thrashing
 * @param readFn Função que lê valores do DOM
 * @param writeFn Função que escreve no DOM
 */
export function frameOptimizer<T>(
  readFn: () => T,
  writeFn: (data: T) => void
): void {
  requestAnimationFrame(() => {
    const data = readFn();
    
    requestAnimationFrame(() => {
      writeFn(data);
    });
  });
}

/**
 * Hook para medição de performance customizada com métricas definidas pelo usuário
 */
export function usePerformanceMetrics(metricName: string) {
  return {
    start: () => {
      if (process.env.NODE_ENV === 'development') {
        performance.mark(`${metricName}-start`);
      }
    },
    
    end: () => {
      if (process.env.NODE_ENV === 'development') {
        performance.mark(`${metricName}-end`);
        performance.measure(metricName, `${metricName}-start`, `${metricName}-end`);
        
        const entries = performance.getEntriesByName(metricName, 'measure');
        const lastEntry = entries[entries.length - 1];
        
        console.log(`[Performance] ${metricName}: ${lastEntry.duration.toFixed(2)}ms`);
        
        // Limpar marcas e medidas
        performance.clearMarks(`${metricName}-start`);
        performance.clearMarks(`${metricName}-end`);
        performance.clearMeasures(metricName);
      }
    }
  };
} 