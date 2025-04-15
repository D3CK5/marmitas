import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { User, Home, ShoppingBag, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";

export function AccountHome() {
  const { user } = useAuth();
  const { getOrders, getAddresses } = useProfile();
  const [recentOrders, setRecentOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ordersData, addressesData] = await Promise.all([
        getOrders(),
        getAddresses()
      ]);
      setRecentOrders(ordersData);
      setAddresses(addressesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      "Pendente": "bg-yellow-100 text-yellow-800",
      "Em Preparo": "bg-blue-100 text-blue-800",
      "Em Entrega": "bg-purple-100 text-purple-800",
      "Entregue": "bg-green-100 text-green-800",
      "Cancelado": "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Cabeçalho com os cards na MESMA LINHA */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bem-vindo, {user?.full_name || 'Cliente'}!</h1>
          <p className="text-muted-foreground">
            Gerencie seus pedidos, endereços e informações pessoais
          </p>
        </div>
        
        {/* Cards na MESMA LINHA com ícones ao lado do texto */}
        <div className="flex gap-3">
          <Link to="/minhaconta/dados">
            <div className="flex items-center border rounded-md p-3 bg-white hover:bg-gray-50 transition-colors w-36 h-16">
              <User className="h-6 w-6 text-green-600 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium leading-tight">Perfil</p>
                <p className="text-xs text-muted-foreground">Novo cliente</p>
              </div>
            </div>
          </Link>
          
          <Link to="/minhaconta/enderecos">
            <div className="flex items-center border rounded-md p-3 bg-white hover:bg-gray-50 transition-colors w-36 h-16">
              <Home className="h-6 w-6 text-green-600 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium leading-tight">Endereços</p>
                <p className="text-xs text-muted-foreground">{addresses.length} endereço(s)</p>
              </div>
            </div>
          </Link>
          
          <Link to="/minhaconta/pedidos">
            <div className="flex items-center border rounded-md p-3 bg-white hover:bg-gray-50 transition-colors w-36 h-16">
              <ShoppingBag className="h-6 w-6 text-green-600 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium leading-tight">Pedidos</p>
                <p className="text-xs text-muted-foreground">{recentOrders.length} pedido(s)</p>
              </div>
            </div>
          </Link>
        </div>
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
          ) : recentOrders.length > 0 ? (
            recentOrders.slice(0, 3).map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <ClipboardList className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">Pedido #{order.id}</p>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
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