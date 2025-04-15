
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Menu, Flame, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { SideMenu } from "./SideMenu";
import { OffersDialog } from "./OffersDialog";
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
        "flex flex-col items-center justify-center flex-1 h-full p-1 text-sm relative",
        active ? "text-primary" : "text-muted-foreground hover:text-primary transition-colors"
      )}
    >
      <div className="relative">
        <Icon className="w-6 h-6" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground h-5 w-5 rounded-full flex items-center justify-center text-xs">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}

export function BottomNav() {
  const navigate = useNavigate();
  const { items, setIsOpen: setCartOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [offersOpen, setOffersOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 h-16 bg-white border-t rounded-full shadow-lg w-[75%] max-w-3xl mx-auto mb-4">
        <div className="flex h-full items-center justify-around px-4">
          <NavItem 
            icon={Menu} 
            label="Menu" 
            onClick={() => setMenuOpen(true)} 
          />
          <NavItem 
            icon={Home} 
            label="Início" 
            onClick={() => navigate("/")} 
          />
          <NavItem 
            icon={Flame} 
            label="Ofertas" 
            onClick={() => setOffersOpen(true)} 
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

      <SideMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <OffersDialog open={offersOpen} onOpenChange={setOffersOpen} />
      <ProfileDrawer open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
