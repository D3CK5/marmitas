import { useState, useEffect } from 'react';

/**
 * Hook para verificar se uma media query corresponde ao tamanho atual da tela
 * Útil para responsividade e adaptação condicional de componentes
 * @param query A media query a ser verificada (ex: '(max-width: 768px)')
 * @returns boolean indicando se a media query corresponde
 */
export function useMediaQuery(query: string): boolean {
  // Valor inicial baseado no estado atual da janela (se disponível)
  const getMatches = (): boolean => {
    // Verificar se estamos no ambiente do navegador
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  // Estado para armazenar o resultado da media query
  const [matches, setMatches] = useState<boolean>(getMatches());

  // Efeito para adicionar listener para mudanças na media query
  useEffect(() => {
    // Verificar se estamos no ambiente do navegador
    if (typeof window === 'undefined') {
      return undefined;
    }

    // Criar media query
    const mediaQuery = window.matchMedia(query);
    
    // Definir o valor inicial
    setMatches(mediaQuery.matches);

    // Função para atualizar o estado quando a media query muda
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Adicionar listener para mudanças
    // Usar o método adequado para diferentes navegadores
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Para compatibilidade com navegadores mais antigos
      mediaQuery.addListener(handler);
    }

    // Limpar listener ao desmontar
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        // Para compatibilidade com navegadores mais antigos
        mediaQuery.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}

// Hooks pré-configurados para breakpoints comuns
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

export function useIsLargeDesktop(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}

export default useMediaQuery; 