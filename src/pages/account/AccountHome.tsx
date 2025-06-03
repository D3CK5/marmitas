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
    <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
      <AccountMenu />

      <div className="px-2 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-semibold">
          Bem-vindo, {user?.full_name || 'Cliente'}!
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Gerencie seus pedidos, endereços e informações pessoais
        </p>
      </div>

      {/* Pedidos Recentes */}
      <div className="px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold">Pedidos Recentes</h2>
          <Button variant="ghost" asChild className="self-start sm:self-auto">
            <Link to="/minhaconta/pedidos" className="text-sm">Ver Todos</Link>
          </Button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Carregando pedidos recentes...
                </p>
              </CardContent>
            </Card>
          ) : orders.length > 0 ? (
            orders.slice(0, 3).map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <p className="font-medium text-sm sm:text-base">Pedido #{order.id}</p>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="font-medium text-sm sm:text-base text-primary">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  Você ainda não fez nenhum pedido
                </p>
                <Button variant="outline" className="text-sm" asChild>
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