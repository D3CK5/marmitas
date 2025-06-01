import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from 'uuid';

export interface CheckoutSession {
  id: string;
  user_id: string;
  session_id: string;
  cart_items: any[];
  started_at: string;
  checkout_entered_at?: string;
  address_selected_at?: string;
  payment_method_selected_at?: string;
  abandoned_at?: string;
  completed_at?: string;
  order_id?: number;
  total_value: number;
}

export interface CartItem {
  product_id: number;
  quantity: number;
  price: number;
  product_title: string;
}

export function useCheckoutTracking() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Iniciar nova sessão de checkout (quando usuário coloca itens no carrinho)
  const startCheckoutSession = useMutation({
    mutationFn: async ({ 
      cartItems, 
      totalValue 
    }: { 
      cartItems: CartItem[]; 
      totalValue: number;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const sessionId = uuidv4();
      
      // Verificar se já existe uma sessão ativa (não abandonada e não completada)
      const { data: existingSession } = await supabase
        .from('checkout_sessions')
        .select('id')
        .eq('user_id', user.id)
        .is('abandoned_at', null)
        .is('completed_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      // Se existe sessão ativa, atualizar ela ao invés de criar nova
      if (existingSession) {
        const { data, error } = await supabase
          .from('checkout_sessions')
          .update({
            cart_items: cartItems,
            total_value: totalValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSession.id)
          .select()
          .single();

        if (error) throw error;
        return { sessionId: data.session_id, sessionDbId: data.id };
      }

      // Criar nova sessão
      const { data, error } = await supabase
        .from('checkout_sessions')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          cart_items: cartItems,
          total_value: totalValue,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      // Salvar ID da sessão no localStorage para tracking
      localStorage.setItem('checkout_session_id', sessionId);
      
      return { sessionId, sessionDbId: data.id };
    }
  });

  // Marcar que usuário entrou no checkout
  const enterCheckout = useMutation({
    mutationFn: async (sessionId?: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const currentSessionId = sessionId || localStorage.getItem('checkout_session_id');
      if (!currentSessionId) throw new Error('Sessão não encontrada');

      const { error } = await supabase
        .from('checkout_sessions')
        .update({
          checkout_entered_at: new Date().toISOString()
        })
        .eq('session_id', currentSessionId)
        .eq('user_id', user.id);

      if (error) throw error;
    }
  });

  // Marcar que usuário selecionou/preencheu endereço
  const selectAddress = useMutation({
    mutationFn: async (sessionId?: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const currentSessionId = sessionId || localStorage.getItem('checkout_session_id');
      if (!currentSessionId) throw new Error('Sessão não encontrada');

      const { error } = await supabase
        .from('checkout_sessions')
        .update({
          address_selected_at: new Date().toISOString()
        })
        .eq('session_id', currentSessionId)
        .eq('user_id', user.id);

      if (error) throw error;
    }
  });

  // Marcar que usuário selecionou método de pagamento
  const selectPaymentMethod = useMutation({
    mutationFn: async (sessionId?: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const currentSessionId = sessionId || localStorage.getItem('checkout_session_id');
      if (!currentSessionId) throw new Error('Sessão não encontrada');

      const { error } = await supabase
        .from('checkout_sessions')
        .update({
          payment_method_selected_at: new Date().toISOString()
        })
        .eq('session_id', currentSessionId)
        .eq('user_id', user.id);

      if (error) throw error;
    }
  });

  // Marcar checkout como completado (quando pedido é criado)
  const completeCheckout = useMutation({
    mutationFn: async ({ 
      orderId, 
      sessionId 
    }: { 
      orderId: number; 
      sessionId?: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const currentSessionId = sessionId || localStorage.getItem('checkout_session_id');
      if (!currentSessionId) throw new Error('Sessão não encontrada');

      const { error } = await supabase
        .from('checkout_sessions')
        .update({
          completed_at: new Date().toISOString(),
          order_id: orderId
        })
        .eq('session_id', currentSessionId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Limpar sessão do localStorage
      localStorage.removeItem('checkout_session_id');
    }
  });

  // Abandonar checkout (marcar como abandonado)
  const abandonCheckout = useMutation({
    mutationFn: async (sessionId?: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const currentSessionId = sessionId || localStorage.getItem('checkout_session_id');
      if (!currentSessionId) return; // Não fazer nada se não há sessão

      const { error } = await supabase
        .from('checkout_sessions')
        .update({
          abandoned_at: new Date().toISOString()
        })
        .eq('session_id', currentSessionId)
        .eq('user_id', user.id);

      if (error) console.error('Erro ao abandonar checkout:', error);
      
      // Limpar sessão do localStorage
      localStorage.removeItem('checkout_session_id');
    }
  });

  // Função utilitária para obter sessão atual
  const getCurrentSession = async () => {
    if (!user) return null;
    
    const sessionId = localStorage.getItem('checkout_session_id');
    if (!sessionId) return null;

    const { data, error } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar sessão:', error);
      return null;
    }

    return data;
  };

  return {
    startCheckoutSession,
    enterCheckout,
    selectAddress,
    selectPaymentMethod,
    completeCheckout,
    abandonCheckout,
    getCurrentSession
  };
} 