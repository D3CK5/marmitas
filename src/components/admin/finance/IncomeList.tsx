
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Income {
  id: number;
  source: string;
  amount: number;
  category: string;
  date: string;
  status: "completed" | "pending" | "cancelled";
  orderNumber?: string;
}

const incomes: Income[] = [
  {
    id: 1,
    source: "Pedido #001",
    amount: 150.00,
    category: "Vendas",
    date: "2024-02-14",
    status: "completed",
    orderNumber: "001"
  },
  // ... mais receitas
];

const statusConfig = {
  completed: {
    label: "Concluído",
    variant: "default" as const,
  },
  pending: {
    label: "Pendente",
    variant: "secondary" as const,
  },
  cancelled: {
    label: "Cancelado",
    variant: "destructive" as const,
  },
};

export function IncomeList() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Receitas</h2>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Origem</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incomes.map((income) => (
              <TableRow key={income.id}>
                <TableCell>{income.source}</TableCell>
                <TableCell>{income.category}</TableCell>
                <TableCell>R$ {income.amount.toFixed(2)}</TableCell>
                <TableCell>
                  {new Date(income.date).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[income.status].variant}>
                    {statusConfig[income.status].label}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
