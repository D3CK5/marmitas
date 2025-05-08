import { useState, useEffect } from 'react';

interface Cidade {
  id: number;
  nome: string;
}

export function useCidades(uf: string | null) {
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCidades() {
      if (!uf) {
        setCidades([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
        );
        
        if (!response.ok) {
          throw new Error('Erro ao buscar cidades');
        }

        const data = await response.json();
        setCidades(data.map((cidade: any) => ({
          id: cidade.id,
          nome: cidade.nome,
        })));
      } catch (error) {
        console.error('Erro ao buscar cidades:', error);
        setError('Erro ao buscar cidades');
        setCidades([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCidades();
  }, [uf]);

  return { cidades, isLoading, error };
} 