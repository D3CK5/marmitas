import { useState, useEffect, useCallback } from 'react';

interface IBGEUFResponse {
  id: number;
  sigla: string;
  nome: string;
}

interface IBGECityResponse {
  id: number;
  nome: string;
}

export function useIBGE() {
  const [states, setStates] = useState<IBGEUFResponse[]>([]);
  const [cities, setCities] = useState<IBGECityResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
      if (!response.ok) {
        throw new Error('Falha ao carregar estados');
      }
      const data = await response.json();
      setStates(data || []);
    } catch (err) {
      console.error('Erro ao carregar estados:', err);
      setError('Erro ao carregar estados');
      setStates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCities = useCallback(async (uf: string) => {
    if (!uf) {
      setCities([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
      if (!response.ok) {
        throw new Error('Falha ao carregar cidades');
      }
      const data = await response.json();
      setCities(data || []);
    } catch (err) {
      console.error('Erro ao carregar cidades:', err);
      setError('Erro ao carregar cidades');
      setCities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  return {
    states,
    cities,
    loading,
    error,
    fetchCities,
    refetchStates: fetchStates
  };
} 