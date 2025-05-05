import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    title: string;
  };
}

export interface Order {
  id: number;
  created_at: string;
  status: string;
  total: number;
  user_id: string;
  address_id: string;
  deleted_at?: string | null;
  items: OrderItem[];
  user: {
    id: string;
    full_name: string;
    phone: string;
  };
  address: {
    id: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    postal_code: string;
  };
}

export function useAdminOrders() {
  const queryClient = useQueryClient();

  // Buscar todos os pedidos ativos (não excluídos)
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      try {
        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            status,
            total,
            user_id,
            address_id,
            deleted_at
          `)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Buscar informações dos usuários
        const userIds = orders.map(order => order.user_id);
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', userIds);

        if (usersError) throw usersError;

        // Buscar informações dos endereços
        const addressIds = orders.map(order => order.address_id);
        const { data: addresses, error: addressesError } = await supabase
          .from('user_addresses')
          .select('id, street, number, complement, neighborhood, city, state, postal_code')
          .in('id', addressIds);

        if (addressesError) throw addressesError;

        const ordersWithItems = await Promise.all(
          orders.map(async (order) => {
            const { data: items, error: itemsError } = await supabase
              .from('order_items')
              .select(`
                id,
                quantity,
                price,
                product:products (
                  title
                )
              `)
              .eq('order_id', order.id);

            if (itemsError) throw itemsError;

            const user = users.find(u => u.id === order.user_id);
            const address = addresses.find(a => a.id === order.address_id);

            return {
              ...order,
              items,
              user,
              address,
            };
          })
        );

        return ordersWithItems;
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        return [];
      }
    },
    staleTime: 1000 * 60, // 1 minuto
  });

  // Buscar pedidos excluídos (na lixeira)
  const { data: deletedOrders, isLoading: isLoadingDeleted } = useQuery({
    queryKey: ["deleted-orders"],
    queryFn: async () => {
      try {
        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            status,
            total,
            user_id,
            address_id,
            deleted_at
          `)
          .not('deleted_at', 'is', null)
          .order('deleted_at', { ascending: false });

        if (error) throw error;

        // Buscar informações dos usuários
        const userIds = orders.map(order => order.user_id);
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', userIds);

        if (usersError) throw usersError;

        return orders.map(order => {
          const user = users.find(u => u.id === order.user_id);
          return {
            ...order,
            user: user || { id: order.user_id, full_name: 'Usuário Desconhecido', phone: '' },
          };
        });
      } catch (error) {
        console.error('Erro ao buscar pedidos excluídos:', error);
        return [];
      }
    },
    staleTime: 1000 * 60, // 1 minuto
  });

  // Atualizar status do pedido
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Status do pedido atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar status do pedido: " + (error.message || "Erro desconhecido"));
    }
  });

  // Soft delete (mover para a lixeira)
  const softDeleteOrders = useMutation({
    mutationFn: async (orderIds: number[]) => {
      const { error } = await supabase
        .from('orders')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', orderIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["deleted-orders"] });
      toast.success("Pedidos movidos para a lixeira!");
    },
    onError: (error: any) => {
      toast.error("Erro ao mover pedidos para a lixeira: " + (error.message || "Erro desconhecido"));
    }
  });

  // Restaurar pedidos da lixeira
  const restoreOrders = useMutation({
    mutationFn: async (orderIds: number[]) => {
      const { error } = await supabase
        .from('orders')
        .update({ deleted_at: null })
        .in('id', orderIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["deleted-orders"] });
      toast.success("Pedidos restaurados com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao restaurar pedidos: " + (error.message || "Erro desconhecido"));
    }
  });

  // Exclusão permanente
  const permanentDeleteOrders = useMutation({
    mutationFn: async (orderIds: number[]) => {
      // Primeiro, excluir os itens do pedido
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .in('order_id', orderIds);

      if (itemsError) throw itemsError;

      // Depois, excluir os pedidos
      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deleted-orders"] });
      toast.success("Pedidos excluídos permanentemente!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir pedidos permanentemente: " + (error.message || "Erro desconhecido"));
    }
  });

  return {
    orders,
    isLoading,
    updateOrderStatus,
    softDeleteOrders,
    restoreOrders,
    permanentDeleteOrders,
    deletedOrders,
    isLoadingDeleted
  };
} 