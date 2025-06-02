import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface GoogleAnalyticsContextType {
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
  trackPageView: (page: string, title?: string) => void;
  trackPurchase: (transactionId: string, value: number, items: any[]) => void;
  trackAddToCart: (itemId: string, itemName: string, value: number) => void;
  setUserProperties: (properties: Record<string, any>) => void;
}

const GoogleAnalyticsContext = createContext<GoogleAnalyticsContextType | null>(null);

interface GoogleAnalyticsProviderProps {
  children: ReactNode;
  measurementId: string;
}

export function GoogleAnalyticsProvider({ children, measurementId }: GoogleAnalyticsProviderProps) {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Carregar Google Analytics se ainda não foi carregado
    if (!window.gtag) {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}', {
          page_title: document.title,
          page_location: window.location.href,
          send_page_view: false
        });
      `;
      document.head.appendChild(script2);

      // Aguardar o carregamento
      setTimeout(() => {
        window.gtag = window.gtag || function() {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push(arguments);
        };
      }, 1000);
    }
  }, [measurementId]);

  useEffect(() => {
    // Trackear mudança de página automaticamente
    if (window.gtag) {
      trackPageView(location.pathname + location.search, document.title);
    }
  }, [location]);

  useEffect(() => {
    // Configurar propriedades do usuário quando logar
    if (user && window.gtag) {
      setUserProperties({
        user_id: user.id,
        custom_user_type: user.email?.includes('@admin') ? 'admin' : 'customer'
      });
    }
  }, [user]);

  const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
    if (window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'engagement',
        event_label: parameters.label || '',
        value: parameters.value || 0,
        ...parameters
      });
    }

    // Log para debug
    console.log('📊 GA Event:', eventName, parameters);
  };

  const trackPageView = (page: string, title?: string) => {
    if (window.gtag) {
      window.gtag('config', measurementId, {
        page_title: title || document.title,
        page_location: window.location.origin + page,
        page_path: page
      });
    }

    console.log('📄 GA Page View:', page, title);
  };

  const trackPurchase = (transactionId: string, value: number, items: any[]) => {
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: value,
        currency: 'BRL',
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.title,
          item_category: 'marmita',
          quantity: item.quantity,
          price: item.price
        }))
      });
    }

    console.log('💰 GA Purchase:', transactionId, value, items);
  };

  const trackAddToCart = (itemId: string, itemName: string, value: number) => {
    if (window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'BRL',
        value: value,
        items: [{
          item_id: itemId,
          item_name: itemName,
          item_category: 'marmita',
          quantity: 1,
          price: value
        }]
      });
    }

    console.log('🛒 GA Add to Cart:', itemId, itemName, value);
  };

  const setUserProperties = (properties: Record<string, any>) => {
    if (window.gtag) {
      window.gtag('config', measurementId, {
        custom_map: properties
      });
    }

    console.log('👤 GA User Properties:', properties);
  };

  const contextValue: GoogleAnalyticsContextType = {
    trackEvent,
    trackPageView,
    trackPurchase,
    trackAddToCart,
    setUserProperties
  };

  return (
    <GoogleAnalyticsContext.Provider value={contextValue}>
      {children}
    </GoogleAnalyticsContext.Provider>
  );
}

export function useGoogleAnalytics() {
  const context = useContext(GoogleAnalyticsContext);
  if (!context) {
    throw new Error('useGoogleAnalytics must be used within a GoogleAnalyticsProvider');
  }
  return context;
}

// Hook para tracking automático de eventos comuns
export function useAnalyticsTracking() {
  const { trackEvent } = useGoogleAnalytics();

  const trackClick = (elementName: string, additionalData?: Record<string, any>) => {
    trackEvent('click', {
      event_category: 'ui_interaction',
      event_label: elementName,
      ...additionalData
    });
  };

  const trackFormSubmit = (formName: string, success: boolean = true) => {
    trackEvent('form_submit', {
      event_category: 'form_interaction',
      event_label: formName,
      success: success
    });
  };

  const trackSearch = (searchTerm: string, resultsCount: number = 0) => {
    trackEvent('search', {
      event_category: 'site_search',
      search_term: searchTerm,
      results_count: resultsCount
    });
  };

  const trackVideoPlay = (videoName: string, duration?: number) => {
    trackEvent('video_play', {
      event_category: 'video_engagement',
      event_label: videoName,
      video_duration: duration
    });
  };

  const trackFileDownload = (fileName: string, fileType: string) => {
    trackEvent('file_download', {
      event_category: 'file_interaction',
      file_name: fileName,
      file_type: fileType
    });
  };

  const trackOutboundLink = (url: string, linkText?: string) => {
    trackEvent('click', {
      event_category: 'outbound_link',
      event_label: linkText || url,
      outbound_url: url
    });
  };

  const trackCustomConversion = (conversionName: string, value?: number) => {
    trackEvent('conversion', {
      event_category: 'custom_conversion',
      event_label: conversionName,
      value: value || 1
    });
  };

  return {
    trackClick,
    trackFormSubmit,
    trackSearch,
    trackVideoPlay,
    trackFileDownload,
    trackOutboundLink,
    trackCustomConversion
  };
} 