import { useEffect, useRef, RefObject } from 'react';

export interface UseOutsideClickOptions {
  enabled?: boolean;
  excludeRefs?: RefObject<HTMLElement>[];
}

/**
 * Hook para detectar cliques fora de um elemento
 * Útil para menus, dropdowns, modais e outros componentes interativos
 * @param callback Função a ser chamada quando ocorrer um clique fora do elemento
 * @param options Opções adicionais para configurar o comportamento
 */
export function useOutsideClick<T extends HTMLElement = HTMLElement>(
  callback: () => void,
  options: UseOutsideClickOptions = {}
): RefObject<T> {
  const { enabled = true, excludeRefs = [] } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // Verificar se o clique foi fora do elemento referenciado
      if (ref.current && !ref.current.contains(target)) {
        // Verificar se o clique foi em algum dos elementos excluídos
        const clickedInExcludedRef = excludeRefs.some(
          (excludeRef) => excludeRef.current && excludeRef.current.contains(target)
        );
        
        // Se não clicou em nenhum elemento excluído, aciona o callback
        if (!clickedInExcludedRef) {
          callback();
        }
      }
    };

    // Adicionar os event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    // Limpar os event listeners quando o componente for desmontado
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [callback, enabled, excludeRefs]);

  return ref;
}

export default useOutsideClick; 