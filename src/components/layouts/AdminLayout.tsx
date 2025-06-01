import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  Menu,
  DollarSign,
  Truck,
  Utensils,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const sidebarItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    title: "Produtos",
    icon: ShoppingBag,
    href: "/admin/produtos",
  },
  {
    title: "Pedidos",
    icon: ClipboardList,
    href: "/admin/pedidos",
  },
  {
    title: "Clientes",
    icon: Users,
    href: "/admin/clientes",
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    href: "/admin/financeiro",
  },
  {
    title: "Áreas de Entrega",
    icon: Truck,
    href: "/admin/areas-entrega",
  },
  {
    title: "Configurações",
    icon: Settings,
    href: "/admin/configuracoes",
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Financeiro"]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("supabase.auth.token");
    navigate("/login");
    onItemClick?.();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Utensils className="h-6 w-6" />
          <span>Marmitas Admin</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          <div className="space-y-2 py-4">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.href;
              const isSubmenuActive = false;
              const isExpanded = false;

              return (
                <div key={item.title}>
                  <div className="flex items-center">
                    <Link
                      to={item.href}
                      className={cn(
                        "flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        (isActive || isSubmenuActive) && "bg-muted text-primary"
                      )}
                      onClick={onItemClick}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          className="w-full"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <SidebarContent />
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              <SidebarContent onItemClick={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 space-y-4 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
