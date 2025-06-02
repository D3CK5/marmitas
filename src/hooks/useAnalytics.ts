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
  views: number;
  cart_additions: number;
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
          .is('recovered_at', null)
          .gte('abandoned_at', startDate.toISOString())
          .order('abandoned_at', { ascending: false })
          .limit(20);

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

  // 2. Análise de Produtos (usando dados reais)
  const { data: productAnalytics, isLoading: loadingProducts } = useQuery({
    queryKey: ["product-analytics", period],
    queryFn: async (): Promise<ProductAnalytics[]> => {
      try {
        const { startDate } = getPeriodDates(period);

        // Buscar dados de analytics de produtos
        const { data: analytics, error } = await supabase
          .from('product_analytics')
          .select(`
            product_id,
            views,
            unique_views,
            cart_additions,
            purchases,
            revenue,
            conversion_rate,
            date
          `)
          .gte('date', startDate.toISOString().split('T')[0])
          .order('date', { ascending: false });

        if (error) throw error;

        // Buscar nomes dos produtos
        const productIds = [...new Set(analytics?.map(a => a.product_id) || [])];
        const { data: products } = await supabase
          .from('products')
          .select('id, title')
          .in('id', productIds);

        // Agrupar por produto
        const productMap = new Map();
        analytics?.forEach(item => {
          if (!productMap.has(item.product_id)) {
            productMap.set(item.product_id, {
              product_id: item.product_id,
              total_quantity: 0,
              total_revenue: 0,
              total_views: 0,
              total_cart_additions: 0,
              monthly_data: new Map()
            });
          }
          
          const product = productMap.get(item.product_id);
          product.total_quantity += item.purchases;
          product.total_revenue += Number(item.revenue);
          product.total_views += item.views;
          product.total_cart_additions += item.cart_additions;
          
          // Agrupar por mês
          const month = item.date.substring(0, 7);
          if (!product.monthly_data.has(month)) {
            product.monthly_data.set(month, { quantity: 0, revenue: 0 });
          }
          const monthData = product.monthly_data.get(month);
          monthData.quantity += item.purchases;
          monthData.revenue += Number(item.revenue);
        });

        return Array.from(productMap.values()).map(product => {
          const productInfo = products?.find(p => p.id === product.product_id);
          
          return {
            product_id: product.product_id,
            product_title: productInfo?.title || 'Produto',
            total_quantity: product.total_quantity,
            total_revenue: product.total_revenue,
            views: product.total_views,
            cart_additions: product.total_cart_additions,
            conversion_rate: product.total_views > 0 ? (product.total_quantity / product.total_views) * 100 : 0,
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

  // 3. Análise de Páginas (usando dados reais)
  const { data: pageAnalytics, isLoading: loadingPages } = useQuery({
    queryKey: ["page-analytics", period],
    queryFn: async (): Promise<PageAnalytics[]> => {
      try {
        const { startDate } = getPeriodDates(period);

        const { data: pageViews, error } = await supabase
          .from('page_views')
          .select('page_path, page_title, session_id, timestamp')
          .gte('timestamp', startDate.toISOString())
          .order('timestamp', { ascending: false });

        if (error) throw error;

        // Agrupar por página
        const pageMap = new Map();
        pageViews?.forEach(view => {
          const key = view.page_path;
          if (!pageMap.has(key)) {
            pageMap.set(key, {
              page_path: view.page_path,
              page_title: view.page_title,
              total_views: 0,
              unique_sessions: new Set(),
              timestamps: []
            });
          }
          
          const page = pageMap.get(key);
          page.total_views += 1;
          page.unique_sessions.add(view.session_id);
          page.timestamps.push(new Date(view.timestamp));
        });

        // Calcular métricas
        return Array.from(pageMap.values()).map(page => ({
          page_path: page.page_path,
          page_title: page.page_title,
          total_views: page.total_views,
          unique_visitors: page.unique_sessions.size,
          avg_time_on_page: 180, // Mock - calcular com eventos de time_on_page
          bounce_rate: 0.25, // Mock - calcular baseado em sessões
          conversion_rate: 0.15 // Mock - calcular baseado em conversões
        }));
      } catch (error) {
        console.error('Erro ao buscar análise de páginas:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // 4. Análise Comportamental (usando dados reais)
  const { data: behaviorAnalytics, isLoading: loadingBehavior } = useQuery({
    queryKey: ["behavior-analytics", period],
    queryFn: async (): Promise<BehaviorAnalytics> => {
      try {
        const { startDate } = getPeriodDates(period);

        // Buscar dados de sessões
        const { data: sessions, error } = await supabase
          .from('analytics_sessions')
          .select('*')
          .gte('started_at', startDate.toISOString())
          .order('started_at', { ascending: false });

        if (error) throw error;

        // Calcular métricas comportamentais
        const deviceMap = new Map();
        const sourceMap = new Map();
        let totalDuration = 0;
        let totalPages = 0;

        sessions?.forEach(session => {
          // Dispositivos
          deviceMap.set(session.device_type, (deviceMap.get(session.device_type) || 0) + 1);
          
          // Fontes de tráfego
          const source = session.utm_source || 'direct';
          sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
          
          // Duração e páginas
          totalDuration += session.duration_seconds || 0;
          totalPages += session.pages_visited || 0;
        });

        const totalSessions = sessions?.length || 1;

        // Horários de pico baseados em pedidos
        const { data: orders } = await supabase
          .from('orders')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .eq('status', 'completed')
          .is('deleted_at', null);

        const hourMap = new Map();
        orders?.forEach(order => {
          const hour = new Date(order.created_at).getHours();
          const hourKey = `${hour.toString().padStart(2, '0')}:00`;
          hourMap.set(hourKey, (hourMap.get(hourKey) || 0) + 1);
        });

        const peak_hours = Array.from(hourMap.entries())
          .map(([hour, count]) => ({ hour, order_count: count }))
          .sort((a, b) => b.order_count - a.order_count)
          .slice(0, 8);

        return {
          peak_hours,
          avg_session_duration: Math.round(totalDuration / totalSessions),
          pages_per_session: Math.round((totalPages / totalSessions) * 10) / 10,
          device_breakdown: Array.from(deviceMap.entries()).map(([device, count]) => ({
            device: device.charAt(0).toUpperCase() + device.slice(1),
            count,
            percentage: Math.round((count / totalSessions) * 100)
          })),
          traffic_sources: Array.from(sourceMap.entries()).map(([source, count]) => ({
            source: source.charAt(0).toUpperCase() + source.slice(1),
            count,
            percentage: Math.round((count / totalSessions) * 100)
          }))
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

  // 5. Análise Geográfica (usando dados reais)
  const { data: geographicAnalytics, isLoading: loadingGeographic } = useQuery({
    queryKey: ["geographic-analytics", period],
    queryFn: async (): Promise<GeographicAnalytics[]> => {
      try {
        const { startDate } = getPeriodDates(period);

        // Buscar pedidos por endereço (focando em bairros)
        const { data: orders, error: orderError } = await supabase
          .from('orders')
          .select(`
            total,
            status,
            created_at,
            address:user_addresses!inner(neighborhood, city, state)
          `)
          .gte('created_at', startDate.toISOString())
          .eq('status', 'completed')
          .is('deleted_at', null);

        if (orderError) throw orderError;

        // Agrupar por bairro
        const neighborhoodMap = new Map();
        
        orders?.forEach(order => {
          const neighborhood = order.address.neighborhood;
          const city = order.address.city;
          const regionKey = `${neighborhood} - ${city}`;
          
          if (!neighborhoodMap.has(regionKey)) {
            neighborhoodMap.set(regionKey, {
              region: regionKey,
              order_count: 0,
              revenue: 0,
              delivery_success_rate: 0.95 // Mock - implementar baseado em status de entrega
            });
          }
          
          const regionData = neighborhoodMap.get(regionKey);
          regionData.order_count += 1;
          regionData.revenue += Number(order.total);
        });

        // Buscar dados de sessões por região (manter para completar dados)
        const { data: sessions, error } = await supabase
          .from('analytics_sessions')
          .select('region')
          .gte('started_at', startDate.toISOString())
          .not('region', 'is', null);

        if (error) throw error;

        // Adicionar regiões que aparecem nas sessões mas não têm pedidos
        sessions?.forEach(session => {
          if (!neighborhoodMap.has(session.region)) {
            neighborhoodMap.set(session.region, {
              region: session.region,
              order_count: 0,
              revenue: 0,
              delivery_success_rate: 0.95
            });
          }
        });

        return Array.from(neighborhoodMap.values())
          .map(region => ({
            ...region,
            avg_order_value: region.order_count > 0 ? region.revenue / region.order_count : 0
          }))
          .sort((a, b) => b.order_count - a.order_count) // Ordenar por quantidade de pedidos
          .slice(0, 10); // Top 10 bairros
      } catch (error) {
        console.error('Erro ao buscar análise geográfica:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 15, // 15 minutos
  });

  // 6. Análise de Trocas de Alimentos (mock data por enquanto)
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
          { original_food: "Refrigerante", changed_food: "Suco Natural", change_count: 22, percentage: 11.5 },
        ];
      } catch (error) {
        console.error('Erro ao buscar trocas de alimentos:', error);
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