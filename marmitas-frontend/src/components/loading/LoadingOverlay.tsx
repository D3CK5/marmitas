import React from 'react';
import { Spinner } from '../ui/Spinner';

export interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
  blur?: boolean;
  spinnerSize?: 'sm' | 'md' | 'lg';
  spinnerColor?: 'primary' | 'secondary' | 'accent' | 'white';
  className?: string;
  overlayClassName?: string;
}

/**
 * LoadingOverlay component
 * Displays a loading spinner over content while it's loading
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  text,
  blur = true,
  spinnerSize = 'md',
  spinnerColor = 'primary',
  className = '',
  overlayClassName = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      
      {isLoading && (
        <div
          className={`
            absolute inset-0 flex flex-col items-center justify-center
            bg-white/80 dark:bg-gray-900/80 
            ${blur ? 'backdrop-blur-sm' : ''} 
            z-10 rounded
            ${overlayClassName}
          `}
          role="status"
          aria-live="polite"
        >
          <Spinner size={spinnerSize} color={spinnerColor} />
          {text && (
            <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {text}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay; 