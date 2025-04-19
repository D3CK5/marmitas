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

  // Buscar todos os pedidos
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
            address_id
          `)
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

  return {
    orders,
    isLoading,
    updateOrderStatus
  };
} 