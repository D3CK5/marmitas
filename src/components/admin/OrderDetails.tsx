
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Phone, MessageSquare } from "lucide-react";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { toast } from "sonner";

interface OrderDetailsProps {
  order: {
    id: number;
    number: string;
    status: string;
    customer: {
      name: string;
      phone: string;
      address: string;
    };
    items: Array<{
      id: number;
      name: string;
      quantity: number;
      price: number;
    }>;
    total: number;
  };
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const [status, setStatus] = useState(order.status);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    // Aqui implementaremos a atualização do status
    toast.success("Status atualizado com sucesso!");
  };

  const handleWhatsAppClick = () => {
    const phone = order.customer.phone.replace(/\D/g, "");
    const message = `Olá ${order.customer.name}, sobre seu pedido #${order.number}...`;
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Status atual</p>
          <OrderStatusBadge status={status as any} />
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Alterar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="awaiting_payment">Aguardando Pagamento</SelectItem>
              <SelectItem value="preparing">Em Preparação</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Informações do Cliente</h3>
        <div className="space-y-2">
          <p>
            <span className="text-muted-foreground">Nome:</span>{" "}
            {order.customer.name}
          </p>
          <p>
            <span className="text-muted-foreground">Telefone:</span>{" "}
            {order.customer.phone}
          </p>
          <p>
            <span className="text-muted-foreground">Endereço:</span>{" "}
            {order.customer.address}
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" onClick={handleWhatsAppClick}>
            <MessageSquare className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
          <Button size="sm" variant="outline">
            <Phone className="mr-2 h-4 w-4" />
            Ligar
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-4">Itens do Pedido</h3>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.quantity}x R$ {item.price.toFixed(2)}
                </p>
              </div>
              <p className="font-medium">
                R$ {(item.quantity * item.price).toFixed(2)}
              </p>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>R$ {order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Histórico</h3>
        <div className="space-y-2">
          <div className="text-sm">
            <p className="text-muted-foreground">14/02/2024 10:00</p>
            <p>Pedido criado</p>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">14/02/2024 10:05</p>
            <p>Status alterado para: Em Preparação</p>
          </div>
        </div>
      </div>
    </div>
  );
}
