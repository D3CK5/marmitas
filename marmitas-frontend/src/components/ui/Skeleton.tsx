import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton component to display content placeholders during loading
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  // Base classes
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  // Animation classes
  const animationClasses = 
    animation === 'pulse' 
      ? 'animate-pulse' 
      : animation === 'wave' 
        ? 'animate-shimmer' 
        : '';
  
  // Shape classes
  const shapeClasses = variant === 'circular' ? 'rounded-full' : variant === 'text' ? 'rounded' : 'rounded-md';
  
  // Style for width and height
  const style: React.CSSProperties = {
    width: width,
    height: height,
  };
  
  if (variant === 'text' && !height) {
    style.height = '1em';
  }
  
  return (
    <div 
      className={`${baseClasses} ${animationClasses} ${shapeClasses} ${className}`}
      style={style}
      role="status"
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton Text component for paragraph-like loading states
 */
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  lineHeight?: string | number;
  lineSpacing?: string | number;
  width?: string | number | Array<string | number>;
}> = ({
  lines = 3,
  className = '',
  lineHeight = '1em',
  lineSpacing = '0.5em',
  width,
}) => {
  return (
    <div className={`space-y-${lineSpacing} ${className}`}>
      {Array.from({ length: lines }).map((_, i) => {
        // If width is an array, use the specified width for each line
        // or use a random width between 70% and 100% for the last line
        const lineWidth = Array.isArray(width) 
          ? width[i] || '100%'
          : (i === lines - 1 && !width) 
            ? `${70 + Math.random() * 30}%` 
            : width || '100%';
            
        return (
          <Skeleton
            key={i}
            variant="text"
            width={lineWidth}
            height={lineHeight}
            animation="pulse"
          />
        );
      })}
    </div>
  );
};

export default Skeleton; 