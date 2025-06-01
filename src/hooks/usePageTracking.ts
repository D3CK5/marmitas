import { useEffect } from 'react';
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

export function usePageTracking() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Função para rastrear a visita da página
    const trackPageView = async () => {
      try {
        // Gerar ou recuperar session_id do sessionStorage
        let sessionId = sessionStorage.getItem('analytics_session_id');
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          sessionStorage.setItem('analytics_session_id', sessionId);
        }

        // Dados da página atual
        const pageData = {
          page_path: location.pathname,
          page_title: document.title,
          user_id: user?.id || null,
          session_id: sessionId,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          created_at: new Date().toISOString()
        };

        // Salvar no Supabase (apenas se a tabela existir)
        const { error } = await supabase
          .from('page_views')
          .insert([pageData]);

        if (error && !error.message.includes('relation "page_views" does not exist')) {
          console.error('Erro ao rastrear página:', error);
        }
      } catch (error) {
        console.error('Erro no tracking de página:', error);
      }
    };

    // Delay pequeno para garantir que o título da página seja atualizado
    const timeoutId = setTimeout(trackPageView, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname, user?.id]);

  // Função para rastrear eventos customizados
  const trackEvent = async (eventName: string, eventData?: Record<string, any>) => {
    try {
      let sessionId = sessionStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
      }

      const event = {
        event_name: eventName,
        event_data: eventData || {},
        page_path: location.pathname,
        user_id: user?.id || null,
        session_id: sessionId,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('custom_events')
        .insert([event]);

      if (error && !error.message.includes('relation "custom_events" does not exist')) {
        console.error('Erro ao rastrear evento:', error);
      }
    } catch (error) {
      console.error('Erro no tracking de evento:', error);
    }
  };

  return { trackEvent };
} 