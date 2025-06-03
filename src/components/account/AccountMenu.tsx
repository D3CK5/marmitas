import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, Home as HomeIcon, ShoppingBag, LogOut, MapPin } from "lucide-react";
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
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8 gap-4">
      {/* Menu items - Responsivo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex gap-2 sm:gap-3">
        <Link to="/minhaconta" className="w-full lg:w-auto">
          <div className={`flex items-center border rounded-md p-2 sm:p-3 bg-white hover:bg-gray-50 transition-colors h-14 sm:h-16 lg:w-36 ${location.pathname === '/minhaconta' ? 'border-primary' : ''}`}>
            <HomeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-1 sm:mr-2 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium leading-tight truncate">Início</p>
              <p className="text-xs text-muted-foreground hidden sm:block">Visão geral</p>
            </div>
          </div>
        </Link>

        <Link to="/minhaconta/dados" className="w-full lg:w-auto">
          <div className={`flex items-center border rounded-md p-2 sm:p-3 bg-white hover:bg-gray-50 transition-colors h-14 sm:h-16 lg:w-36 ${location.pathname === '/minhaconta/dados' ? 'border-primary' : ''}`}>
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-1 sm:mr-2 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium leading-tight truncate">Perfil</p>
              <p className="text-xs text-muted-foreground hidden sm:block">Seus Dados</p>
            </div>
          </div>
        </Link>
        
        <Link to="/minhaconta/enderecos" className="w-full lg:w-auto">
          <div className={`flex items-center border rounded-md p-2 sm:p-3 bg-white hover:bg-gray-50 transition-colors h-14 sm:h-16 lg:w-36 ${location.pathname === '/minhaconta/enderecos' ? 'border-primary' : ''}`}>
            <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-1 sm:mr-2 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium leading-tight truncate">Endereços</p>
              <p className="text-xs text-muted-foreground hidden sm:block">{addresses.length} endereço(s)</p>
            </div>
          </div>
        </Link>
        
        <Link to="/minhaconta/pedidos" className="w-full lg:w-auto">
          <div className={`flex items-center border rounded-md p-2 sm:p-3 bg-white hover:bg-gray-50 transition-colors h-14 sm:h-16 lg:w-36 ${location.pathname === '/minhaconta/pedidos' ? 'border-primary' : ''}`}>
            <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-1 sm:mr-2 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium leading-tight truncate">Pedidos</p>
              <p className="text-xs text-muted-foreground hidden sm:block">{orders.length} pedido(s)</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Botão de logout */}
      <button
        onClick={handleLogout}
        className="flex items-center justify-center lg:justify-start border rounded-md p-2 sm:p-3 bg-white hover:bg-gray-50 transition-colors h-14 sm:h-16 w-full lg:w-auto text-destructive hover:text-destructive"
      >
        <LogOut className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2" />
        <span className="text-sm font-medium">Sair</span>
      </button>
    </div>
  );
} 