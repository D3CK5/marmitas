
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const monthlyData = [
  { month: "Jan", income: 25000, expenses: 15000, profit: 10000 },
  { month: "Fev", income: 28000, expenses: 16000, profit: 12000 },
  { month: "Mar", income: 32000, expenses: 18000, profit: 14000 },
  { month: "Abr", income: 30000, expenses: 17000, profit: 13000 },
  { month: "Mai", income: 35000, expenses: 19000, profit: 16000 },
  { month: "Jun", income: 38000, expenses: 20000, profit: 18000 },
];

const categoryData = [
  { category: "Alimentos", value: 12000 },
  { category: "Bebidas", value: 8000 },
  { category: "Sobremesas", value: 5000 },
  { category: "Delivery", value: 3000 },
];

export function FinancialReports() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Desempenho Mensal</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) =>
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(value)
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#8884d8"
                name="Receitas"
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#82ca9d"
                name="Despesas"
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#ffc658"
                name="Lucro"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Receitas por Categoria</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip
                formatter={(value: number) =>
                  new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(value)
                }
              />
              <Bar dataKey="value" fill="#8884d8" name="Valor" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
