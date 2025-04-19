import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface CreateOrderData {
  address_id: string;
  payment_method: string;
  payment_details: any;
  subtotal: number;
  delivery_fee: number;
  total: number;
  items: OrderItem[];
}

export function useOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar pedidos do usuário
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user) return [];

      try {
        const { data: orders, error } = await supabase
          .rpc('get_user_orders_with_items', {
            p_user_id: user.id
          });

        if (error) {
          console.error('Erro ao buscar pedidos:', error);
          return [];
        }

        return orders || [];
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minuto
  });

  // Criar pedido
  const createOrder = useMutation({
    mutationFn: async (data: CreateOrderData) => {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      try {
        // Inserir o pedido
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            address_id: data.address_id,
            payment_method: data.payment_method,
            payment_details: data.payment_details,
            subtotal: data.subtotal,
            delivery_fee: data.delivery_fee,
            total: data.total,
            status: 'pending'
          })
          .select()
          .single();

        if (orderError) {
          console.error('Erro ao criar pedido:', orderError);
          throw orderError;
        }

        // Inserir os itens do pedido
        const orderItems = data.items.map(item => ({
          order_id: order.id,
          product_id: parseInt(item.product_id),
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Erro ao inserir itens do pedido:', itemsError);
          throw itemsError;
        }

        return order;
      } catch (error: any) {
        console.error('Erro ao criar pedido:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
      toast.success("Pedido criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar pedido: " + (error.message || "Erro desconhecido"));
    }
  });

  return {
    orders,
    isLoading,
    createOrder
  };
} 