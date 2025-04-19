import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { ClipboardList } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { AccountMenu } from "@/components/account/AccountMenu";

export function AccountHome() {
  const { user } = useAuth();
  const { orders, isLoading } = useProfile();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <AccountMenu />

      <div>
        <h1 className="text-2xl font-semibold">Bem-vindo, {user?.full_name || 'Cliente'}!</h1>
        <p className="text-muted-foreground">
          Gerencie seus pedidos, endereços e informações pessoais
        </p>
      </div>

      {/* Pedidos Recentes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Pedidos Recentes</h2>
          <Button variant="ghost" asChild>
            <Link to="/minhaconta/pedidos">Ver Todos</Link>
          </Button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <p>Carregando pedidos recentes...</p>
          ) : orders.length > 0 ? (
            orders.slice(0, 3).map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <ClipboardList className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">Pedido #{order.id}</p>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Você ainda não fez nenhum pedido</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link to="/">Fazer Primeiro Pedido</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 