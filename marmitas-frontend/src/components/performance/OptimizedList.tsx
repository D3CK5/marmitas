import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring';

export interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  itemHeight: number;
  className?: string;
  listHeight?: number | string;
  overscan?: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  scrollToItem?: number;
}

/**
 * Componente de lista virtualizada para renderizar grandes quantidades de itens
 * com desempenho otimizado, apenas renderizando itens visíveis
 */
export function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  itemHeight,
  className = '',
  listHeight = 400,
  overscan = 3,
  onEndReached,
  endReachedThreshold = 0.8,
  scrollToItem,
}: OptimizedListProps<T>) {
  // Usar hook de monitoramento de performance
  usePerformanceMonitoring({
    componentName: 'OptimizedList',
    trackMountTime: true,
    trackUpdates: true,
  });

  // Refs e estado
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState<number>(typeof listHeight === 'number' ? listHeight : 400);
  const innerElementRef = useRef<HTMLDivElement>(null);

  // Calcular itens visíveis com base na posição de rolagem atual
  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return items.slice(startIndex, endIndex + 1).map((item, relIndex) => {
      const index = startIndex + relIndex;
      const top = index * itemHeight;
      
      return {
        item,
        index,
        top,
        key: keyExtractor(item, index),
      };
    });
  }, [items, scrollTop, containerHeight, itemHeight, overscan, keyExtractor]);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Manipulador de scroll
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
      
      // Verificar se chegou ao final da lista para carregar mais itens
      if (onEndReached) {
        const scrollY = scrollRef.current.scrollTop;
        const height = scrollRef.current.clientHeight;
        const totalContentHeight = scrollRef.current.scrollHeight;
        
        if (scrollY + height >= totalContentHeight * endReachedThreshold) {
          onEndReached();
        }
      }
    }
  }, [onEndReached, endReachedThreshold]);

  // Ajustar a altura do container quando alterada
  useEffect(() => {
    if (typeof listHeight === 'number') {
      setContainerHeight(listHeight);
    } else if (scrollRef.current && innerElementRef.current) {
      // Se altura for string (ex: '100%'), tentar usar altura do contêiner pai
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          if (entry.target === innerElementRef.current) {
            setContainerHeight(entry.contentRect.height);
          }
        }
      });
      
      resizeObserver.observe(innerElementRef.current);
      
      return () => {
        if (innerElementRef.current) {
          resizeObserver.unobserve(innerElementRef.current);
        }
        resizeObserver.disconnect();
      };
    }
  }, [listHeight]);

  // Rolar até um item específico quando solicitado
  useEffect(() => {
    if (scrollToItem !== undefined && scrollRef.current) {
      scrollRef.current.scrollTop = scrollToItem * itemHeight;
    }
  }, [scrollToItem, itemHeight]);

  return (
    <div 
      ref={innerElementRef}
      className={className} 
      style={{ height: listHeight, position: 'relative' }}
    >
      <div
        ref={scrollRef}
        style={{ 
          overflow: 'auto',
          height: '100%',
          position: 'relative',
        }}
        onScroll={handleScroll}
      >
        <div
          style={{
            height: totalHeight,
            position: 'relative',
          }}
        >
          {visibleItems.map(({ item, index, top, key }) => (
            <div
              key={key}
              style={{
                position: 'absolute',
                top,
                left: 0,
                width: '100%',
                height: itemHeight,
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.memo(OptimizedList); 