import React, { useState, useEffect, useRef } from 'react';
import { useImagePreload } from '../../utils/performance';
import { Skeleton } from '../ui/Skeleton';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  lowResSrc?: string;
  placeholderColor?: string;
  aspectRatio?: number;
  lazyLoad?: boolean;
  loadingStrategy?: 'eager' | 'lazy' | 'progressive';
  blurhash?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
}

/**
 * Componente de imagem otimizado para performance
 * Implementa estratégias de carregamento, lazy loading, e fallbacks
 */
export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      fallbackSrc,
      lowResSrc,
      placeholderColor = '#f3f4f6',
      aspectRatio,
      lazyLoad = true,
      loadingStrategy = 'lazy',
      priority = false,
      blurhash,
      onLoad,
      onError,
      className = '',
      objectFit = 'cover',
      objectPosition = 'center',
      alt = '',
      ...props
    },
    ref
  ) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showLowRes, setShowLowRes] = useState(Boolean(lowResSrc));
    
    // Pré-carregar a imagem principal se priority for true
    const preloadResult = useImagePreload(priority ? src : '', { priority });
    
    useEffect(() => {
      // Se a imagem foi pré-carregada com prioridade, considerar como carregada
      if (priority && preloadResult.isLoaded) {
        setIsLoaded(true);
      }
    }, [priority, preloadResult.isLoaded]);
    
    // Configurar o observador de interseção para lazy loading
    useEffect(() => {
      if (!lazyLoad || !imgRef.current || priority) return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              if (loadingStrategy === 'progressive' && lowResSrc) {
                // Para carregamento progressivo, primeiro carregar a versão de baixa resolução
                img.src = lowResSrc;
              } else {
                // Para lazy loading normal, carregar diretamente a imagem completa
                img.src = src;
              }
              observer.unobserve(img);
            }
          });
        },
        {
          rootMargin: '200px', // Começar a carregar quando estiver a 200px de entrar na viewport
          threshold: 0.01,
        }
      );
      
      observer.observe(imgRef.current);
      
      return () => {
        if (imgRef.current) {
          observer.unobserve(imgRef.current);
        }
      };
    }, [lazyLoad, loadingStrategy, lowResSrc, src, priority]);
    
    // Manipular carregamento de imagem
    const handleLoad = () => {
      if (showLowRes && loadingStrategy === 'progressive') {
        // Após carregar versão de baixa resolução, carregar a versão de alta resolução
        setShowLowRes(false);
        if (imgRef.current) {
          imgRef.current.src = src;
        }
      } else {
        setIsLoaded(true);
        if (onLoad) onLoad();
      }
    };
    
    // Manipular erro de carregamento
    const handleError = () => {
      if (!hasError && fallbackSrc) {
        setHasError(true);
        if (imgRef.current) {
          imgRef.current.src = fallbackSrc;
        }
      } else {
        setHasError(true);
        if (onError) onError();
      }
    };
    
    // Definir atributos de loading e decoding corretos
    const loadingAttr = lazyLoad && !priority ? 'lazy' : 'eager';
    const decodingAttr = priority ? 'sync' : 'async';
    
    // Calcular paddingBottom para manter o aspect ratio enquanto a imagem carrega
    const paddingBottom = aspectRatio ? `${(1 / aspectRatio) * 100}%` : undefined;
    
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{
          paddingBottom,
          background: isLoaded ? 'transparent' : placeholderColor,
        }}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Skeleton className="w-full h-full" />
          </div>
        )}
        
        <img
          ref={(node) => {
            // Encaminhar ref para o ref externo se fornecido
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
            imgRef.current = node;
          }}
          src={priority || !lazyLoad ? src : (loadingStrategy === 'progressive' && lowResSrc ? lowResSrc : 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==')} // Use blank image initially for lazy loading
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading={loadingAttr}
          decoding={decodingAttr}
          fetchPriority={priority ? 'high' : 'auto'}
          style={{
            objectFit,
            objectPosition,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            width: '100%',
            height: '100%',
            position: aspectRatio ? 'absolute' : 'relative',
            top: 0,
            left: 0,
          }}
          {...props}
        />
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage; 