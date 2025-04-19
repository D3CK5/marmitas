import React, { useState, useEffect, Suspense, ComponentType, lazy } from 'react';
import { Spinner } from '../components/ui/Spinner';

export interface UseLazyComponentOptions {
  fallback?: React.ReactNode;
  preload?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook para carregar componentes de forma lazy (sob demanda)
 * Utiliza React.lazy e Suspense para otimizar o carregamento inicial da aplicação
 * 
 * @param importFn Função que importa o componente (usando dynamic import)
 * @param options Opções de configuração
 * @returns Um componente React que carrega sob demanda
 */
export function useLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: UseLazyComponentOptions = {}
): {
  Component: React.ComponentType<React.ComponentProps<T>>;
  isLoaded: boolean;
  error: Error | null;
} {
  const { 
    fallback = <div className="p-4 flex justify-center"><Spinner size="lg" /></div>,
    preload = false,
    onLoad,
    onError
  } = options;

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Criar o componente lazy
  const LazyComponent = lazy(() => {
    return importFn()
      .then((module) => {
        setIsLoaded(true);
        if (onLoad) onLoad();
        return module;
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (onError) onError(error);
        
        // Retornar um componente de fallback em caso de erro
        return {
          default: (props: any) => (
            <div className="p-4 text-red-500 bg-red-50 rounded border border-red-200">
              Erro ao carregar o componente: {error.message}
            </div>
          )
        };
      });
  });

  // Pré-carregar o componente se a opção estiver ativada
  useEffect(() => {
    if (preload) {
      importFn()
        .then(() => {
          setIsLoaded(true);
          if (onLoad) onLoad();
        })
        .catch((err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          if (onError) onError(error);
        });
    }
  }, [preload, importFn, onLoad, onError]);

  // Retornar o componente envolvido em Suspense
  const Component = (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  return { Component, isLoaded, error };
}

export default useLazyComponent; 