import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance } from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, Check, X } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function RevenueChart() {
  // Estado para filtros
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [chartPeriod, setChartPeriod] = useState<number>(7); // Período em dias para o gráfico
  const [filters, setFilters] = useState<{ month?: number; year?: number }>({});
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Data atual para botão "Atual"
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Anos disponíveis (últimos 3 anos + ano atual + próximos 2 anos)
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);

  // Para o gráfico, vamos buscar todas as receitas sem filtros de mês/ano
  const { revenues: allRevenues } = useFinance(undefined, undefined, {});
  // Para a tabela, usamos as receitas com filtros
  const { revenues, loadingRevenues } = useFinance(undefined, undefined, filters);

  const applyFilter = () => {
    const newFilters: { month?: number; year?: number } = {};
    
    if (filterMonth !== "all") {
      newFilters.month = parseInt(filterMonth);
    }
    
    if (filterYear !== "all") {
      newFilters.year = parseInt(filterYear);
    }
    
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilterMonth("all");
    setFilterYear("all");
    setFilters({});
  };

  const setCurrentMonthFilter = () => {
    setFilterMonth(currentMonth.toString());
    setFilterYear(currentYear.toString());
    setFilters({ month: currentMonth, year: currentYear });
  };

  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  // Preparar dados para o gráfico baseado no período selecionado
  const getChartData = () => {
    if (!allRevenues) return [];

    const periodDays = Array.from({ length: chartPeriod }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return periodDays.map(date => {
      const dayRevenues = allRevenues.filter(revenue => 
        revenue.created_at.split('T')[0] === date
      );
      
      const total = dayRevenues.reduce((sum, revenue) => sum + Number(revenue.total), 0);
      
      return {
        date: new Date(date).toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit' 
        }),
        value: total,
        count: dayRevenues.length
      };
    });
  };

  const chartData = getChartData();

  if (loadingRevenues) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receitas dos Últimos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Receitas dos Últimos {chartPeriod} Dias</CardTitle>
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
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  formatter={(value: number, name) => [
                    formatCurrency(value),
                    'Receita'
                  ]}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Últimas Receitas</CardTitle>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={Object.keys(filters).length > 0 ? "border-blue-500 text-blue-600" : ""}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {Object.keys(filters).length > 0 && (
              <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {Object.keys(filters).length}
              </span>
            )}
          </Button>
        </CardHeader>

        {showFilters && (
          <CardContent className="border-t bg-muted/20 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-month" className="text-sm font-medium">Mês</Label>
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os meses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os meses</SelectItem>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-year" className="text-sm font-medium">Ano</Label>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os anos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os anos</SelectItem>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 items-end">
                  <Button onClick={applyFilter} size="icon" title="Aplicar filtros">
                    <Check className="h-4 w-4" />
                  </Button>
                  {Object.keys(filters).length > 0 && (
                    <Button variant="outline" onClick={clearFilters} size="icon" title="Limpar filtros">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={setCurrentMonthFilter}
                    title="Filtrar mês atual"
                  >
                    Atual
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pedido #</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues && revenues.length > 0 ? (
                  revenues.slice(0, 10).map((revenue) => (
                    <TableRow key={revenue.id}>
                      <TableCell>
                        {new Date(revenue.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{revenue.user?.full_name || 'Cliente'}</TableCell>
                      <TableCell>#{revenue.id}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(revenue.total))}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {Object.keys(filters).length > 0 
                        ? "📊 Nenhuma receita encontrada para o período selecionado. Tente ajustar os filtros!" 
                        : "💰 Nenhuma receita encontrada."
                      }
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Footer com estatísticas */}
          {revenues && revenues.length > 0 && (
            <div className="border-t px-4 py-3 bg-muted/20 mt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  {revenues.length} receita{revenues.length !== 1 ? 's' : ''}
                  {Object.keys(filters).length > 0 && (
                    <span className="ml-1">
                      (filtrada{revenues.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </span>
                <span className="font-medium text-foreground">
                  Total: {formatCurrency(
                    revenues.reduce((sum, revenue) => sum + Number(revenue.total), 0)
                  )}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 