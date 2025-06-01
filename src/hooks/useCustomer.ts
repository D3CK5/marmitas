import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  total_spent: number;
  last_purchase: string | null;
  is_active: boolean;
  is_admin: boolean;
  avatar_url?: string;
}

export interface CustomerDetails extends Customer {
  created_at: string;
  email_verified: boolean;
  phone_verified: boolean;
  addresses: Address[];
  orders: Order[];
}

export interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

export interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
}

export type CustomerActivityStatus = 'Ativo' | 'Recente' | 'Moderado' | 'Distante' | 'Inativo';

export interface CustomerStatusInfo {
  status: CustomerActivityStatus;
  daysSinceLastPurchase: number;
  color: 'green' | 'yellow' | 'orange' | 'red' | 'gray';
}

// Função para calcular o status de atividade do cliente
export function getCustomerActivityStatus(lastPurchase: string | null): CustomerStatusInfo {
  if (!lastPurchase) {
    return {
      status: 'Inativo',
      daysSinceLastPurchase: 999,
      color: 'gray'
    };
  }

  const now = new Date();
  const lastPurchaseDate = new Date(lastPurchase);
  const diffTime = Math.abs(now.getTime() - lastPurchaseDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 15) {
    return {
      status: 'Ativo',
      daysSinceLastPurchase: diffDays,
      color: 'green'
    };
  } else if (diffDays <= 30) {
    return {
      status: 'Recente',
      daysSinceLastPurchase: diffDays,
      color: 'yellow'
    };
  } else if (diffDays <= 60) {
    return {
      status: 'Moderado',
      daysSinceLastPurchase: diffDays,
      color: 'orange'
    };
  } else if (diffDays <= 90) {
    return {
      status: 'Distante',
      daysSinceLastPurchase: diffDays,
      color: 'red'
    };
  } else {
    return {
      status: 'Inativo',
      daysSinceLastPurchase: diffDays,
      color: 'gray'
    };
  }
}

export function useCustomer() {
  const queryClient = useQueryClient();

  // Buscar todos os clientes
  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc("get_users_with_profiles");

        if (error) {
          console.error("Erro ao buscar usuários:", error);
          throw error;
        }

        // Extrair os dados do objeto aninhado e garantir que todos os campos necessários existem
        const processedData = data?.map(item => {
          const customer = item.get_users_with_profiles || item;
          return {
            ...customer,
            full_name: customer.full_name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            total_spent: customer.total_spent || 0,
            is_active: customer.is_active ?? true,
            is_admin: customer.is_admin ?? false
          };
        })
        .filter(customer => customer.id) // Filtrar itens sem ID
        .filter((customer, index, self) => 
          // Remover duplicatas por ID
          self.findIndex(c => c.id === customer.id) === index
        ) || [];

        return processedData as Customer[];
      } catch (error) {
        console.error("Erro geral:", error);
        return [] as Customer[];
      }
    },
    staleTime: 1000 * 60, // 1 minuto
  });

  // Buscar detalhes de um cliente específico
  const getCustomerDetails = async (userId: string) => {
        try {
          // Buscar perfil do usuário
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          if (profileError) throw profileError;

          // Buscar endereços do usuário
          const { data: addresses, error: addressesError } = await supabase
            .from("user_addresses")
            .select("*")
            .eq("user_id", userId);

          if (addressesError) throw addressesError;

          // Buscar pedidos do usuário
          const { data: orders, error: ordersError } = await supabase
            .from("orders")
            .select("id, created_at, status, total")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

          if (ordersError) throw ordersError;

          // Usar diretamente o email do perfil em vez de tentar acessar a tabela auth.users
          const email = profile?.email || "Não disponível";

          // Combinar todos os dados
          return {
            ...profile,
            email,
            addresses: addresses || [],
            orders: orders || []
          } as CustomerDetails;
        } catch (error) {
          console.error("Erro ao buscar detalhes do cliente:", error);
      throw error;
        }
  };

  // Atualizar cliente
  const updateCustomer = useMutation({
    mutationFn: async (data: Partial<Customer> & { id: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar cliente: " + (error.message || "Erro desconhecido"));
    }
  });

  // Atualizar status do cliente
  const updateCustomerStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Status do cliente atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar status: " + (error.message || "Erro desconhecido"));
    }
  });

  // Deletar cliente (exclusão completa)
  const deleteCustomer = useMutation({
    mutationFn: async (userId: string) => {
      // Obter o token do usuário atual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Usuário não autenticado");
      }

      // Chamar a Edge Function para exclusão completa
      const { data, error } = await supabase.functions.invoke('delete-customer', {
        body: { userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || "Erro na comunicação com o servidor");
      }

      if (!data || !data.success) {
        const errorMsg = data?.error || "Erro desconhecido ao excluir cliente";
        throw new Error(errorMsg);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(`Cliente ${data.deletedUser?.name || ''} excluído completamente com sucesso!`);
    },
    onError: (error: any) => {
      let errorMessage = "Erro ao excluir cliente";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(errorMessage);
    }
  });

  // Teste simples de Edge Function
  const testEdgeFunction = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error("No session for test");
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-customer-test', {
        body: { test: 'data', email: 'test@test.com' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Test function error:", error);
      }
      
      if (data) {
        console.log("Test function success:", data);
      }
    } catch (error) {
      console.error("Test function exception:", error);
    }
  };

  // Criar cliente (função para admin)
  const createCustomer = useMutation({
    mutationFn: async (customerData: {
      email: string;
      full_name: string;
      phone?: string;
      password: string;
    }) => {
      // Obter o token do usuário atual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Usuário não autenticado");
      }

      try {
        // Chamar a Edge Function para criar o cliente
        const { data, error } = await supabase.functions.invoke('create-customer', {
          body: customerData,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          throw new Error(error.message || "Erro na comunicação com o servidor");
        }

        if (!data) {
          throw new Error("Nenhum dado retornado do servidor");
        }

        if (!data.success) {
          const errorMsg = data?.error || "Erro desconhecido ao criar cliente";
          throw new Error(errorMsg);
        }

        return data.user;
      } catch (invokeError) {
        // SOLUÇÃO ROBUSTA: Se deu erro, verificar se o usuário foi criado mesmo assim
        try {
          // Aguardar um pouco para dar tempo do usuário ser criado
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verificar se o usuário foi criado verificando se existe no banco
          const { data: existingUser, error: checkError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('email', customerData.email)
            .single();
          
          if (!checkError && existingUser) {
            toast.success("Cliente criado com sucesso!");
            return {
              id: existingUser.id,
              email: existingUser.email,
              full_name: existingUser.full_name
            };
          }
        } catch (checkUserError) {
          // Ignorar erro da verificação
        }
        
        // Se chegou aqui, é um erro real - fazer uma requisição manual para pegar o erro específico
        try {
          const response = await fetch(`https://ajrfuuikqqngzixkllnz.supabase.co/functions/v1/create-customer`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(customerData),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.error) {
                throw new Error(errorData.error);
              }
            } catch (parseError) {
              throw new Error(`Erro ${response.status}: ${errorText}`);
            }
          }
          
          const successData = await response.json();
          return successData.user;
        } catch (manualError) {
          throw manualError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: any) => {
      let errorMessage = "Erro ao criar cliente";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(errorMessage);
    }
  });

  return {
    customers,
    isLoading,
    getCustomerDetails,
    updateCustomer,
    updateCustomerStatus,
    deleteCustomer,
    createCustomer,
    testEdgeFunction
  };
} 