import React, { useState, useEffect } from 'react';
import { Skeleton } from '../ui/Skeleton';

export interface ProgressiveImageProps {
  src: string;
  placeholderSrc?: string;
  alt: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * ProgressiveImage component
 * Displays a lower quality placeholder while the main image loads
 */
export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  placeholderSrc,
  alt,
  className = '',
  width,
  height,
  onLoad,
  onError,
}) => {
  const [imgSrc, setImgSrc] = useState(placeholderSrc || src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Style for container
  const style: React.CSSProperties = {
    width: width || 'auto',
    height: height || 'auto',
  };

  useEffect(() => {
    // If placeholder is not provided, start loading the main image immediately
    if (!placeholderSrc) {
      setImgSrc(src);
      return;
    }

    // Create a new Image object to load the main image in the background
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImgSrc(src);
      setIsLoading(false);
      if (onLoad) onLoad();
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      if (onError) onError();
    };
  }, [src, placeholderSrc, onLoad, onError]);

  // If error loading the image
  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded ${className}`}
        style={style}
        role="img"
        aria-label={alt}
      >
        <svg
          className="h-8 w-8 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative" style={style}>
      {/* Show skeleton while loading */}
      {isLoading && (
        <Skeleton
          className="absolute inset-0 z-0"
          width="100%"
          height="100%"
        />
      )}
      
      <img
        src={imgSrc}
        alt={alt}
        className={`
          w-full h-full object-cover transition-opacity duration-300 
          ${isLoading ? 'opacity-50' : 'opacity-100'}
          ${className}
        `}
        onLoad={() => {
          // If we're showing the main image (not placeholder), mark loading as complete
          if (imgSrc === src) {
            setIsLoading(false);
            if (onLoad) onLoad();
          }
        }}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
          if (onError) onError();
        }}
      />
    </div>
  );
};

export default ProgressiveImage; 