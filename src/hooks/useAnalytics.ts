import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AbandonedCheckout {
  id: string;
  customer_name: string;
  customer_email: string;
  cart_value: number;
  abandoned_at: string;
  stage: string;
  cart_items: any[];
}

export interface ProductAnalytics {
  product_id: number;
  product_title: string;
  monthly_sales: { month: string; quantity: number; revenue: number }[];
  total_quantity: number;
  total_revenue: number;
  conversion_rate: number;
}

export interface FoodChange {
  original_food: string;
  changed_food: string;
  change_count: number;
  percentage: number;
}

export interface PageAnalytics {
  page_path: string;
  page_title: string;
  total_views: number;
  unique_visitors: number;
  avg_time_on_page: number;
  bounce_rate: number;
  conversion_rate: number;
}

export interface BehaviorAnalytics {
  peak_hours: { hour: string; order_count: number }[];
  avg_session_duration: number;
  pages_per_session: number;
  device_breakdown: { device: string; count: number; percentage: number }[];
  traffic_sources: { source: string; count: number; percentage: number }[];
}

export interface GeographicAnalytics {
  region: string;
  order_count: number;
  revenue: number;
  avg_order_value: number;
  delivery_success_rate: number;
}

export interface CustomerAnalytics {
  retention_cohorts: {
    period: string;
    customers: number;
    percentage: number;
  }[];
  churn_rate: number;
  lifetime_value: number;
  repeat_purchase_rate: number;
  customer_segments: {
    segment: string;
    count: number;
    avg_order_value: number;
    frequency: number;
  }[];
}

