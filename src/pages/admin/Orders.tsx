import { useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Filter } from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { OrderDetails } from "@/components/admin/OrderDetails";

type OrderStatus = "pending" | "awaiting_payment" | "preparing" | "completed" | "cancelled";

interface Order {
  id: number;
  number: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
  }>;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
}

// Mock data
const orders: Order[] = [
  {
    id: 1,
    number: "123",
    customerName: "João Silva",
    total: 69.80,
    status: "completed",
    createdAt: "2024-03-01T10:00:00",
    items: [
      { id: 1, name: "Bowl de Salmão", quantity: 1, price: 39.90 },
      { id: 2, name: "Salada Caesar", quantity: 1, price: 29.90 }
    ],
    customer: {
      name: "João Silva",
      phone: "11999999999",
      address: "Rua ABC, 123"
    }
  },
  {
    id: 2,
    number: "122",
    customerName: "João Silva",
    total: 32.90,
    status: "completed",
    createdAt: "2024-02-28T15:30:00",
    items: [
      { id: 3, name: "Frango Grelhado", quantity: 1, price: 32.90 }
    ],
    customer: {
      name: "João Silva",
      phone: "11999999999",
      address: "Rua ABC, 123"
    }
  },
  {
    id: 3,
    number: "121",
    customerName: "João Silva",
    total: 45.90,
    status: "completed",
    createdAt: "2024-02-25T14:20:00",
    items: [
      { id: 4, name: "Poke de Atum", quantity: 1, price: 45.90 }
    ],
    customer: {
      name: "João Silva",
      phone: "11999999999",
      address: "Rua ABC, 123"
    }
  }
];

export default function Orders() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === "all" ? true : order.status === selectedStatus;
    const matchesSearch = searchTerm
      ? order.number.includes(searchTerm) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie os pedidos do seu estabelecimento
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar por número ou cliente..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="w-[180px]">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="awaiting_payment">Aguardando Pagamento</SelectItem>
                <SelectItem value="preparing">Em Preparação</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>#{order.number}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>R$ {order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Pedido #{order.number}</DialogTitle>
                        </DialogHeader>
                        <OrderDetails order={order} />
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
