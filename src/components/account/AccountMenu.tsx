import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, Home as HomeIcon, ShoppingBag, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

export function AccountMenu() {
  const { user, signOut } = useAuth();
  const { orders, addresses } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex gap-3">
        <Link to="/minhaconta">
          <div className={`flex items-center border rounded-md p-3 bg-white hover:bg-gray-50 transition-colors w-36 h-16 ${location.pathname === '/minhaconta' ? 'border-primary' : ''}`}>
            <HomeIcon className="h-6 w-6 text-green-600 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium leading-tight">Início</p>
              <p className="text-xs text-muted-foreground">Visão geral</p>
            </div>
          </div>
        </Link>

        <Link to="/minhaconta/dados">
          <div className={`flex items-center border rounded-md p-3 bg-white hover:bg-gray-50 transition-colors w-36 h-16 ${location.pathname === '/minhaconta/dados' ? 'border-primary' : ''}`}>
            <User className="h-6 w-6 text-green-600 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium leading-tight">Perfil</p>
              <p className="text-xs text-muted-foreground">Seus Dados</p>
            </div>
          </div>
        </Link>
        
        <Link to="/minhaconta/enderecos">
          <div className={`flex items-center border rounded-md p-3 bg-white hover:bg-gray-50 transition-colors w-36 h-16 ${location.pathname === '/minhaconta/enderecos' ? 'border-primary' : ''}`}>
            <HomeIcon className="h-6 w-6 text-green-600 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium leading-tight">Endereços</p>
              <p className="text-xs text-muted-foreground">{addresses.length} endereço(s)</p>
            </div>
          </div>
        </Link>
        
        <Link to="/minhaconta/pedidos">
          <div className={`flex items-center border rounded-md p-3 bg-white hover:bg-gray-50 transition-colors w-36 h-16 ${location.pathname === '/minhaconta/pedidos' ? 'border-primary' : ''}`}>
            <ShoppingBag className="h-6 w-6 text-green-600 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium leading-tight">Pedidos</p>
              <p className="text-xs text-muted-foreground">{orders.length} pedido(s)</p>
            </div>
          </div>
        </Link>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center border rounded-md p-3 bg-white hover:bg-gray-50 transition-colors h-16 text-destructive hover:text-destructive"
      >
        <LogOut className="h-6 w-6 mr-2" />
        <span>Sair</span>
      </button>
    </div>
  );
} 