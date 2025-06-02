import { useEffect, ReactNode } from 'react';

interface HotjarProviderProps {
  children: ReactNode;
  hotjarId: string;
}

declare global {
  interface Window {
    hj: (...args: any[]) => void;
    _hjSettings: {
      hjid: number;
      hjsv: number;
    };
  }
}

export function HotjarProvider({ children, hotjarId }: HotjarProviderProps) {
  useEffect(() => {
    if (!hotjarId || typeof window === 'undefined') return;

    // Verificar se já foi carregado
    if (window.hj) return;

    // Configurar Hotjar
    (function(h: any, o: any, t: any, j: any, a?: any, r?: any) {
      h.hj = h.hj || function(...args: any[]) {
        (h.hj.q = h.hj.q || []).push(args);
      };
      h._hjSettings = { hjid: parseInt(hotjarId), hjsv: 6 };
      a = o.getElementsByTagName('head')[0];
      r = o.createElement('script');
      r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');

    console.log('🔥 Hotjar carregado com ID:', hotjarId);
  }, [hotjarId]);

  return <>{children}</>;
}

// Hook para usar funcionalidades do Hotjar
export function useHotjar() {
  const identify = (userId: string, attributes?: Record<string, any>) => {
    if (window.hj) {
      window.hj('identify', userId, attributes);
      console.log('👤 Hotjar identificou usuário:', userId, attributes);
    }
  };

  const trackEvent = (eventName: string) => {
    if (window.hj) {
      window.hj('event', eventName);
      console.log('📊 Hotjar evento:', eventName);
    }
  };

  const triggerPoll = (pollId: string) => {
    if (window.hj) {
      window.hj('trigger', pollId);
      console.log('📋 Hotjar poll:', pollId);
    }
  };

  const startRecording = () => {
    if (window.hj) {
      window.hj('stateChange', '/recording-start');
      console.log('🎥 Hotjar gravação iniciada');
    }
  };

  const stopRecording = () => {
    if (window.hj) {
      window.hj('stateChange', '/recording-stop');
      console.log('⏹️ Hotjar gravação parada');
    }
  };

  return {
    identify,
    trackEvent,
    triggerPoll,
    startRecording,
    stopRecording
  };
} 