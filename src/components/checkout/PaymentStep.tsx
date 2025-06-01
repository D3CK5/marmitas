import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useOrders } from "@/hooks/useOrders";
import { useSettings } from "@/hooks/useSettings";

interface PaymentStepProps {
  selectedAddressId: string;
  deliveryFee: number;
  total: number;
}

export function PaymentStep({ selectedAddressId, deliveryFee, total }: PaymentStepProps) {
  const { settings, isLoading: settingsLoading } = useSettings();
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card">("pix");
  const [isLoading, setIsLoading] = useState(false);
  const { items, clearCart } = useCart();
  const { createOrder } = useOrders();
  const navigate = useNavigate();

  const finalTotal = total + deliveryFee;

  // Filtrar apenas métodos de pagamento habilitados
  const enabledPaymentMethods = settings?.payment_methods ? Object.entries(settings.payment_methods).filter(([_, method]) => method.enabled) : [];

  const handleFinishOrder = async () => {
    try {
      setIsLoading(true);

      // Preparar os itens do pedido
      const orderItems = items.map(item => ({
        product_id: item.id.toString(),
        quantity: item.quantity,
        price: item.price,
        notes: item.notes
      }));

      // Criar o pedido
      const orderData = {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        payment_details: {},
        items: orderItems,
        subtotal: total,
        delivery_fee: deliveryFee,
        total: finalTotal
      };

      const order = await createOrder.mutateAsync(orderData);
      
      toast.success("Pedido realizado com sucesso!");
      clearCart();
      navigate("/pedido-realizado", { 
        state: { 
          order: {
            ...order,
            items: orderItems,
            payment_method: paymentMethod,
            total: finalTotal
          }
        }
      });
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      toast.error("Erro ao finalizar pedido. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Pagamento</h2>
        <p className="text-muted-foreground mb-6">
          Escolha a forma de pagamento
        </p>
      </div>

      {enabledPaymentMethods.length > 0 ? (
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value as "pix" | "credit_card")}
          className="grid gap-4"
        >
          {enabledPaymentMethods.map(([key, method]) => (
            <div key={key}>
              <RadioGroupItem value={key} id={key} className="peer sr-only" />
              <Label
                htmlFor={key}
                className={`flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 ${
                  paymentMethod === key
                    ? key === "pix" 
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white hover:border-orange-400 hover:bg-orange-50"
                }`}
              >
                <span className="font-semibold text-lg">{method.title}</span>
                <span className={`text-sm ${
                  paymentMethod === key 
                    ? key === "pix" ? "text-green-600" : "text-orange-600"
                    : "text-gray-500"
                }`}>
                  {method.description}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum método de pagamento disponível no momento.</p>
        </div>
      )}

      {settings?.checkout_terms && settings.checkout_terms.length > 0 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Termos e Condições</CardTitle>
            <CardDescription>
              Leia atentamente antes de finalizar o pedido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              {settings.checkout_terms.map((term, index) => (
                <li key={index}>{term}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Button 
        onClick={handleFinishOrder} 
        className="w-full"
        disabled={isLoading || enabledPaymentMethods.length === 0}
      >
        {isLoading ? "Processando..." : "Finalizar Pedido"}
      </Button>
    </div>
  );
}
