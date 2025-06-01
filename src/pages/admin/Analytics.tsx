import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3,
  Users,
  ShoppingCart,
  TrendingUp,
  Clock,
  MapPin,
  Eye,
  RefreshCw,
  Calendar,
  Target,
  Zap,
  Heart,
  AlertTriangle,
  Loader2
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";

// Dados mock para demonstração - posteriormente serão substituídos por hooks reais
const mockAbandonedCheckouts = [
  {
    id: 1,
    customer: "João Silva",
    email: "joao@email.com",
    cartValue: 45.90,
    abandonedAt: "2024-01-15T14:30:00Z",
    stage: "Pagamento"
  },
  {
    id: 2,
    customer: "Maria Santos",
    email: "maria@email.com",
    cartValue: 32.50,
    abandonedAt: "2024-01-15T16:45:00Z",
    stage: "Endereço"
  }
];

const mockProductHistory = [
  { month: "Jan", quantity: 150, revenue: 4500 },
  { month: "Fev", quantity: 180, revenue: 5200 },
  { month: "Mar", quantity: 200, revenue: 6000 },
  { month: "Abr", quantity: 165, revenue: 4800 },
  { month: "Mai", quantity: 220, revenue: 6800 }
];

const mockFoodChanges = [
  { original: "Arroz Branco", changed: "Arroz Integral", count: 45 },
  { original: "Feijão Preto", changed: "Feijão Carioca", count: 32 },
  { original: "Carne Bovina", changed: "Frango Grelhado", count: 28 },
  { original: "Batata Frita", changed: "Batata Doce", count: 25 }
];

const mockPageViews = [
  { page: "Marmita Fitness", views: 1250, conversionRate: 12.4 },
  { page: "Marmita Tradicional", views: 980, conversionRate: 8.7 },
  { page: "Marmita Vegana", views: 750, conversionRate: 15.2 },
  { page: "Marmita Low Carb", views: 650, conversionRate: 9.8 }
];

const mockPeakHours = [
  { hour: "11:00", orders: 15 },
  { hour: "12:00", orders: 35 },
  { hour: "13:00", orders: 28 },
  { hour: "18:00", orders: 22 },
  { hour: "19:00", orders: 40 },
  { hour: "20:00", orders: 25 }
];

const mockGeographicData = [
  { neighborhood: "Centro", orders: 120, revenue: 3600 },
  { neighborhood: "Jardins", orders: 95, revenue: 3200 },
  { neighborhood: "Vila Nova", orders: 80, revenue: 2400 },
  { neighborhood: "Barra", orders: 70, revenue: 2100 }
];

const mockCustomerRetention = [
  { period: "1-7 dias", customers: 85, percentage: 34 },
  { period: "8-30 dias", customers: 45, percentage: 18 },
  { period: "31-90 dias", customers: 32, percentage: 13 },
  { period: "90+ dias", customers: 88, percentage: 35 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `Há ${diffHours} horas`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `Há ${diffDays} dias`;
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Análises avançadas e insights do seu negócio
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
                <SelectItem value="1y">1 ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Métricas principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.4%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% desde o mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio no Site</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4m 32s</div>
              <p className="text-xs text-muted-foreground">
                +18s desde a semana passada
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Abandono</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23.8%</div>
              <p className="text-xs text-muted-foreground">
                -3.2% desde o mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Recorrentes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68%</div>
              <p className="text-xs text-muted-foreground">
                +5.1% desde o mês passado
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="abandono" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="abandono">Abandono</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="trocas">Trocas</TabsTrigger>
            <TabsTrigger value="paginas">Páginas</TabsTrigger>
            <TabsTrigger value="comportamento">Comportamento</TabsTrigger>
            <TabsTrigger value="geografia">Geografia</TabsTrigger>
          </TabsList>

          {/* Aba Carrinho Abandonado */}
          <TabsContent value="abandono" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Checkouts Abandonados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAbandonedCheckouts.map((checkout) => (
                      <div key={checkout.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium">{checkout.customer}</p>
                          <p className="text-sm text-muted-foreground">{checkout.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{checkout.stage}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(checkout.abandonedAt)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(checkout.cartValue)}</p>
                          <Button variant="outline" size="sm" className="mt-1">
                            Recuperar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estágios de Abandono</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Carrinho', value: 45 },
                          { name: 'Endereço', value: 30 },
                          { name: 'Pagamento', value: 25 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Produtos */}
          <TabsContent value="produtos" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Histórico de Vendas por Produto</CardTitle>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os produtos</SelectItem>
                    <SelectItem value="marmita-fitness">Marmita Fitness</SelectItem>
                    <SelectItem value="marmita-tradicional">Marmita Tradicional</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockProductHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="quantity" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Trocas de Alimentos */}
          <TabsContent value="trocas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Principais Trocas de Alimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockFoodChanges.map((change, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                          <RefreshCw className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{change.original}</p>
                          <p className="text-sm text-muted-foreground">
                            Trocado por: <span className="text-primary">{change.changed}</span>
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{change.count} trocas</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Páginas Mais Visitadas */}
          <TabsContent value="paginas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Páginas Mais Acessadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPageViews.map((page, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                          <Eye className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{page.page}</p>
                          <p className="text-sm text-muted-foreground">
                            Taxa de conversão: {page.conversionRate}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{page.views.toLocaleString()} visitas</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Comportamento do Usuário */}
          <TabsContent value="comportamento" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Horários de Pico</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={mockPeakHours}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Retenção de Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockCustomerRetention.map((retention, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{retention.period}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${retention.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{retention.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Geografia */}
          <TabsContent value="geografia" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos por Região</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockGeographicData.map((location, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{location.neighborhood}</p>
                          <p className="text-sm text-muted-foreground">
                            {location.orders} pedidos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(location.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
} 