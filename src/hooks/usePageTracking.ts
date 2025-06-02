import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Interface para tracking de páginas
export interface PageView {
  id: string;
  page_path: string;
  page_title: string;
  user_id?: string;
  session_id: string;
  referrer?: string;
  user_agent: string;
  ip_address?: string;
  created_at: string;
}

interface PageViewEvent {
  page_path: string;
  page_title: string;
  user_id?: string;
  session_id: string;
  referrer?: string;
  timestamp: string;
  user_agent?: string;
  viewport_width?: number;
  viewport_height?: number;
}

interface CustomEvent {
  event_name: string;
  event_data?: Record<string, any>;
  page_path: string;
  user_id?: string;
  session_id: string;
  timestamp: string;
}

export function usePageTracking() {
  const location = useLocation();
  const { user } = useAuth();
  const startTimeRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>(generateSessionId());

  // Gerar ID de sessão único
  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Função para enviar eventos de visualização de página
  const trackPageView = async (path: string, title: string) => {
    try {
      const pageViewData: PageViewEvent = {
        page_path: path,
        page_title: title,
        user_id: user?.id,
        session_id: sessionIdRef.current,
        referrer: document.referrer || undefined,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight
      };

      // Salvar no localStorage para analytics offline
      const offlineEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      offlineEvents.push({ type: 'page_view', data: pageViewData });
      localStorage.setItem('analytics_events', JSON.stringify(offlineEvents.slice(-50))); // Manter apenas últimos 50

      // Tentar enviar para o banco
      const { error } = await supabase
        .from('page_views')
        .insert(pageViewData);

      if (error) {
        console.warn('Erro ao salvar page view:', error);
      }
    } catch (error) {
      console.warn('Erro no tracking de página:', error);
    }
  };

  // Função para tracking de eventos personalizados
  const trackCustomEvent = async (eventName: string, eventData?: Record<string, any>) => {
    try {
      const customEventData: CustomEvent = {
        event_name: eventName,
        event_data: eventData,
        page_path: location.pathname,
        user_id: user?.id,
        session_id: sessionIdRef.current,
        timestamp: new Date().toISOString()
      };

      // Salvar no localStorage
      const offlineEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      offlineEvents.push({ type: 'custom_event', data: customEventData });
      localStorage.setItem('analytics_events', JSON.stringify(offlineEvents.slice(-50)));

      // Tentar enviar para o banco
      const { error } = await supabase
        .from('custom_events')
        .insert(customEventData);

      if (error) {
        console.warn('Erro ao salvar evento customizado:', error);
      }
    } catch (error) {
      console.warn('Erro no tracking de evento:', error);
    }
  };

  // Função para tracking de tempo na página
  const trackTimeOnPage = async (path: string) => {
    const timeSpent = Date.now() - startTimeRef.current;
    
    if (timeSpent > 5000) { // Só tracka se passou mais de 5 segundos
      await trackCustomEvent('time_on_page', {
        page_path: path,
        time_spent_ms: timeSpent,
        time_spent_seconds: Math.floor(timeSpent / 1000)
      });
    }
  };

  // Função para enviar eventos offline quando voltar online
  const syncOfflineEvents = async () => {
    try {
      const offlineEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      
      if (offlineEvents.length > 0) {
        for (const event of offlineEvents) {
          if (event.type === 'page_view') {
            await supabase.from('page_views').insert(event.data);
          } else if (event.type === 'custom_event') {
            await supabase.from('custom_events').insert(event.data);
          }
        }
        
        // Limpar eventos após sincronização
        localStorage.removeItem('analytics_events');
      }
    } catch (error) {
      console.warn('Erro ao sincronizar eventos offline:', error);
    }
  };

  // Tracking automático de cliques em elementos importantes
  const trackElementClicks = () => {
    const clickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Trackar cliques em botões
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const buttonText = target.textContent?.trim() || 'Button';
        trackCustomEvent('button_click', {
          button_text: buttonText,
          element_id: target.id || undefined,
          element_class: target.className || undefined
        });
      }
      
      // Trackar cliques em links
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.closest('a') as HTMLAnchorElement;
        trackCustomEvent('link_click', {
          link_text: link.textContent?.trim(),
          link_href: link.href,
          link_target: link.target || undefined
        });
      }
      
      // Trackar cliques em produtos
      if (target.closest('[data-product-id]')) {
        const productElement = target.closest('[data-product-id]') as HTMLElement;
        const productId = productElement.dataset.productId;
        trackCustomEvent('product_click', {
          product_id: productId,
          action: 'view_product'
        });
      }
    };

    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  };

  // Effect para tracking automático da página atual
  useEffect(() => {
    const currentPath = location.pathname;
    const pageTitle = document.title;
    
    // Trackar tempo na página anterior
    if (startTimeRef.current) {
      trackTimeOnPage(currentPath);
    }
    
    // Resetar timer e trackar nova página
    startTimeRef.current = Date.now();
    trackPageView(currentPath, pageTitle);
    
    // Configurar tracking de cliques
    const removeClickTracking = trackElementClicks();
    
    // Cleanup
    return () => {
      trackTimeOnPage(currentPath);
      removeClickTracking();
    };
  }, [location.pathname, user?.id]);

  // Effect para sincronizar eventos quando voltar online
  useEffect(() => {
    const handleOnline = () => {
      syncOfflineEvents();
    };

    window.addEventListener('online', handleOnline);
    
    // Sincronizar imediatamente se estiver online
    if (navigator.onLine) {
      syncOfflineEvents();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Effect para tracking de scroll depth
  useEffect(() => {
    let maxScrollDepth = 0;
    
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      const scrollDepth = Math.round((scrollTop + windowHeight) / documentHeight * 100);
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        
        // Trackar marcos importantes de scroll
        if (scrollDepth >= 25 && maxScrollDepth < 25) {
          trackCustomEvent('scroll_depth', { depth: 25 });
        } else if (scrollDepth >= 50 && maxScrollDepth < 50) {
          trackCustomEvent('scroll_depth', { depth: 50 });
        } else if (scrollDepth >= 75 && maxScrollDepth < 75) {
          trackCustomEvent('scroll_depth', { depth: 75 });
        } else if (scrollDepth >= 90 && maxScrollDepth < 90) {
          trackCustomEvent('scroll_depth', { depth: 90 });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  return {
    trackPageView,
    trackCustomEvent,
    trackTimeOnPage,
    sessionId: sessionIdRef.current
  };
} 