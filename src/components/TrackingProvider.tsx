import { ReactNode, useEffect, useState } from 'react';
import { GoogleAnalyticsProvider } from './GoogleAnalyticsProvider';
import { HotjarProvider } from './HotjarProvider';
import { useIntegrations } from '@/hooks/useIntegrations';

interface TrackingProviderProps {
  children: ReactNode;
}

// Facebook Pixel Integration
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

// Google Tag Manager Integration
declare global {
  interface Window {
    dataLayer: any[];
  }
}

export function TrackingProvider({ children }: TrackingProviderProps) {
  const { settings, isLoading } = useIntegrations();
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  useEffect(() => {
    if (!settings || isLoading) return;

    // Load Facebook Pixel
    if (settings.is_facebook_pixel_enabled && settings.facebook_pixel_id) {
      loadFacebookPixel(settings.facebook_pixel_id);
    }

    // Load Google Tag Manager
    if (settings.is_google_tag_manager_enabled && settings.google_tag_manager_id) {
      loadGoogleTagManager(settings.google_tag_manager_id);
    }

    setTrackingEnabled(true);
  }, [settings, isLoading]);

  const loadFacebookPixel = (pixelId: string) => {
    if (window.fbq) return; // Already loaded

    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    // Add noscript fallback
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `
      <img height="1" width="1" style="display:none" 
           src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />
    `;
    document.head.appendChild(noscript);

    console.log('📘 Facebook Pixel carregado com ID:', pixelId);
  };

  const loadGoogleTagManager = (gtmId: string) => {
    if (window.dataLayer) return; // Already loaded

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    // Load GTM script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    document.head.appendChild(script);

    // Add noscript fallback
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `
      <iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
              height="0" width="0" style="display:none;visibility:hidden"></iframe>
    `;
    document.body.appendChild(noscript);

    console.log('🏷️ Google Tag Manager carregado com ID:', gtmId);
  };

  // Se as configurações ainda estão carregando, renderizar apenas os filhos
  if (isLoading || !trackingEnabled) {
    return <>{children}</>;
  }

  // Aplicar providers condicionalmente
  let wrappedChildren = children;

  // Wrap with Hotjar if enabled
  if (settings?.is_hotjar_enabled && settings.hotjar_id) {
    wrappedChildren = (
      <HotjarProvider hotjarId={settings.hotjar_id}>
        {wrappedChildren}
      </HotjarProvider>
    );
  }

  // Wrap with Google Analytics if enabled
  if (settings?.is_google_analytics_enabled && settings.google_analytics_id) {
    wrappedChildren = (
      <GoogleAnalyticsProvider measurementId={settings.google_analytics_id}>
        {wrappedChildren}
      </GoogleAnalyticsProvider>
    );
  }

  return <>{wrappedChildren}</>;
}

// Hook para Facebook Pixel tracking
export function useFacebookPixel() {
  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (window.fbq) {
      window.fbq('track', eventName, parameters);
      console.log('📘 FB Pixel Event:', eventName, parameters);
    }
  };

  const trackPurchase = (value: number, currency: string = 'BRL', contentIds?: string[]) => {
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        value: value,
        currency: currency,
        content_ids: contentIds
      });
      console.log('💰 FB Pixel Purchase:', value, currency);
    }
  };

  const trackAddToCart = (value: number, currency: string = 'BRL', contentId?: string) => {
    if (window.fbq) {
      window.fbq('track', 'AddToCart', {
        value: value,
        currency: currency,
        content_id: contentId
      });
      console.log('🛒 FB Pixel Add to Cart:', value, contentId);
    }
  };

  const trackLead = (value?: number, currency: string = 'BRL') => {
    if (window.fbq) {
      window.fbq('track', 'Lead', {
        value: value,
        currency: currency
      });
      console.log('🎯 FB Pixel Lead:', value);
    }
  };

  return {
    trackEvent,
    trackPurchase,
    trackAddToCart,
    trackLead
  };
}

// Hook para Google Tag Manager
export function useGoogleTagManager() {
  const pushEvent = (eventName: string, data?: Record<string, any>) => {
    if (window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...data
      });
      console.log('🏷️ GTM Event:', eventName, data);
    }
  };

  const trackPurchase = (transactionId: string, value: number, items: any[]) => {
    pushEvent('purchase', {
      transaction_id: transactionId,
      value: value,
      currency: 'BRL',
      items: items
    });
  };

  const trackPageView = (pagePath: string, pageTitle?: string) => {
    pushEvent('page_view', {
      page_path: pagePath,
      page_title: pageTitle
    });
  };

  return {
    pushEvent,
    trackPurchase,
    trackPageView
  };
} 