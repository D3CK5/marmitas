import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores
 * Útil para retardar a execução de operações baseadas em input, como busca em tempo real
 * @param value O valor que deve ser debounced
 * @param delay Tempo de espera em milissegundos antes de atualizar o valor
 * @returns O valor debounced
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Atualiza o valor debounced após o atraso especificado
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancelar o timeout se o valor mudar ou o componente for desmontado
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce; 