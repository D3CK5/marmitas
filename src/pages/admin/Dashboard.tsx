
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import {
  DollarSign,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Clock,
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

const data = [
  { name: "Seg", vendas: 4000 },
  { name: "Ter", vendas: 3000 },
  { name: "Qua", vendas: 2000 },
  { name: "Qui", vendas: 2780 },
  { name: "Sex", vendas: 1890 },
  { name: "Sab", vendas: 2390 },
  { name: "Dom", vendas: 3490 },
];

const statsCards = [
  {
    title: "Vendas Hoje",
    value: "R$ 2.540,00",
    description: "+20.1% em relação a ontem",
    icon: DollarSign,
    trend: "up",
  },
  {
    title: "Pedidos Hoje",
    value: "24",
    description: "+12.5% em relação a ontem",
    icon: ShoppingCart,
    trend: "up",
  },
  {
    title: "Ticket Médio",
    value: "R$ 105,83",
    description: "-5.2% em relação a ontem",
    icon: Package,
    trend: "down",
  },
  {
    title: "Tempo Médio",
    value: "45 min",
    description: "Tempo médio de entrega",
    icon: Clock,
    trend: "neutral",
  },
];

export default function Dashboard() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Acompanhe as métricas do seu negócio
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
                  {card.trend === "up" && (
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  )}
                  {card.trend === "down" && (
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Vendas da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis
                    dataKey="name"
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
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="vendas"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Últimos Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">Pedido #{1000 + i}</p>
                      <p className="text-sm text-muted-foreground">
                        João Silva - 2 itens
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R$ 150,00</p>
                      <p className="text-sm text-muted-foreground">
                        Há 30 minutos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-secondary rounded-lg" />
                      <div>
                        <p className="font-medium">Frango Grelhado</p>
                        <p className="text-sm text-muted-foreground">
                          32 vendas hoje
                        </p>
                      </div>
                    </div>
                    <p className="font-medium">R$ 29,90</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
