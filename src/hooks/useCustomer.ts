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
  user_id: string;
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

export function useCustomer() {
  const queryClient = useQueryClient();

  // Buscar todos os clientes
  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      try {
        // Aqui alteramos de user_profiles para profiles
        const { data, error } = await supabase.rpc("get_users_with_profiles");

        if (error) {
          console.error("Erro ao buscar usuários:", error);
          throw error;
        }

        // Garantir que todos os campos necessários existem e têm valores padrão
        const processedData = data?.map(customer => ({
          ...customer,
          full_name: customer.full_name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          total_spent: customer.total_spent || 0,
          is_active: customer.is_active ?? true,
          is_admin: customer.is_admin ?? false
        })) || [];

        return processedData as Customer[];
      } catch (error) {
        console.error("Erro geral:", error);
        return [] as Customer[];
      }
    }
  });

  // Buscar detalhes de um cliente específico
  const getCustomerDetails = async (userId: string): Promise<CustomerDetails | null> => {
    try {
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from("profiles") // Alterado de user_profiles para profiles
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
      // Isso evita o erro 403 Forbidden
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

  // Atualizar status (ativar/desativar) de um cliente
  const updateCustomerStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("profiles") // Alterado de user_profiles para profiles
        .update({ is_active: isActive })
        .eq("id", userId);

      if (error) throw error;
      return { userId, isActive };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(`Cliente ${data.isActive ? "ativado" : "desativado"} com sucesso`);
    },
    onError: (error) => {
      console.error("Erro ao atualizar status do cliente:", error);
      toast.error("Erro ao atualizar status do cliente");
    }
  });

  // Excluir um cliente
  const deleteCustomer = useMutation({
    mutationFn: async (userId: string) => {
      // Primeiro remover o perfil
      const { error: profileError } = await supabase
        .from("profiles") // Alterado de user_profiles para profiles
        .delete()
        .eq("id", userId);

      if (profileError) throw profileError;

      // Depois remover o usuário da auth (descomentar se você tem permissão para isso)
      // const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      // if (authError) throw authError;

      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente excluído com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao excluir cliente:", error);
      toast.error("Erro ao excluir cliente");
    }
  });

  // Atualizar dados do cliente
  const updateCustomer = useMutation({
    mutationFn: async (data: Partial<Customer>) => {
      const { error } = await supabase
        .from("profiles") // Alterado de user_profiles para profiles
        .update({
          full_name: data.full_name,
          phone: data.phone,
          is_active: data.is_active
        })
        .eq("id", data.id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente atualizado com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao atualizar cliente:", error);
      toast.error("Erro ao atualizar cliente");
    }
  });

  return {
    customers,
    isLoading,
    getCustomerDetails,
    updateCustomerStatus,
    deleteCustomer,
    updateCustomer
  };
} 