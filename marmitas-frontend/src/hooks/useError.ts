import { useState, useCallback } from 'react';

export interface ErrorState {
  message: string;
  code?: string | number;
  details?: Record<string, unknown>;
}

export interface UseErrorOptions {
  initialError?: ErrorState | null;
}

export interface UseErrorReturn {
  error: ErrorState | null;
  hasError: boolean;
  setError: (error: ErrorState | null) => void;
  clearError: () => void;
  handleError: (err: unknown) => void;
}

/**
 * Hook para gerenciar estados de erro
 * Fornece métodos para manipular e exibir erros de forma consistente
 */
export function useError({ initialError = null }: UseErrorOptions = {}): UseErrorReturn {
  const [error, setErrorState] = useState<ErrorState | null>(initialError);

  const hasError = error !== null;

  const setError = useCallback((newError: ErrorState | null) => {
    setErrorState(newError);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  // Converte diferentes tipos de erro para um formato consistente
  const handleError = useCallback((err: unknown) => {
    if (!err) {
      setErrorState({ message: 'Ocorreu um erro desconhecido' });
      return;
    }

    if (typeof err === 'string') {
      setErrorState({ message: err });
      return;
    }

    if (err instanceof Error) {
      setErrorState({ 
        message: err.message || 'Ocorreu um erro',
        details: { stack: err.stack }
      });
      return;
    }

    if (typeof err === 'object') {
      const errorObj = err as Record<string, unknown>;
      setErrorState({
        message: (errorObj.message as string) || 'Ocorreu um erro',
        code: errorObj.code as string | number,
        details: errorObj
      });
      return;
    }

    setErrorState({ message: 'Ocorreu um erro desconhecido' });
  }, []);

  return {
    error,
    hasError,
    setError,
    clearError,
    handleError
  };
}

export default useError; 