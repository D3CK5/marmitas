// EXEMPLO DE INTEGRAÇÃO DO SISTEMA DE TRACKING DE CHECKOUT
// Este arquivo mostra como usar o useCheckoutTracking nas páginas do carrinho e checkout

import { useEffect } from 'react';
import { useCheckoutTracking } from '@/hooks/useCheckoutTracking';

// EXEMPLO 1: Na página do carrinho
export function CartPageExample() {
  const { startCheckoutSession } = useCheckoutTracking();

  // Quando usuário adiciona itens ao carrinho
  const handleAddToCart = async (items: any[], total: number) => {
    try {
      await startCheckoutSession.mutateAsync({
        cartItems: items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price,
          product_title: item.title
        })),
        totalValue: total
      });
    } catch (error) {
      console.error('Erro ao iniciar sessão de checkout:', error);
    }
  };

  return (
    <div>
      {/* Sua página de carrinho aqui */}
    </div>
  );
}

// EXEMPLO 2: Na página de checkout
export function CheckoutPageExample() {
  const { 
    enterCheckout, 
    selectAddress, 
    selectPaymentMethod, 
    completeCheckout, 
    abandonCheckout 
  } = useCheckoutTracking();

  // Quando usuário entra na página de checkout
  useEffect(() => {
    enterCheckout.mutateAsync();
  }, []);

  // Quando usuário sai da página sem finalizar (cleanup)
  useEffect(() => {
    return () => {
      // Marcar como abandonado se sair da página
      const timeoutId = setTimeout(() => {
        abandonCheckout.mutateAsync();
      }, 1000); // 1 segundo de delay para evitar falsos positivos

      return () => clearTimeout(timeoutId);
    };
  }, []);

  // Quando usuário seleciona endereço
  const handleAddressSelect = async (addressId: string) => {
    try {
      await selectAddress.mutateAsync();
      // Sua lógica de seleção de endereço aqui
    } catch (error) {
      console.error('Erro ao marcar endereço selecionado:', error);
    }
  };

  // Quando usuário seleciona método de pagamento
  const handlePaymentMethodSelect = async (method: string) => {
    try {
      await selectPaymentMethod.mutateAsync();
      // Sua lógica de seleção de pagamento aqui
    } catch (error) {
      console.error('Erro ao marcar método de pagamento:', error);
    }
  };

  // Quando pedido é finalizado com sucesso
  const handleOrderComplete = async (orderId: number) => {
    try {
      await completeCheckout.mutateAsync({ orderId });
      // Redirecionar para página de sucesso
    } catch (error) {
      console.error('Erro ao marcar checkout como completo:', error);
    }
  };

  return (
    <div>
      {/* Sua página de checkout aqui */}
    </div>
  );
}

// EXEMPLO 3: Hook para detectar abandono automático por tempo
export function useAbandonmentDetection() {
  const { abandonCheckout, getCurrentSession } = useCheckoutTracking();

  useEffect(() => {
    // Verificar a cada 5 minutos se há sessão abandonada
    const interval = setInterval(async () => {
      const session = await getCurrentSession();
      
      if (session && session.address_selected_at) {
        const addressSelectedTime = new Date(session.address_selected_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - addressSelectedTime.getTime()) / (1000 * 60);
        
        // Se passou 30 minutos desde seleção do endereço, marcar como abandonado
        if (diffMinutes >= 30) {
          await abandonCheckout.mutateAsync();
        }
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, []);
}

/* 
INSTRUÇÕES DE INTEGRAÇÃO:

1. Na página do carrinho:
   - Chame startCheckoutSession quando usuário adicionar itens

2. Na página de checkout:
   - Chame enterCheckout quando usuário entrar na página
   - Chame selectAddress quando selecionar/preencher endereço
   - Chame selectPaymentMethod quando selecionar pagamento
   - Chame completeCheckout quando finalizar pedido
   - Chame abandonCheckout quando sair sem finalizar

3. Para detecção automática:
   - Use o hook useAbandonmentDetection em componentes globais
   - O sistema do dashboard já marca automaticamente como abandonado

4. Limpeza automática:
   - Sessions são automaticamente marcadas como abandonadas após 30min
   - localStorage é limpo quando checkout é completado ou abandonado
*/ 