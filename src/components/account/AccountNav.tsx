import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

export function AccountNav() {
  const { signOut } = useAuth();
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
    <nav className="border-b">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex space-x-8">
            <NavLink
              to="/minhaconta"
              end
              className={({ isActive }) =>
                `py-4 border-b-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`
              }
            >
              Início
            </NavLink>
            
            <NavLink
              to="/minhaconta/dados"
              className={({ isActive }) =>
                `py-4 border-b-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`
              }
            >
              Perfil
            </NavLink>
            
            <NavLink
              to="/minhaconta/enderecos"
              className={({ isActive }) =>
                `py-4 border-b-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`
              }
            >
              Endereços
            </NavLink>
            
            <NavLink
              to="/minhaconta/pedidos"
              className={({ isActive }) =>
                `py-4 border-b-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`
              }
            >
              Pedidos
            </NavLink>
          </div>
          
          <button
            onClick={handleLogout}
            className="py-4 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
} 