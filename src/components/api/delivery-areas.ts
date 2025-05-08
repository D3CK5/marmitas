import { supabase } from "@/lib/supabase";

export interface DeliveryArea {
  id: number;
  name: string;
  type: "fixed" | "variable";
  state: string;
  city: string;
  neighborhood: string;
  price: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

// Função para buscar endereço pelo CEP
async function fetchAddressByCep(cep: string) {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }
    
    return {
      state: data.uf,
      city: data.localidade,
      neighborhood: data.bairro
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw error;
  }
}

// Função para verificar se um endereço está dentro de uma área de entrega
function isAddressInDeliveryArea(address: any, area: DeliveryArea): boolean {
  const stateMatch = address.state.toLowerCase() === area.state.toLowerCase();
  const cityMatch = address.city.toLowerCase() === area.city.toLowerCase();
  
  // Para entregas de preço fixo, verificamos apenas estado e cidade
  if (area.type === 'fixed') {
    return stateMatch && cityMatch;
  }
  
  // Para entregas de preço variável, verificamos também o bairro
  const neighborhoodMatch = address.neighborhood.toLowerCase() === area.neighborhood.toLowerCase();
  return stateMatch && cityMatch && neighborhoodMatch;
}

// Função para buscar todas as áreas de entrega
export async function getDeliveryAreas() {
  const { data, error } = await supabase
    .from('delivery_areas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as DeliveryArea[];
}

// Função para criar uma nova área de entrega
export async function createDeliveryArea(area: Omit<DeliveryArea, 'id'>) {
  const { data, error } = await supabase
    .from('delivery_areas')
    .insert(area)
    .select()
    .single();

  if (error) throw error;
  return data as DeliveryArea;
}

// Função para atualizar uma área de entrega
export async function updateDeliveryArea(id: string, area: Partial<DeliveryArea>) {
  const { data, error } = await supabase
    .from('delivery_areas')
    .update(area)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DeliveryArea;
}

// Função para excluir uma área de entrega
export async function deleteDeliveryArea(id: string) {
  const { error } = await supabase
    .from('delivery_areas')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Função para calcular a taxa de entrega para um CEP
export async function calculateDeliveryFee(cep: string): Promise<number | null> {
  try {
    const address = await fetchAddressByCep(cep);
    
    if (!address) {
      console.error('Endereço não encontrado para o CEP:', cep);
      return null;
    }

    const { data: areas, error } = await supabase
      .from('delivery_areas')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error('Erro ao buscar áreas de entrega:', error);
      return null;
    }
    
    if (!areas || areas.length === 0) {
      console.error('Nenhuma área de entrega encontrada');
      return null;
    }
    
    // Primeiro, procuramos por uma área de preço variável que corresponda exatamente ao endereço
    let matchingArea = areas.find(area => 
      area.type === 'variable' && isAddressInDeliveryArea(address, area)
    );

    // Se não encontrarmos uma área variável, procuramos por uma área de preço fixo
    if (!matchingArea) {
      matchingArea = areas.find(area => 
        area.type === 'fixed' && isAddressInDeliveryArea(address, area)
      );
    }

    if (!matchingArea) {
      console.error('Endereço não está em nenhuma área de entrega:', address);
      return null;
    }

    return matchingArea.price;
  } catch (error) {
    console.error('Erro ao calcular taxa de entrega:', error);
    return null;
  }
} 