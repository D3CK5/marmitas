import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Header } from "@/components/Header";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AuthStep } from "@/components/checkout/AuthStep";
import { AddressStep } from "@/components/checkout/AddressStep";
import { PaymentStep } from "@/components/checkout/PaymentStep";
import { Steps } from "@/components/checkout/Steps";
import { QuantityCounter } from "@/components/QuantityCounter";
import { useAuth } from "@/contexts/AuthContext";
import { formatFoodChanges } from "@/lib/utils";

type CheckoutStep = "auth" | "address" | "payment";

export default function Checkout() {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("auth");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const { items, total, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    navigate("/");
    return null;
  }

  const steps = [
    { id: "auth", title: "Identificação" },
    { id: "address", title: "Endereço" },
    { id: "payment", title: "Pagamento" },
  ];

  const handleDeliveryFeeCalculated = (fee: number | null) => {
    setDeliveryFee(fee);
  };

  const OrderSummary = () => {
    const finalTotal = deliveryFee !== null ? total + deliveryFee : total;

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">Resumo do Pedido</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.uniqueId} className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="absolute -top-2 -right-2 bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
                      {item.quantity}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      R$ {item.price.toFixed(2)}
                    </p>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatFoodChanges(item.notes)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Taxa de Entrega</span>
              {currentStep === "auth" ? (
                <span>--</span>
              ) : deliveryFee === null ? (
                <span className="text-muted-foreground">...</span>
              ) : (
                <span>R$ {deliveryFee.toFixed(2)}</span>
              )}
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>R$ {finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 pb-20">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </button>

          <Steps steps={steps} currentStep={currentStep} />
          
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {/* Resumo do Pedido - Primeiro em dispositivos móveis */}
            <div className="order-1 md:order-2 md:sticky md:top-20">
              <OrderSummary />
            </div>
            
            {/* Formulários - Segundo em dispositivos móveis */}
            <div className="order-2 md:order-1 bg-white rounded-lg shadow-sm p-6">
              {currentStep === "auth" && (
                <AuthStep onComplete={() => setCurrentStep("address")} />
              )}
              {currentStep === "address" && (
                <AddressStep 
                  onComplete={(addressId, fee) => {
                    setSelectedAddressId(addressId);
                    setDeliveryFee(fee);
                    setCurrentStep("payment");
                  }}
                  onDeliveryFeeCalculated={handleDeliveryFeeCalculated}
                  userName={user?.email?.split('@')[0] || ''}
                />
              )}
              {currentStep === "payment" && (
                <PaymentStep 
                  selectedAddressId={selectedAddressId}
                  deliveryFee={deliveryFee || 0}
                  total={total}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
