import { useRef, useEffect } from 'react';
import { startPerformanceEvent, endPerformanceEvent } from '../utils/monitoring';
import { useRenderTiming } from '../utils/performance';

export interface UsePerformanceMonitoringOptions {
  componentName: string;
  enableRenderTiming?: boolean;
  trackMountTime?: boolean;
  trackInteractions?: boolean;
  trackUpdates?: boolean;
  tags?: Record<string, string>;
}

/**
 * Hook para monitorar a performance de um componente
 * Rastreia tempo de montagem, atualizações e desmontagem
 * 
 * @param options Opções de configuração do monitoramento
 */
export function usePerformanceMonitoring({
  componentName,
  enableRenderTiming = true,
  trackMountTime = true,
  trackInteractions = false,
  trackUpdates = false,
  tags = {},
}: UsePerformanceMonitoringOptions): {
  trackInteraction: (name: string) => () => void;
} {
  const mountTimeRef = useRef<string | null>(null);
  const updateCountRef = useRef(0);
  
  // Habilitar medição de tempo de renderização se solicitado
  if (enableRenderTiming) {
    useRenderTiming(componentName, []);
  }
  
  // Rastrear montagem do componente
  useEffect(() => {
    if (trackMountTime) {
      mountTimeRef.current = startPerformanceEvent(
        `${componentName}_mount`,
        'component_lifecycle',
        { ...tags, component: componentName }
      );
    }
    
    return () => {
      // Rastrear desmontagem do componente
      if (mountTimeRef.current) {
        endPerformanceEvent(mountTimeRef.current, {
          updates: updateCountRef.current,
        });
        mountTimeRef.current = null;
      }
      
      // Registrar evento separado para desmontagem
      const unmountEventId = startPerformanceEvent(
        `${componentName}_unmount`,
        'component_lifecycle',
        { ...tags, component: componentName }
      );
      
      // Finalizar imediatamente o evento, apenas para registro
      endPerformanceEvent(unmountEventId);
    };
  }, [componentName, trackMountTime, tags]);
  
  // Rastrear atualizações do componente
  useEffect(() => {
    if (trackUpdates && updateCountRef.current > 0) {
      const updateEventId = startPerformanceEvent(
        `${componentName}_update`,
        'component_lifecycle',
        { ...tags, component: componentName, count: String(updateCountRef.current) }
      );
      
      endPerformanceEvent(updateEventId);
    }
    
    if (updateCountRef.current === 0) {
      updateCountRef.current += 1;
    }
  });
  
  // Função para rastrear interações do usuário com o componente
  const trackInteraction = (name: string) => {
    if (!trackInteractions) {
      return () => {}; // Função vazia se o rastreamento de interações estiver desabilitado
    }
    
    return () => {
      const interactionEventId = startPerformanceEvent(
        `${componentName}_${name}`,
        'component_interaction',
        { ...tags, component: componentName, interaction: name }
      );
      
      endPerformanceEvent(interactionEventId);
    };
  };
  
  return {
    trackInteraction,
  };
}

export default usePerformanceMonitoring; 