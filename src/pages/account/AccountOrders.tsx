import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import type { Order, OrderItem } from "@/hooks/useProfile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { AccountMenu } from "@/components/account/AccountMenu";

export function AccountOrders() {
  const { orders, isLoading } = useProfile();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Configuração da paginação
  const itemsPerFirstPage = 5;
  const itemsPerPage = 10;

  // Função para calcular o índice inicial e final dos pedidos na página atual
  const getPageSlice = () => {
    if (currentPage === 1) {
      return [0, itemsPerFirstPage];
    }
    const itemsBeforeCurrentPage = itemsPerFirstPage + (currentPage - 2) * itemsPerPage;
    const start = itemsBeforeCurrentPage;
    const end = start + itemsPerPage;
    return [start, end];
  };

  // Calcula o número total de páginas
  const getTotalPages = () => {
    if (orders.length <= itemsPerFirstPage) return 1;
    return Math.ceil((orders.length - itemsPerFirstPage) / itemsPerPage) + 1;
  };

  // Obtém os pedidos da página atual
  const getCurrentPageOrders = () => {
    const [start, end] = getPageSlice();
    return orders.slice(start, end);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <AccountMenu />

      <div>
        <h1 className="text-2xl font-semibold">Meus Pedidos</h1>
        <p className="text-muted-foreground">
          Acompanhe seus pedidos e histórico de compras
        </p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando pedidos...</p>
          </div>
        ) : getCurrentPageOrders().map(order => (
          <Card key={order.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-medium">Pedido #{order.id}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <div className="mt-2">
                    {order.items?.map((item: OrderItem) => (
                      <p key={item.id} className="text-sm">
                        {item.quantity}x {item.product.title}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-lg">
                    {formatPrice(order.total)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsDetailsOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {orders.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Você ainda não fez nenhum pedido
            </p>
          </div>
        )}

        {/* Paginação */}
        {orders.length > itemsPerFirstPage && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="min-w-[2.5rem]"
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === getTotalPages()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Status do Pedido</h3>
                <OrderStatusBadge status={selectedOrder.status} />
              </div>

              <div>
                <h3 className="font-medium mb-2">Itens do Pedido</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: OrderItem) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.quantity}x {item.product.title}
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
                  <span className="font-medium">
                    {formatPrice(selectedOrder.total)}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Informações do Pedido</h3>
                <p className="text-sm">
                  Data: {new Date(selectedOrder.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 