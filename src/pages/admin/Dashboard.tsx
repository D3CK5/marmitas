import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDashboard } from "@/hooks/useDashboard";
import { formatPrice } from "@/lib/utils";

export default function Dashboard() {
  const [chartPeriod, setChartPeriod] = useState<number>(7);
  
  const { 
    dashboardStats, 
    recentOrders, 
    topProducts, 
    loadingStats, 
    loadingRecentOrders, 
    loadingTopProducts,
    getChartData 
  } = useDashboard();

  // Buscar dados do gráfico baseado no período selecionado
  const { data: chartData, isLoading: loadingChart } = getChartData(chartPeriod);

  const statsCards = [
    {
      title: "Vendas Hoje",
      value: loadingStats ? "..." : formatPrice(dashboardStats?.salesToday || 0),
      description: "Total de vendas realizadas hoje",
      icon: DollarSign,
      trend: "neutral" as const,
    },
    {
      title: "Pedidos Hoje",
      value: loadingStats ? "..." : dashboardStats?.ordersToday?.toString() || "0",
      description: "Quantidade de pedidos feitos hoje",
      icon: ShoppingCart,
      trend: "neutral" as const,
    },
    {
      title: "Ticket Médio",
      value: loadingStats ? "..." : formatPrice(dashboardStats?.avgTicket || 0),
      description: "Valor médio por pedido hoje",
      icon: Package,
      trend: "neutral" as const,
    },
    {
      title: "Checkout Abandonado",
      value: loadingStats ? "..." : dashboardStats?.abandonedCarts?.toString() || "0",
      description: "Abandonos do mês não recuperados",
      icon: ShoppingBag,
      trend: "neutral" as const,
    },
  ];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `Há ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffMinutes < 1440) { // 24 horas
      const hours = Math.floor(diffMinutes / 60);
      return `Há ${hours} hora${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `Há ${days} dia${days !== 1 ? 's' : ''}`;
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Acompanhe as métricas do seu negócio em tempo real
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Vendas dos Últimos {chartPeriod} Dias</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={chartPeriod === 7 ? "default" : "outline"}
                size="sm"
                onClick={() => setChartPeriod(7)}
              >
                7 dias
              </Button>
              <Button
                variant={chartPeriod === 15 ? "default" : "outline"}
                size="sm"
                onClick={() => setChartPeriod(15)}
              >
                15 dias
              </Button>
              <Button
                variant={chartPeriod === 30 ? "default" : "outline"}
                size="sm"
                onClick={() => setChartPeriod(30)}
              >
                30 dias
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loadingChart ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <Tooltip
                      formatter={(value: number) => [formatPrice(value), 'Vendas']}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="vendas"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Últimos Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRecentOrders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : recentOrders && recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">Pedido #{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.user.full_name} - {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1">
                          {order.items.slice(0, 2).map((item, index) => (
                            <span key={item.id}>
                              {index > 0 && ', '}
                              {item.quantity}x {item.product.title}
                            </span>
                          ))}
                          {order.items.length > 2 && ` +${order.items.length - 2} mais`}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(order.total)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(order.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pedido encontrado
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTopProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : topProducts && topProducts.length > 0 ? (
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div
                      key={product.product_id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.product_title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback para quando a imagem não carrega
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = `
                                  <div class="w-full h-full bg-secondary rounded-lg flex items-center justify-center">
                                    <span class="text-sm font-medium text-muted-foreground">${index + 1}°</span>
                                  </div>
                                `;
                              }}
                            />
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground">
                              {index + 1}°
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.product_title}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.quantity_sold} vendas este mês
                          </p>
                        </div>
                      </div>
                      <p className="font-medium">{formatPrice(product.avg_price)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto vendido este mês
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
