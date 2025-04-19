import { useState, useEffect, useCallback } from 'react';

export interface UseLocalStorageOptions<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  defaultValue?: T | (() => T);
}

/**
 * Hook para gerenciar dados no localStorage
 * Permite salvar e recuperar dados com persistência entre sessões
 */
export function useLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions<T> = {}
) {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    defaultValue
  } = options;

  // Função para obter o valor inicial do localStorage
  const getStoredValue = useCallback((): T => {
    try {
      const item = window.localStorage.getItem(key);
      
      // Se o item existe no localStorage, retorna o valor deserializado
      if (item) {
        return deserializer(item);
      }
      
      // Se não existe, retorna o valor padrão
      return typeof defaultValue === 'function'
        ? (defaultValue as () => T)()
        : defaultValue as T;
    } catch (error) {
      console.error(`Erro ao recuperar item "${key}" do localStorage:`, error);
      
      // Em caso de erro, retorna o valor padrão
      return typeof defaultValue === 'function'
        ? (defaultValue as () => T)()
        : defaultValue as T;
    }
  }, [key, deserializer, defaultValue]);

  // Inicializa o estado com o valor do localStorage ou valor padrão
  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  // Função para atualizar o valor no estado e no localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Permite que o valor seja uma função que recebe o estado atual
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Atualiza o estado React
      setStoredValue(valueToStore);
      
      // Atualiza o localStorage
      if (valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, serializer(valueToStore));
      }
    } catch (error) {
      console.error(`Erro ao salvar item "${key}" no localStorage:`, error);
    }
  }, [key, serializer, storedValue]);

  // Função para remover o item do localStorage
  const removeValue = useCallback(() => {
    try {
      // Remove do localStorage
      window.localStorage.removeItem(key);
      
      // Atualiza o estado para undefined ou valor padrão
      setStoredValue(
        typeof defaultValue === 'function'
          ? (defaultValue as () => T)()
          : defaultValue as T
      );
    } catch (error) {
      console.error(`Erro ao remover item "${key}" do localStorage:`, error);
    }
  }, [key, defaultValue]);

  // Sincroniza o estado com o localStorage quando muda em outra aba
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const newValue = event.newValue ? deserializer(event.newValue) : undefined;
          setStoredValue(newValue ?? getStoredValue());
        } catch (error) {
          console.error(`Erro ao processar alteração de storage para "${key}":`, error);
        }
      } else if (event.key === key && event.newValue === null) {
        // Item foi removido
        setStoredValue(
          typeof defaultValue === 'function'
            ? (defaultValue as () => T)()
            : defaultValue as T
        );
      }
    };

    // Adiciona listener para o evento de mudança no storage
    window.addEventListener('storage', handleStorageChange);

    return () => {
      // Remove o listener quando o componente é desmontado
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, deserializer, getStoredValue, defaultValue]);

  return {
    value: storedValue,
    setValue,
    removeValue
  };
}

export default useLocalStorage; 