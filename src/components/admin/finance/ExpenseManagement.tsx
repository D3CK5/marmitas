import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Filter, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance, type Expense } from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CustomAlertDialog } from "@/components/ui/alert-dialog";

const expenseCategories = [
  { value: "fixed", label: "Despesas Fixas" },
  { value: "variable", label: "Despesas Variáveis" },
  { value: "supplies", label: "Suprimentos" },
  { value: "maintenance", label: "Manutenção" },
  { value: "marketing", label: "Marketing" },
  { value: "taxes", label: "Impostos" },
  { value: "other", label: "Outros" },
];

export function ExpenseManagement() {
  // Constantes para data atual
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{ month?: number; year?: number }>({});
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
    variant: "default" as "default" | "destructive"
  });

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split('T')[0],
    recurrence_type: "monthly" as "monthly" | "weekly",
  });

  // Usar o hook com filtro fixo do mês atual quando não há filtros aplicados pelo usuário
  const { 
    expenses, 
    loadingExpenses, 
    createExpense, 
    deleteExpense
  } = useFinance(
    // Se não há filtros aplicados pelo usuário, usar filtro fixo do mês atual
    Object.keys(filters).length > 0 
      ? filters 
      : { month: currentMonth, year: currentYear }, 
    undefined
  );

  // Gerar lista de anos (3 anos anteriores até 1 ano futuro)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i);

  // Função para formatar data sem conversão de timezone
  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return '';
    // Se a data está no formato YYYY-MM-DD, formatar diretamente
    if (dateString.includes('-') && dateString.length >= 10) {
      const [year, month, day] = dateString.split('T')[0].split('-');
      return `${day}/${month}/${year}`;
    }
    return dateString;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createExpense.mutateAsync({
        description: formData.description,
        amount: Number(formData.amount),
        category: formData.category,
        date: formData.date,
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? formData.recurrence_type : undefined,
      });

      setFormData({
        description: "",
        amount: "",
        category: "",
        date: new Date().toISOString().split('T')[0],
        recurrence_type: "monthly",
      });
      setIsRecurring(false);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
    }
  };

  const handleDeleteExpense = (expenseId: number, description: string, sourceType: string) => {
    if (sourceType === 'supply_order') {
      return; // Não permitir excluir pedidos de insumos através da aba de despesas
    }

    setConfirmDialog({
      open: true,
      title: "Excluir Despesa",
      description: `Tem certeza que deseja excluir a despesa "${description}"? Esta ação não pode ser desfeita.`,
      onConfirm: () => {
        deleteExpense.mutate(expenseId);
      },
      variant: "destructive"
    });
  };

  const applyFilter = () => {
    const newFilters: { month?: number; year?: number } = {};
    
    if (filterMonth !== 'all') newFilters.month = parseInt(filterMonth);
    if (filterYear !== 'all') newFilters.year = parseInt(filterYear);
    
    // Se não há filtros, usar undefined para buscar todas as despesas
    if (Object.keys(newFilters).length === 0) {
      setFilters({});
    } else {
      setFilters(newFilters);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setFilterMonth("all");
    setFilterYear("all");
  };

  const getCategoryLabel = (category: string) => {
    return expenseCategories.find(cat => cat.value === category)?.label || category;
  };

  const getRecurrenceLabel = (expense: Expense & { source_type?: string }) => {
    if (expense.source_type === 'supply_order') return "N/A";
    if (!expense.is_recurring) return "Não";
    return expense.recurrence_type === "monthly" ? "Mensal" : "Semanal";
  };

  const getSourceTypeLabel = (sourceType?: string) => {
    if (sourceType === 'supply_order') return "Pedido de Insumo";
    return "Despesa Manual";
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gerenciar Despesas</CardTitle>
          <div className="flex gap-2">
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Despesa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Valor</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="recurring"
                      checked={isRecurring}
                      onCheckedChange={setIsRecurring}
                    />
                    <Label htmlFor="recurring">Despesa Recorrente</Label>
                  </div>

                  {isRecurring && (
                    <div className="space-y-2">
                      <Label htmlFor="recurrence">Tipo de Recorrência</Label>
                      <Select
                        value={formData.recurrence_type}
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          recurrence_type: value as "monthly" | "weekly" 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createExpense.isPending}>
                      {createExpense.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
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
                    onClick={() => {
                      setFilterMonth(currentMonth.toString());
                      setFilterYear(currentYear.toString());
                      setFilters({ month: currentMonth, year: currentYear });
                    }}
                    title="Filtrar pelo mês atual"
                    className="text-xs"
                  >
                    Atual
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}
        
        <CardContent>
          {loadingExpenses ? (
            <div className="space-y-3">
              <div className="rounded-md border">
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Recorrente</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="h-4 bg-muted rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="flex items-center justify-center py-4">
                <p className="text-muted-foreground text-sm">Carregando despesas...</p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 border-b">
                    <TableRow>
                      <TableHead className="font-semibold">Descrição</TableHead>
                      <TableHead className="font-semibold">Categoria</TableHead>
                      <TableHead className="font-semibold">Valor</TableHead>
                      <TableHead className="font-semibold">Data</TableHead>
                      <TableHead className="font-semibold">Recorrente</TableHead>
                      <TableHead className="font-semibold">Origem</TableHead>
                      <TableHead className="font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses && expenses.length > 0 ? (
                      expenses.map((expense) => (
                        <TableRow key={`${expense.source_type || 'expense'}-${expense.id}`}>
                          <TableCell className="font-medium">
                            <div className="max-w-[200px] truncate" title={expense.description}>
                              {expense.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="hover:bg-secondary">
                              {getCategoryLabel(expense.category)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(Number(expense.amount))}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateDisplay(expense.date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={expense.is_recurring ? "default" : "outline"} className={expense.is_recurring ? "hover:bg-primary" : "hover:bg-background"}>
                              {getRecurrenceLabel(expense)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={expense.source_type === 'supply_order' ? "default" : "secondary"}
                              className={expense.source_type === 'supply_order' ? "hover:bg-primary" : "hover:bg-secondary"}
                            >
                              {getSourceTypeLabel(expense.source_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {expense.source_type !== 'supply_order' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteExpense(expense.id, expense.description, expense.source_type || 'expense')}
                                title="Excluir despesa"
                                className="h-7 w-7 text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-4xl">📊</div>
                            <div className="font-medium">
                              {Object.keys(filters).length > 0 
                                ? "Nenhuma despesa encontrada"
                                : "Nenhuma despesa cadastrada"
                              }
                            </div>
                            <div className="text-sm">
                              {Object.keys(filters).length > 0 ? (
                                <div className="space-y-1">
                                  <div>
                                    Período filtrado:{" "}
                                    {filters.month && (
                                      <span className="font-medium">
                                        {months.find(m => m.value === filters.month)?.label}
                                      </span>
                                    )}
                                    {filters.month && filters.year && " de "}
                                    {filters.year && (
                                      <span className="font-medium">
                                        {filters.year}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Tente selecionar um período diferente ou verificar se há despesas cadastradas neste período
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div>Mostrando apenas despesas do mês atual</div>
                                  <div className="text-xs text-muted-foreground">
                                    Use os filtros para ver despesas de outros períodos
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {expenses && expenses.length > 0 && (
                <div className="border-t px-4 py-3 bg-muted/20">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      {expenses.length} despesa{expenses.length !== 1 ? 's' : ''}
                      {Object.keys(filters).length > 0 && (
                        <span className="ml-1">
                          (filtrada{expenses.length !== 1 ? 's' : ''})
                        </span>
                      )}
                    </span>
                    <span className="font-medium text-foreground">
                      Total: {formatCurrency(
                        expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CustomAlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </div>
  );
} 