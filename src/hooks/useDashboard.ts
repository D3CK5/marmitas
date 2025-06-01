import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface DashboardStats {
  salesToday: number;
  ordersToday: number;
  avgTicket: number;
  abandonedCarts: number;
}

export interface RecentOrder {
  id: number;
  created_at: string;
  total: number;
  user: {
    full_name: string;
  };
  items: {
    id: number;
    quantity: number;
    product: {
      title: string;
    };
  }[];
}

export interface TopProduct {
  product_id: number;
  product_title: string;
  quantity_sold: number;
  total_revenue: number;
  avg_price: number;
  image_url?: string;
}

export function useDashboard() {
  // Stats do dia atual
  const { data: dashboardStats, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        // Data de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Buscar pedidos de hoje
        const { data: todayOrders, error: ordersError } = await supabase
          .from('orders')
          .select('total, status')
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .is('deleted_at', null);

        if (ordersError) throw ordersError;

        // Buscar carrinhos REALMENTE abandonados
        // Critério: Sessões que entraram no checkout, selecionaram endereço, 
        // mas não finalizaram em 30 minutos
        const thirtyMinutesAgo = new Date();
        thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

        const { data: abandonedSessions, error: abandonedError } = await supabase
          .from('checkout_sessions')
          .select('id, user_id, cart_items, total_value, checkout_entered_at, address_selected_at')
          .not('checkout_entered_at', 'is', null) // Deve ter entrado no checkout
          .not('address_selected_at', 'is', null) // Deve ter selecionado endereço
          .is('completed_at', null) // Não deve ter completado
          .is('abandoned_at', null) // Não deve estar marcado como abandonado
          .lt('address_selected_at', thirtyMinutesAgo.toISOString()); // Mais de 30 min desde seleção do endereço

        if (abandonedError) throw abandonedError;

        // Marcar sessões como abandonadas automaticamente
        if (abandonedSessions && abandonedSessions.length > 0) {
          const abandonedIds = abandonedSessions.map(session => session.id);
          await supabase
            .from('checkout_sessions')
            .update({ abandoned_at: new Date().toISOString() })
            .in('id', abandonedIds);
        }

        // Calcular estatísticas
        const ordersToday = todayOrders?.length || 0;
        const salesToday = todayOrders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
        const avgTicket = ordersToday > 0 ? salesToday / ordersToday : 0;
        const abandonedCarts = abandonedSessions?.length || 0;

        return {
          salesToday,
          ordersToday,
          avgTicket,
          abandonedCarts,
        };
      } catch (error) {
        console.error('Erro ao buscar estatísticas do dashboard:', error);
        return {
          salesToday: 0,
          ordersToday: 0,
          avgTicket: 0,
          abandonedCarts: 0,
        };
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchInterval: 1000 * 60 * 2, // Atualizar a cada 2 minutos
  });

  // Últimos 3 pedidos
  const { data: recentOrders, isLoading: loadingRecentOrders } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: async (): Promise<RecentOrder[]> => {
      try {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            total,
            user_id
          `)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(3);

        if (ordersError) throw ordersError;

        if (!orders || orders.length === 0) {
          return [];
        }

        // Buscar dados dos usuários
        const userIds = orders.map(order => order.user_id);
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        if (usersError) throw usersError;

        // Buscar itens dos pedidos
        const orderIds = orders.map(order => order.id);
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            id,
            order_id,
            quantity,
            product:products!inner(title)
          `)
          .in('order_id', orderIds);

        if (itemsError) throw itemsError;

        // Combinar dados
        return orders.map(order => {
          const user = users?.find(u => u.id === order.user_id);
          const items = orderItems?.filter(item => item.order_id === order.id) || [];
          
          return {
            ...order,
            user: user || { full_name: 'Cliente' },
            items: items.map(item => ({
              id: item.id,
              quantity: item.quantity,
              product: item.product
            }))
          };
        });
      } catch (error) {
        console.error('Erro ao buscar pedidos recentes:', error);
        return [];
      }
    },
    staleTime: 1000 * 60, // 1 minuto
    refetchInterval: 1000 * 60, // Atualizar a cada minuto
  });

  // Top 3 produtos mais vendidos do mês
  const { data: topProducts, isLoading: loadingTopProducts } = useQuery({
    queryKey: ["top-products"],
    queryFn: async (): Promise<TopProduct[]> => {
      try {
        // Primeiro dia do mês atual
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Buscar itens de pedidos do mês atual
        const { data: orderItems, error } = await supabase
          .from('order_items')
          .select(`
            product_id,
            quantity,
            price,
            order:orders!inner(created_at, status)
          `)
          .gte('order.created_at', startOfMonth.toISOString())
          .eq('order.status', 'completed')
          .is('order.deleted_at', null);

        if (error) throw error;

        if (!orderItems || orderItems.length === 0) {
          return [];
        }

        // Agrupar por produto
        const productStats = orderItems.reduce((acc, item) => {
          const productId = item.product_id;
          if (!acc[productId]) {
            acc[productId] = {
              product_id: productId,
              quantity_sold: 0,
              total_revenue: 0,
            };
          }
          acc[productId].quantity_sold += item.quantity;
          acc[productId].total_revenue += item.quantity * Number(item.price);
          return acc;
        }, {} as Record<number, { product_id: number; quantity_sold: number; total_revenue: number }>);

        // Buscar nomes e imagens dos produtos
        const productIds = Object.keys(productStats).map(id => parseInt(id));
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, title, images')
          .in('id', productIds);

        if (productsError) throw productsError;

        // Combinar dados e ordenar
        const topProducts = Object.values(productStats)
          .map((stat: { product_id: number; quantity_sold: number; total_revenue: number }) => {
            const product = products?.find(p => p.id === stat.product_id);
            // Extrair primeira imagem do array se existir
            const firstImage = product?.images && product.images.length > 0 ? product.images[0] : undefined;
            
            return {
              ...stat,
              product_title: product?.title || 'Produto',
              image_url: firstImage,
              avg_price: stat.total_revenue / stat.quantity_sold,
            };
          })
          .sort((a, b) => b.quantity_sold - a.quantity_sold)
          .slice(0, 3);

        return topProducts;
      } catch (error) {
        console.error('Erro ao buscar produtos mais vendidos:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 1000 * 60 * 5, // Atualizar a cada 5 minutos
  });

  // Dados para gráfico de vendas (últimos 7 dias por padrão)
  const getChartData = (period: number = 7) => {
    return useQuery({
      queryKey: ["chart-data", period],
      queryFn: async () => {
        try {
          const periodDays = Array.from({ length: period }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
          }).reverse();

          const { data: orders, error } = await supabase
            .from('orders')
            .select('total, created_at, status')
            .eq('status', 'completed')
            .gte('created_at', new Date(periodDays[0]).toISOString())
            .is('deleted_at', null);

          if (error) throw error;

          return periodDays.map(date => {
            const dayOrders = orders?.filter(order => 
              order.created_at.split('T')[0] === date
            ) || [];
            
            const total = dayOrders.reduce((sum, order) => sum + Number(order.total), 0);
            
            return {
              date: new Date(date).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit' 
              }),
              vendas: total,
              count: dayOrders.length
            };
          });
        } catch (error) {
          console.error('Erro ao buscar dados do gráfico:', error);
          return [];
        }
      },
      staleTime: 1000 * 60 * 2, // 2 minutos
    });
  };

  return {
    dashboardStats,
    recentOrders,
    topProducts,
    loadingStats,
    loadingRecentOrders,
    loadingTopProducts,
    getChartData
  };
} 