export function useAnalytics(period: string = "30d") {
  // Função helper para calcular datas
  const getPeriodDates = (period: string) => {
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    return { startDate, endDate: now };
  };

  // 1. Checkouts Abandonados
  const { data: abandonedCheckouts, isLoading: loadingAbandoned } = useQuery({
    queryKey: ["abandoned-checkouts", period],
    queryFn: async (): Promise<AbandonedCheckout[]> => {
      try {
        const { startDate } = getPeriodDates(period);
        
        const { data: sessions, error } = await supabase
          .from('checkout_sessions')
          .select(`
            id,
            user_id,
            cart_items,
            total_value,
            abandoned_at,
            checkout_entered_at,
            address_selected_at,
            payment_method_selected_at,
            recovered_at
          `)
          .not('abandoned_at', 'is', null)
          .not('payment_method_selected_at', 'is', null)
          .is('recovered_at', null)
          .gte('abandoned_at', startDate.toISOString())
          .order('abandoned_at', { ascending: false });

        if (error) throw error;

        if (!sessions) return [];

        // Buscar dados dos usuários
        const userIds = sessions.map(s => s.user_id);
        const { data: users } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        return sessions.map(session => {
          const user = users?.find(u => u.id === session.user_id);
          let stage = "Carrinho";
          
          if (session.payment_method_selected_at) stage = "Pagamento";
          else if (session.address_selected_at) stage = "Endereço";
          else if (session.checkout_entered_at) stage = "Checkout";

          return {
            id: session.id,
            customer_name: user?.full_name || 'Cliente',
            customer_email: user?.email || '',
            cart_value: Number(session.total_value) || 0,
            abandoned_at: session.abandoned_at,
            stage,
            cart_items: session.cart_items || []
          };
        });
      } catch (error) {
        console.error('Erro ao buscar checkouts abandonados:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // 2. Análise de Produtos
  const { data: productAnalytics, isLoading: loadingProducts } = useQuery({
    queryKey: ["product-analytics", period],
    queryFn: async (): Promise<ProductAnalytics[]> => {
      try {
        const { startDate } = getPeriodDates(period);

        // Buscar vendas de produtos no período
        const { data: orderItems, error } = await supabase
          .from('order_items')
          .select(`
            product_id,
            quantity,
            price,
            order:orders!inner(created_at, status)
          `)
          .gte('order.created_at', startDate.toISOString())
          .eq('order.status', 'completed')
          .is('order.deleted_at', null);

        if (error) throw error;

        // Agrupar por produto
        const productMap = new Map();
        orderItems?.forEach(item => {
          if (!productMap.has(item.product_id)) {
            productMap.set(item.product_id, {
              product_id: item.product_id,
              total_quantity: 0,
              total_revenue: 0,
              monthly_data: new Map()
            });
          }
          
          const product = productMap.get(item.product_id);
          product.total_quantity += item.quantity;
          product.total_revenue += item.quantity * Number(item.price);
          
          // Agrupar por mês
          const month = new Date(item.order.created_at).toISOString().substring(0, 7);
          if (!product.monthly_data.has(month)) {
            product.monthly_data.set(month, { quantity: 0, revenue: 0 });
          }
          const monthData = product.monthly_data.get(month);
          monthData.quantity += item.quantity;
          monthData.revenue += item.quantity * Number(item.price);
        });

        // Buscar nomes dos produtos
        const productIds = Array.from(productMap.keys());
        const { data: products } = await supabase
          .from('products')
          .select('id, title')
          .in('id', productIds);

        return Array.from(productMap.values()).map(product => {
          const productInfo = products?.find(p => p.id === product.product_id);
          
          return {
            product_id: product.product_id,
            product_title: productInfo?.title || 'Produto',
            total_quantity: product.total_quantity,
            total_revenue: product.total_revenue,
            conversion_rate: Math.random() * 20 + 5, // Mock - implementar cálculo real
            monthly_sales: Array.from(product.monthly_data.entries()).map(([month, data]) => ({
              month,
              quantity: data.quantity,
              revenue: data.revenue
            }))
          };
        });
      } catch (error) {
        console.error('Erro ao buscar análise de produtos:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // 3. Análise de Trocas de Alimentos
  const { data: foodChanges, isLoading: loadingFoodChanges } = useQuery({
    queryKey: ["food-changes", period],
    queryFn: async (): Promise<FoodChange[]> => {
      try {
        // Mock data - implementar quando sistema de trocas estiver completo
        return [
          { original_food: "Arroz Branco", changed_food: "Arroz Integral", change_count: 45, percentage: 23.5 },
          { original_food: "Feijão Preto", changed_food: "Feijão Carioca", change_count: 32, percentage: 16.7 },
          { original_food: "Carne Bovina", changed_food: "Frango Grelhado", change_count: 28, percentage: 14.6 },
          { original_food: "Batata Frita", changed_food: "Batata Doce", change_count: 25, percentage: 13.0 },
        ];
      } catch (error) {
        console.error('Erro ao buscar trocas de alimentos:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 15, // 15 minutos
  });

  // 4. Análise de Páginas (Mock - implementar com tabela real)
  const { data: pageAnalytics, isLoading: loadingPages } = useQuery({
    queryKey: ["page-analytics", period],
    queryFn: async (): Promise<PageAnalytics[]> => {
      try {
        // Mock data - implementar quando tabela page_views estiver criada
        return [
          {
            page_path: "/produto/marmita-fitness",
            page_title: "Marmita Fitness",
            total_views: 1250,
            unique_visitors: 890,
            avg_time_on_page: 180,
            bounce_rate: 0.25,
            conversion_rate: 0.124
          },
          {
            page_path: "/produto/marmita-tradicional",
            page_title: "Marmita Tradicional",
            total_views: 980,
            unique_visitors: 720,
            avg_time_on_page: 165,
            bounce_rate: 0.30,
            conversion_rate: 0.087
          }
        ];
      } catch (error) {
        console.error('Erro ao buscar análise de páginas:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // 5. Análise Comportamental
  const { data: behaviorAnalytics, isLoading: loadingBehavior } = useQuery({
    queryKey: ["behavior-analytics", period],
    queryFn: async (): Promise<BehaviorAnalytics> => {
      try {
        const { startDate } = getPeriodDates(period);

        // Buscar horários de pico baseados em pedidos
        const { data: orders, error } = await supabase
          .from('orders')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .eq('status', 'completed')
          .is('deleted_at', null);

        if (error) throw error;

        // Agrupar por hora
        const hourMap = new Map();
        orders?.forEach(order => {
          const hour = new Date(order.created_at).getHours();
          const hourKey = `${hour.toString().padStart(2, '0')}:00`;
          hourMap.set(hourKey, (hourMap.get(hourKey) || 0) + 1);
        });

        const peak_hours = Array.from(hourMap.entries())
          .map(([hour, count]) => ({ hour, order_count: count }))
          .sort((a, b) => b.order_count - a.order_count)
          .slice(0, 6);

        return {
          peak_hours,
          avg_session_duration: 272, // Mock - implementar com tracking real
          pages_per_session: 3.4, // Mock
          device_breakdown: [
            { device: "Mobile", count: 720, percentage: 65 },
            { device: "Desktop", count: 280, percentage: 25 },
            { device: "Tablet", count: 110, percentage: 10 }
          ],
          traffic_sources: [
            { source: "Direto", count: 450, percentage: 40 },
            { source: "Google", count: 340, percentage: 30 },
            { source: "Instagram", count: 230, percentage: 20 },
            { source: "Facebook", count: 110, percentage: 10 }
          ]
        };
      } catch (error) {
        console.error('Erro ao buscar análise comportamental:', error);
        return {
          peak_hours: [],
          avg_session_duration: 0,
          pages_per_session: 0,
          device_breakdown: [],
          traffic_sources: []
        };
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // 6. Análise Geográfica
  const { data: geographicAnalytics, isLoading: loadingGeographic } = useQuery({
    queryKey: ["geographic-analytics", period],
    queryFn: async (): Promise<GeographicAnalytics[]> => {
      try {
        const { startDate } = getPeriodDates(period);

        const { data: orders, error } = await supabase
          .from('orders')
          .select(`
            total,
            status,
            address:user_addresses!inner(neighborhood, city)
          `)
          .gte('created_at', startDate.toISOString())
          .eq('status', 'completed')
          .is('deleted_at', null);

        if (error) throw error;

        // Agrupar por bairro
        const regionMap = new Map();
        orders?.forEach(order => {
          const region = order.address.neighborhood || order.address.city;
          if (!regionMap.has(region)) {
            regionMap.set(region, {
              region,
              order_count: 0,
              revenue: 0,
              delivery_success_rate: 0.95 // Mock
            });
          }
          
          const regionData = regionMap.get(region);
          regionData.order_count += 1;
          regionData.revenue += Number(order.total);
        });

        return Array.from(regionMap.values()).map(region => ({
          ...region,
          avg_order_value: region.revenue / region.order_count
        }));
      } catch (error) {
        console.error('Erro ao buscar análise geográfica:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 15, // 15 minutos
  });

  return {
    abandonedCheckouts,
    productAnalytics,
    foodChanges,
    pageAnalytics,
    behaviorAnalytics,
    geographicAnalytics,
    loading: {
      abandoned: loadingAbandoned,
      products: loadingProducts,
      foodChanges: loadingFoodChanges,
      pages: loadingPages,
      behavior: loadingBehavior,
      geographic: loadingGeographic
    }
  };
} 