import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { ProfileDrawer } from "./ProfileDrawer";

interface NavItemProps {
  icon: typeof Home;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, active, badge, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center flex-1 h-full p-1 text-xs sm:text-sm relative min-w-0",
        active ? "text-primary" : "text-muted-foreground hover:text-primary transition-colors"
      )}
    >
      <div className="relative">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-destructive text-destructive-foreground h-4 w-4 sm:h-5 sm:w-5 rounded-full flex items-center justify-center text-xs font-medium">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-xs mt-1 truncate">{label}</span>
    </button>
  );
}

export function BottomNav() {
  const navigate = useNavigate();
  const { items, setIsOpen: setCartOpen } = useCart();
  const [profileOpen, setProfileOpen] = useState(false);

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 h-14 sm:h-16 bg-white border-t rounded-full shadow-lg w-[75%] sm:w-[60%] max-w-md mx-auto mb-3 sm:mb-4">
        <div className="flex h-full items-center justify-around px-3 sm:px-6">
          <NavItem 
            icon={Home} 
            label="Início" 
            onClick={() => navigate("/")} 
          />
          <NavItem 
            icon={ShoppingCart} 
            label="Carrinho" 
            badge={cartItemsCount}
            onClick={() => setCartOpen(true)} 
          />
          <NavItem 
            icon={User} 
            label="Perfil" 
            onClick={() => setProfileOpen(true)} 
          />
        </div>
      </nav>

      <ProfileDrawer open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
