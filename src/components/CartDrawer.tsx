import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertTriangle, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { QuantityCounter } from "./QuantityCounter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { formatPrice, formatFoodChanges } from "@/lib/utils";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface CartItem {
  id: number;
  uniqueId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  notes?: string;
}

interface UnavailableItem extends CartItem {
  reason: string;
}

export function CartDrawer() {
  const { items, removeItem, updateQuantity, isOpen, setIsOpen, total } = useCart();
  const navigate = useNavigate();
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isStockAlertOpen, setIsStockAlertOpen] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState<UnavailableItem[]>([]);
  const [availableItems, setAvailableItems] = useState<CartItem[]>([]);

  const checkItemsAvailability = async (): Promise<{
    available: CartItem[];
    unavailable: UnavailableItem[];
  }> => {
    const availabilityChecks = await Promise.all(
      items.map(async (item) => {
        const { data: product, error } = await supabase
          .from('products')
          .select('id, stock, is_active')
          .eq('id', item.id)
          .single();

        if (error || !product) {
          return {
            item,
            available: false,
            reason: 'Produto não encontrado'
          };
        }

        if (!product.is_active) {
          return {
            item,
            available: false,
            reason: 'Produto desativado'
          };
        }

        if (product.stock < item.quantity) {
          return {
            item,
            available: false,
            reason: `Estoque insuficiente (disponível: ${product.stock})`
          };
        }

        return {
          item,
          available: true,
          reason: ''
        };
      })
    );

    const available = availabilityChecks
      .filter(check => check.available)
      .map(check => check.item);
    
    const unavailable = availabilityChecks
      .filter(check => !check.available)
      .map(check => ({ ...check.item, reason: check.reason }));

    return { available, unavailable };
  };

  const handleCheckout = async () => {
    setIsCheckingAvailability(true);

    try {
      const { available, unavailable } = await checkItemsAvailability();

      if (unavailable.length > 0) {
        setAvailableItems(available);
        setUnavailableItems(unavailable);
        setIsStockAlertOpen(true);
        return;
      }

      // Todos os itens estão disponíveis, prosseguir normalmente
      setIsOpen(false);
      navigate("/checkout");
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      toast.error("Erro ao verificar disponibilidade dos produtos.");
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleProceedWithAvailable = () => {
    // Remove itens indisponíveis do carrinho
    unavailableItems.forEach(item => {
      removeItem(item.uniqueId);
    });

    setIsStockAlertOpen(false);
    setIsOpen(false);
    navigate("/checkout");
    
    toast.success(
      availableItems.length > 0 
        ? `Prosseguindo com ${availableItems.length} ${availableItems.length === 1 ? 'item disponível' : 'itens disponíveis'}` 
        : "Carrinho atualizado"
    );
  };

  const handleContinueShopping = () => {
    // Remove itens indisponíveis do carrinho
    unavailableItems.forEach(item => {
      removeItem(item.uniqueId);
    });

    setIsStockAlertOpen(false);
    setIsOpen(false);
    
    toast.success("Itens indisponíveis removidos do carrinho");
  };

  const handleRemoveItem = (uniqueId: string, title: string) => {
    removeItem(uniqueId);
    toast.success(`${title} removido do carrinho`);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 [&>button]:w-12 [&>button]:h-12 [&>button]:bg-transparent [&>button]:hover:bg-transparent [&>button]:hover:text-red-500 [&>button]:transition-colors [&>button_svg]:w-7 [&>button_svg]:h-7 [&>button_svg]:stroke-[2.5]">
          {/* Header */}
          <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl">Seu Carrinho</SheetTitle>
              </div>
            </div>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <ShoppingBag className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Carrinho vazio</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Adicione algumas marmitas deliciosas ao seu carrinho para começar
                </p>
                <Button 
                  onClick={() => setIsOpen(false)}
                  className="rounded-full px-6"
                >
                  Explorar Marmitas
                </Button>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="flex-1 overflow-auto p-6 space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.uniqueId}
                      className="group relative bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex gap-4">
                        {/* Image with quantity badge */}
                        <div className="flex-shrink-0 relative">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-100"
                          />
                          {/* Quantity Badge */}
                          <Badge 
                            className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs p-0 shadow-md"
                          >
                            {item.quantity}
                          </Badge>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-base line-clamp-2 pr-2">
                              {item.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              onClick={() => handleRemoveItem(item.uniqueId, item.title)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                              <p className="text-lg font-bold text-primary">
                                {formatPrice(item.price)}
                              </p>
                              {item.notes && (
                                <p className="text-xs text-muted-foreground">
                                  {formatFoodChanges(item.notes)}
                                </p>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="w-9 h-9 rounded-full border-2 hover:border-primary hover:bg-primary hover:text-white transition-all duration-200 shadow-sm"
                                onClick={() => updateQuantity(item.uniqueId, Math.max(1, item.quantity - 1))}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="icon"
                                className="w-9 h-9 rounded-full border-2 hover:border-primary hover:bg-primary hover:text-white transition-all duration-200 shadow-sm"
                                onClick={() => updateQuantity(item.uniqueId, item.quantity + 1)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer with total and checkout */}
                <div className="border-t bg-gray-50 p-6 space-y-4">
                  {/* Total with items count */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-center">
                      <Badge variant="outline" className="text-sm font-medium">
                        {totalItems} {totalItems === 1 ? 'item' : 'itens'} no carrinho
                      </Badge>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button
                    onClick={handleCheckout}
                    disabled={isCheckingAvailability}
                    className="w-full py-3 text-base font-semibold rounded-full bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    {isCheckingAvailability ? (
                      "Verificando disponibilidade..."
                    ) : (
                      <>
                        Finalizar Pedido
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal de Produtos Indisponíveis */}
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
                    Alguns itens do seu carrinho não estão mais disponíveis
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="p-6 space-y-4">
              {unavailableItems.length > 0 && (
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-800 mb-3">Produtos indisponíveis:</h4>
                    <ul className="text-sm text-red-700 space-y-2">
                      {unavailableItems.map((item) => (
                        <li key={item.uniqueId} className="flex items-start gap-2">
                          <Package className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="break-words">{item.quantity}x {item.title}</span>
                            <p className="text-xs text-red-600">{item.reason}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {availableItems.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-3">Produtos disponíveis:</h4>
                      <ul className="text-sm text-green-700 space-y-2">
                        {availableItems.map((item) => (
                          <li key={item.uniqueId} className="flex items-center gap-2">
                            <Package className="w-3 h-3 flex-shrink-0" />
                            <span className="break-words">{item.quantity}x {item.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm text-muted-foreground leading-relaxed">
                {availableItems.length > 0 
                  ? "Deseja prosseguir para o checkout apenas com os produtos disponíveis ou continuar comprando?"
                  : "Todos os produtos do seu carrinho estão indisponíveis no momento."
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
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Quero Continuar
                </Button>
              )}
              
              <Button 
                onClick={handleContinueShopping}
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
    </>
  );
}
