import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, formatFoodChanges } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import type { Order, OrderItem } from "@/hooks/useProfile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Package,
  Receipt,
  MapPin,
  Clock,
  User,
  CreditCard,
  Truck,
  RefreshCw,
  AlertTriangle,
  ShoppingCart,
  X
} from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { AccountMenu } from "@/components/account/AccountMenu";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PaymentMethodConfig {
  title: string;
  enabled: boolean;
  description?: string;
}

interface PaymentMethodsConfig {
  [key: string]: PaymentMethodConfig;
}

export function AccountOrders() {
  const { orders, isLoading } = useProfile();
  const { addItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isReorderLoading, setIsReorderLoading] = useState(false);
  const [outOfStockItems, setOutOfStockItems] = useState<OrderItem[]>([]);
  const [isStockAlertOpen, setIsStockAlertOpen] = useState(false);
  const [availableItems, setAvailableItems] = useState<OrderItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentItems, setPaymentItems] = useState<OrderItem[]>([]);
  const [reorderAddress, setReorderAddress] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>([]);

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

  const formatOrderDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodText = (method: string) => {
    // Primeiro, tenta buscar nas configurações carregadas
    const configMethod = availablePaymentMethods.find(m => m.value === method);
    if (configMethod) {
      return configMethod.label;
    }

    // Fallback para métodos padrão
    const methods = {
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'cash': 'Dinheiro',
      'food_voucher': 'Vale Alimentação'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const handleReorder = async (order: Order) => {
    if (!order.items || order.items.length === 0) {
      toast.error("Este pedido não possui itens válidos para refazer.");
      return;
    }

    setIsReorderLoading(true);

    try {
      // Verificar estoque dos produtos
      const stockChecks = await Promise.all(
        order.items.map(async (item) => {
          if (!item.product_id) return { item, available: false, stock: 0 };
          
          const { data: product, error } = await supabase
            .from('products')
            .select('id, stock, is_active')
            .eq('id', item.product_id)
            .single();

          if (error || !product || !product.is_active) {
            return { item, available: false, stock: 0 };
          }

          return { 
            item, 
            available: product.stock >= item.quantity, 
            stock: product.stock 
          };
        })
      );

      const available = stockChecks.filter(check => check.available).map(check => check.item);
      const outOfStock = stockChecks.filter(check => !check.available).map(check => check.item);

      if (outOfStock.length > 0) {
        setAvailableItems(available);
        setOutOfStockItems(outOfStock);
        setIsStockAlertOpen(true);
        setIsReorderLoading(false);
        return;
      }

      // Todos os itens estão disponíveis, adicionar ao carrinho
      await addItemsToCart(available);
      
    } catch (error) {
      console.error('Erro ao verificar estoque:', error);
      toast.error("Erro ao verificar disponibilidade dos produtos.");
    } finally {
      setIsReorderLoading(false);
    }
  };

  const addItemsToCart = async (items: OrderItem[]) => {
    try {
      // Não limpar carrinho nem navegar, apenas preparar para pagamento
      setPaymentItems(items);
      setReorderAddress(selectedOrder?.delivery_address);
      
      // Buscar métodos de pagamento disponíveis
      await fetchPaymentMethods();
      
      setIsPaymentModalOpen(true);
      
      toast.success(`${items.length} ${items.length === 1 ? 'item selecionado' : 'itens selecionados'} para novo pedido!`);
    } catch (error) {
      console.error('Erro ao preparar itens:', error);
      toast.error("Erro ao preparar itens.");
    }
  };

  const handleProceedWithAvailable = async () => {
    setIsStockAlertOpen(false);
    await addItemsToCart(availableItems);
  };

  const handleCancelReorder = () => {
    setIsStockAlertOpen(false);
    setAvailableItems([]);
    setOutOfStockItems([]);
  };

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error("Selecione um método de pagamento");
      return;
    }

    if (!reorderAddress || !paymentItems.length) {
      toast.error("Dados insuficientes para processar o pedido");
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Calcular valores
      const subtotal = paymentItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Buscar taxa de entrega baseada no endereço
      const { data: deliveryArea } = await supabase
        .from('delivery_areas')
        .select('price')
        .eq('city', reorderAddress.city)
        .eq('neighborhood', reorderAddress.neighborhood)
        .eq('is_active', true)
        .single();

      const deliveryFee = deliveryArea?.price || 10; // Taxa padrão se não encontrar
      const total = subtotal + deliveryFee;

      // Criar o pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: selectedOrder?.user_id,
          address_id: reorderAddress.id,
          payment_method: selectedPaymentMethod,
          subtotal,
          delivery_fee: deliveryFee,
          total,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Criar os itens do pedido
      const orderItems = paymentItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Sucesso!
      toast.success("Pedido realizado com sucesso!");
      setIsPaymentModalOpen(false);
      setSelectedPaymentMethod('');
      setPaymentItems([]);
      setReorderAddress(null);
      
      // Fechar modal de detalhes também
      setIsDetailsOpen(false);

    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error("Erro ao processar o pedido. Tente novamente.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Buscar métodos de pagamento das configurações
  const fetchPaymentMethods = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'payment_methods')
        .single();

      if (!error && settings?.value) {
        const methods = [];
        const paymentConfig = settings.value as PaymentMethodsConfig;

        // Mapear configurações para formato do componente
        const methodsMap = {
          pix: { icon: '💸', color: 'text-green-600' },
          credit_card: { icon: '💳', color: 'text-blue-600' },
          debit_card: { icon: '💳', color: 'text-blue-500' },
          cash: { icon: '💵', color: 'text-green-500' },
          food_voucher: { icon: '🎫', color: 'text-orange-500' },
        };

        for (const [key, config] of Object.entries(paymentConfig)) {
          if (config.enabled) {
            methods.push({
              value: key,
              label: config.title,
              description: config.description || '',
              icon: methodsMap[key as keyof typeof methodsMap]?.icon || '💳',
              color: methodsMap[key as keyof typeof methodsMap]?.color || 'text-gray-600'
            });
          }
        }

        setAvailablePaymentMethods(methods);
      }
    } catch (error) {
      console.error('Erro ao buscar métodos de pagamento:', error);
      // Fallback para métodos padrão se houver erro
      setAvailablePaymentMethods([
        { value: 'pix', label: 'PIX', icon: '💸', color: 'text-green-600' },
        { value: 'credit_card', label: 'Cartão de Crédito', icon: '💳', color: 'text-blue-600' },
      ]);
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
      <AccountMenu />

      <div className="px-2 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-semibold">Meus Pedidos</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Acompanhe seus pedidos e histórico de compras
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-sm sm:text-base text-muted-foreground">Carregando pedidos...</p>
          </div>
        ) : getCurrentPageOrders().map(order => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <p className="font-medium text-sm sm:text-base">Pedido #{order.id}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-2">
                    {formatOrderDate(order.created_at)}
                  </p>
                  <div className="space-y-1">
                    {order.items?.slice(0, 3).map((item: OrderItem, index) => (
                      <p key={item.id} className="text-xs sm:text-sm text-muted-foreground">
                        {item.quantity}x {item.product.title}
                      </p>
                    ))}
                    {order.items && order.items.length > 3 && (
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        +{order.items.length - 3} {order.items.length - 3 === 1 ? 'item' : 'itens'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-3 sm:text-right flex-shrink-0">
                  <p className="font-medium text-lg sm:text-xl text-primary">
                    {formatPrice(order.total)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
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
          <div className="text-center py-8 lg:py-12">
            <p className="text-sm sm:text-base text-muted-foreground">
              Você ainda não fez nenhum pedido
            </p>
          </div>
        )}

        {/* Paginação */}
        {orders.length > itemsPerFirstPage && (
          <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 mt-6 px-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 sm:px-3"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Anterior</span>
            </Button>
            
            {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="min-w-[2rem] sm:min-w-[2.5rem]"
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === getTotalPages()}
              className="px-2 sm:px-3"
            >
              <span className="hidden sm:inline mr-1">Próximo</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Detalhes Melhorado */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-4 sm:p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-xl font-bold truncate">
                  Detalhes do Pedido #{selectedOrder?.id}
                </DialogTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Informações completas do seu pedido
                </p>
              </div>
            </div>
          </DialogHeader>

          {selectedOrder && (
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Status Card */}
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <h3 className="font-semibold text-base sm:text-lg">Status do Pedido</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                    <OrderStatusBadge status={selectedOrder.status} />
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">
                        {(() => {
                          const createdAt = new Date(selectedOrder.created_at);
                          const statusChangedAt = selectedOrder.status_changed_at 
                            ? new Date(selectedOrder.status_changed_at) 
                            : createdAt;
                          
                          // Se o status foi alterado (diferença maior que 10 segundos)
                          if (statusChangedAt.getTime() - createdAt.getTime() > 10000) {
                            if (selectedOrder.status === 'completed' && selectedOrder.completed_at) {
                              return `Concluído em ${formatOrderDate(selectedOrder.completed_at)}`;
                            } else {
                              return `Atualizado em ${formatOrderDate(selectedOrder.status_changed_at!)}`;
                            }
                          } else {
                            // Se não foi atualizado, mostra data de criação
                            return `Criado em ${formatOrderDate(selectedOrder.created_at)}`;
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Grid */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      <h3 className="font-semibold text-base sm:text-lg">Itens do Pedido</h3>
                    </div>
                    <Badge variant="secondary" className="self-start sm:ml-auto">
                      {selectedOrder.items?.length || 0} {selectedOrder.items?.length === 1 ? 'item' : 'itens'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item: OrderItem) => (
                      <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative flex-shrink-0">
                              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg overflow-hidden">
                                {item.product.image_url ? (
                                  <img
                                    src={item.product.image_url}
                                    alt={item.product.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Fallback para quando a imagem não carrega
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `
                                          <div class="w-full h-full bg-primary/10 flex items-center justify-center">
                                            <svg class="w-4 h-4 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"></path>
                                            </svg>
                                          </div>
                                        `;
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                    <Package className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                                  </div>
                                )}
                              </div>
                              {/* Badge de quantidade - FORA da imagem */}
                              <div className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 w-5 h-5 sm:w-6 sm:h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10">
                                {item.quantity}
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm sm:text-base break-words">
                                {item.product.title}
                              </h4>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {formatPrice(item.price)} cada
                              </p>
                              {item.notes && (
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                  {formatFoodChanges(item.notes)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-left sm:text-right flex-shrink-0">
                            <p className="font-bold text-base sm:text-lg text-primary">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Breakdown de Preços */}
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <h3 className="font-semibold text-base sm:text-lg">Resumo do Pedido</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedOrder.subtotal && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Subtotal dos Produtos</span>
                        <span className="font-medium text-sm">{formatPrice(selectedOrder.subtotal)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Taxa de Entrega</span>
                      <span className="font-medium text-sm">
                        {selectedOrder.delivery_fee === 0 ? 'Grátis' : formatPrice(selectedOrder.delivery_fee || 0)}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-base sm:text-lg">Total Pago</span>
                      <span className="font-bold text-lg sm:text-xl text-primary">
                        {formatPrice(selectedOrder.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      <h4 className="font-semibold text-sm sm:text-base">Data do Pedido</h4>
                    </div>
                    <p className="text-xs sm:text-sm font-medium">
                      {formatOrderDate(selectedOrder.created_at)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-3 sm:p-4 border border-primary/20">
                    <div className="flex items-center gap-3 mb-3">
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      <h4 className="font-semibold text-sm sm:text-base text-primary">Refazer Pedido</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Adiciona os mesmos itens ao carrinho para um novo pedido
                    </p>
                    <Button 
                      onClick={() => handleReorder(selectedOrder)}
                      disabled={isReorderLoading}
                      className="w-full"
                      size="sm"
                    >
                      {isReorderLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Refazer Pedido
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação para Produtos Fora de Estoque */}
      <AlertDialog open={isStockAlertOpen} onOpenChange={setIsStockAlertOpen}>
        <AlertDialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-hidden p-0">
          {/* Header com X no canto */}
          <div className="relative p-6 pb-4 border-b bg-gradient-to-r from-orange-50 to-orange-100">
            <button
              onClick={() => setIsStockAlertOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            
            <AlertDialogHeader className="space-y-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <AlertDialogTitle className="text-xl font-bold">Produtos Indisponíveis</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm mt-1">
                    Alguns itens do seu pedido não estão mais disponíveis
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="p-6 space-y-4">
              {outOfStockItems.length > 0 && (
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-800 mb-3">Produtos indisponíveis:</h4>
                    <ul className="text-sm text-red-700 space-y-2">
                      {outOfStockItems.map((item) => (
                        <li key={item.id} className="flex items-center gap-2">
                          <Package className="w-3 h-3 flex-shrink-0" />
                          <span className="break-words">{item.quantity}x {item.product.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {availableItems.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-3">Produtos disponíveis:</h4>
                      <ul className="text-sm text-green-700 space-y-2">
                        {availableItems.map((item) => (
                          <li key={item.id} className="flex items-center gap-2">
                            <Package className="w-3 h-3 flex-shrink-0" />
                            <span className="break-words">{item.quantity}x {item.product.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm text-muted-foreground leading-relaxed">
                {availableItems.length > 0 
                  ? "Deseja prosseguir apenas com os produtos disponíveis ou continuar comprando para adicionar outros itens?"
                  : "Todos os produtos deste pedido estão indisponíveis no momento."
                }
              </p>
            </div>
          </div>

          {/* Footer com botões */}
          <div className="border-t bg-gray-50 p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {availableItems.length > 0 && (
                <Button 
                  onClick={handleProceedWithAvailable}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Quero Continuar
                </Button>
              )}
              
              <Button 
                onClick={() => {
                  setIsStockAlertOpen(false);
                  navigate('/');
                }}
                variant="outline"
                className="flex-1"
              >
                <Package className="w-4 h-4 mr-2" />
                Continuar Comprando
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Pagamento */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Finalizar Novo Pedido
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Escolha a forma de pagamento para confirmar
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="p-6 space-y-6">
              {/* Resumo dos Itens */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Itens do Pedido</h3>
                <div className="space-y-2">
                  {paymentItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.product.title}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity}x {formatPrice(item.price)}</p>
                        </div>
                      </div>
                      <p className="font-bold text-primary">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Endereço de Entrega */}
              {reorderAddress && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Endereço de Entrega</h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{reorderAddress.receiver}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <p>{reorderAddress.street}, {reorderAddress.number}</p>
                        <p>{reorderAddress.neighborhood} - {reorderAddress.city}/{reorderAddress.state}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Método de Pagamento */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Método de Pagamento</h3>
                <div className="grid grid-cols-1 gap-3">
                  {availablePaymentMethods.map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPaymentMethod === method.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={method.value}
                        checked={selectedPaymentMethod === method.value}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-2xl">{method.icon}</span>
                      <span className="font-medium">{method.label}</span>
                      {selectedPaymentMethod === method.value && (
                        <div className="ml-auto w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Resumo de Valores */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Resumo do Pedido</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(paymentItems.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</span>
                  </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa de Entrega</span>
                    <span>{formatPrice(10)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">Total</span>
                    <span className="font-bold text-xl text-primary">
                      {formatPrice(paymentItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 10)}
                  </span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1"
                  disabled={isProcessingPayment}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleProcessPayment}
                  disabled={!selectedPaymentMethod || isProcessingPayment}
                  className="flex-1"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Confirmar Pedido
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 