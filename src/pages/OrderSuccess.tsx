import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, Receipt, User } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OrderSuccessState {
  order: {
    id: string;
    total: number;
    items: Array<{
      quantity: number;
      price: number;
      notes?: string;
      product_id: string;
    }>;
    payment_method: 'pix' | 'credit_card';
    payment_details: {
      installments?: number;
    };
  };
}

export function OrderSuccess() {
  const location = useLocation();
  const { order } = (location.state as OrderSuccessState) || { order: null };

  if (!order) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Pedido não encontrado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Não foi possível encontrar as informações do pedido.
            </p>
            <div className="flex justify-center">
              <Button asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao início
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Pedido Realizado com Sucesso!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              Obrigado por escolher nossos produtos!
            </p>
            <p className="text-sm text-muted-foreground">
              Seu pedido #{order.id} foi confirmado e está sendo preparado.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Resumo do Pedido</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Status</span>
                <span className="text-green-600 font-medium">Pedido Realizado</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Forma de Pagamento</span>
                <span>{order.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Total</span>
                <span className="font-bold">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center">
        <Button asChild variant="outline">
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            Voltar ao início
          </Link>
        </Button>
        <Button asChild>
          <Link to="/minhaconta/pedidos">
            <Receipt className="w-4 h-4 mr-2" />
            Meus Pedidos
          </Link>
        </Button>
      </div>
    </div>
  );
} 