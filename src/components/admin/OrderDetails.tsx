import { formatPrice, formatFoodChanges } from "@/lib/utils";
import { type Order } from "@/hooks/useAdminOrders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, Printer, MapPin, Package2, Utensils, Coffee } from "lucide-react";

interface OrderDetailsProps {
  order: Order;
  onStatusUpdate?: () => void;
}

export function OrderDetails({ order, onStatusUpdate }: OrderDetailsProps) {
  const formatOrderId = (id: number) => {
    const year = new Date(order.created_at).getFullYear();
    return `PED-${year}-${String(id).padStart(4, '0')}`;
  };

  const getStatusLabel = (status: string) => {
    const statusMap = {
      'pending': 'Pendente',
      'awaiting_payment': 'Aguardando Pagamento',
      'preparing': 'Preparando',
      'completed': 'Concluído',
      'cancelled': 'Cancelado'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'awaiting_payment': 'bg-orange-100 text-orange-800',
      'preparing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleContactClient = () => {
    if (order.user.phone) {
      const cleanPhone = order.user.phone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/55${cleanPhone}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const getItemIcon = (productTitle: string) => {
    const title = productTitle?.toLowerCase() || '';
    if (title.includes('hambúrguer') || title.includes('burger')) {
      return <Package2 className="h-5 w-5 text-orange-600" />;
    }
    if (title.includes('batata')) {
      return <Utensils className="h-5 w-5 text-yellow-600" />;
    }
    if (title.includes('refrigerante') || title.includes('bebida')) {
      return <Coffee className="h-5 w-5 text-blue-600" />;
    }
    return <Utensils className="h-5 w-5 text-gray-600" />;
  };

  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = order.total - subtotal;

  return (
    <div className="space-y-6">
      {/* Header com informações do pedido */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-medium text-gray-700">Pedido # {formatOrderId(order.id)}</span>
          <Badge className={`${getStatusColor(order.status)} border-0`}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Realizado em {new Date(order.created_at).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>

      {/* Cliente e Endereço */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium text-gray-700 mb-3">Cliente</h3>
          <div className="space-y-2">
            <p className="font-medium">{order.user.full_name}</p>
            <p className="text-sm text-gray-600">{order.user.phone}</p>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-700 mb-3">Endereço de Entrega</h3>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{order.address.street}, {order.address.number}</p>
            {order.address.complement && (
              <p className="text-gray-600">{order.address.complement}</p>
            )}
            <p className="text-gray-600">
              {order.address.neighborhood} - {order.address.city}, {order.address.state}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Itens do Pedido */}
      <div>
        <h3 className="font-medium text-gray-700 mb-4">Itens do Pedido</h3>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  {getItemIcon(item.product?.title || '')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {item.product?.title || item.notes || "Produto não disponível"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {item.quantity}x R$ {(item.price).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {item.notes && item.product?.title && (
                    <p className="text-sm text-gray-500 mt-1">
                      {formatFoodChanges(item.notes)}
                    </p>
                  )}
                  {!item.product?.title && item.notes && (
                    <p className="text-sm text-red-500 mt-1">
                      (Produto excluído)
                    </p>
                  )}
                </div>
              </div>
              <span className="font-semibold text-gray-800">
                R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Totais */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between text-sm">
            <span>Taxa de entrega</span>
            <span>R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      <Separator />

      {/* Forma de Pagamento */}
      <div>
        <h3 className="font-medium text-gray-700 mb-2">Forma de pagamento</h3>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
            <span className="text-blue-600 text-xs font-bold">💳</span>
          </div>
          <span className="text-blue-600 font-medium">
            PIX
          </span>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3 pt-4">
        <Button 
          variant="outline" 
          className="flex-1"
          disabled={true}
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
        <Button 
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={handleContactClient}
        >
          <Phone className="mr-2 h-4 w-4" />
          Contatar Cliente
        </Button>
      </div>
    </div>
  );
}
