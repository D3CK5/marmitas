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

type CheckoutStep = "auth" | "address" | "payment";

export default function Checkout() {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("auth");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
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

  const OrderSummary = () => {
    // Simulando taxa de entrega baseada no CEP
    const deliveryFee = 5.90; // Exemplo fixo, deve vir do backend
    const finalTotal = total + deliveryFee;

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">Resumo do Pedido</h3>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-start space-x-4">
              <img
                src={item.image}
                alt={item.title}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">
                      {item.quantity}x {item.title}
                    </span>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground">
                        Obs: {item.notes}
                      </p>
                    )}
                  </div>
                  <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <QuantityCounter
                    quantity={item.quantity}
                    onQuantityChange={(q) => updateQuantity(item.id, q)}
                    min={0}
                  />
                  {item.quantity === 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Taxa de Entrega</span>
              <span>R$ {deliveryFee.toFixed(2)}</span>
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
            <div className="bg-white rounded-lg shadow-sm p-6">
              {currentStep === "auth" && (
                <AuthStep onComplete={() => setCurrentStep("address")} />
              )}
              {currentStep === "address" && (
                <AddressStep 
                  onComplete={(addressId) => {
                    setSelectedAddressId(addressId);
                    setCurrentStep("payment");
                  }}
                  userName={user?.user_metadata?.full_name}
                />
              )}
              {currentStep === "payment" && (
                <PaymentStep selectedAddressId={selectedAddressId} />
              )}
            </div>
            
            <div className="md:sticky md:top-20">
              <OrderSummary />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
