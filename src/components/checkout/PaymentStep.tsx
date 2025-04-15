
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";

// Simular configurações do admin
const MOCK_PAYMENT_CONFIG = {
  pix: {
    enabled: true,
    title: "PIX",
    description: "Pagamento instantâneo"
  },
  creditCard: {
    enabled: true,
    title: "Cartão de Crédito",
    description: "Pagamento parcelado",
    installments: [
      { value: "1", label: "À vista" },
      { value: "2", label: "2 vezes" },
      { value: "3", label: "3 vezes" }
    ]
  }
};

const MOCK_TERMS = [
  "O prazo de entrega é de até 60 minutos",
  "Não aceitamos trocas ou devoluções após a entrega",
  "Em caso de problemas, entre em contato conosco",
  "Alimentos quentes são entregues em embalagens térmicas",
  "Pedido sujeito à disponibilidade dos produtos"
];

export function PaymentStep() {
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [installments, setInstallments] = useState("1");
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const handleFinishOrder = () => {
    // Aqui implementaremos a finalização do pedido
    const paymentDetails = paymentMethod === "card" 
      ? `Cartão de Crédito - ${installments}x`
      : "PIX";
      
    toast.success("Pedido realizado com sucesso!");
    clearCart();
    navigate("/");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Pagamento</h2>
        <p className="text-muted-foreground mb-6">
          Escolha a forma de pagamento
        </p>
      </div>

      <RadioGroup
        value={paymentMethod}
        onValueChange={(value) => setPaymentMethod(value as "pix" | "card")}
        className="grid gap-4"
      >
        <div>
          <RadioGroupItem value="pix" id="pix" className="peer sr-only" />
          <Label
            htmlFor="pix"
            className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <span className="font-semibold">PIX</span>
            <span className="text-sm text-muted-foreground">
              Pagamento instantâneo
            </span>
          </Label>
        </div>

        <div>
          <RadioGroupItem value="card" id="card" className="peer sr-only" />
          <Label
            htmlFor="card"
            className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <span className="font-semibold">Cartão de Crédito</span>
            <span className="text-sm text-muted-foreground">
              Pagamento parcelado
            </span>
          </Label>
        </div>
      </RadioGroup>

      {paymentMethod === "card" && (
        <div className="space-y-2">
          <Label>Parcelas</Label>
          <Select value={installments} onValueChange={setInstallments}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o número de parcelas" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_PAYMENT_CONFIG.creditCard.installments.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Termos e Condições</CardTitle>
          <CardDescription>
            Leia atentamente antes de finalizar o pedido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            {MOCK_TERMS.map((term, index) => (
              <li key={index}>{term}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button onClick={handleFinishOrder} className="w-full">
        Finalizar Pedido
      </Button>
    </div>
  );
}
