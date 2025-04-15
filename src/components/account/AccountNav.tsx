import { NavLink } from "react-router-dom";

export function AccountNav() {
  return (
    <nav className="border-b">
      <div className="container mx-auto">
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
      </div>
    </nav>
  );
} 