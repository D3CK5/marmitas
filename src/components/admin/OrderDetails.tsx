import { formatPrice } from "@/lib/utils";
import { type Order } from "@/hooks/useAdminOrders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { useAdminOrders } from "@/hooks/useAdminOrders";

interface OrderDetailsProps {
  order: Order;
  onStatusUpdate?: () => void;
}

export function OrderDetails({ order, onStatusUpdate }: OrderDetailsProps) {
  const { updateOrderStatus } = useAdminOrders();

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateOrderStatus.mutateAsync({ orderId: order.id, status: newStatus });
      onStatusUpdate?.();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-2">Informações do Cliente</h3>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Nome:</span> {order.user.full_name}
            </p>
            <p className="text-sm">
              <span className="font-medium">Telefone:</span> {order.user.phone}
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Endereço de Entrega</h3>
          <div className="space-y-1">
            <p className="text-sm">
              {order.address.street}, {order.address.number}
              {order.address.complement && ` - ${order.address.complement}`}
            </p>
            <p className="text-sm">
              {order.address.neighborhood} - {order.address.city}/{order.address.state}
            </p>
            <p className="text-sm">CEP: {order.address.postal_code}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Status do Pedido</h3>
          <div className="w-[180px]">
            <Select defaultValue={order.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue>
                  <OrderStatusBadge status={order.status} />
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <OrderStatusBadge status="pending" />
                </SelectItem>
                <SelectItem value="awaiting_payment">
                  <OrderStatusBadge status="awaiting_payment" />
                </SelectItem>
                <SelectItem value="preparing">
                  <OrderStatusBadge status="preparing" />
                </SelectItem>
                <SelectItem value="completed">
                  <OrderStatusBadge status="completed" />
                </SelectItem>
                <SelectItem value="cancelled">
                  <OrderStatusBadge status="cancelled" />
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2">Itens do Pedido</h3>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>
                {item.quantity}x {item.product?.title || item.notes || "Produto não disponível"}
                {item.notes && item.product?.title && (
                  <span className="text-sm text-muted-foreground block">
                    Obs: {item.notes}
                  </span>
                )}
                {!item.product?.title && item.notes && (
                  <span className="text-sm text-red-500 block">
                    (Produto excluído)
                  </span>
                )}
              </span>
              <span className="font-medium">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between">
          <span className="font-medium">Total</span>
          <span className="font-medium">{formatPrice(order.total)}</span>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2">Informações do Pedido</h3>
        <p className="text-sm">
          Data: {new Date(order.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
}
