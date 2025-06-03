import {Sheet, SheetContent, SheetHeader,SheetTitle} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Package, User, LogOut, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDrawer({ open, onOpenChange }: ProfileDrawerProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="min-h-[40vh] max-h-[80vh] w-full sm:w-[75%] sm:max-w-3xl sm:mx-auto sm:rounded-t-xl overflow-y-auto"
      >
        <SheetHeader className="text-left pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-16 w-16 flex-shrink-0">
              <AvatarImage src={user?.avatar_url || ""} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 flex-1 min-w-0">
              <SheetTitle className="text-lg sm:text-xl">
                {user ? `Olá, ${user.full_name}!` : "Minha Conta"}
              </SheetTitle>
              <Button 
                onClick={() => handleNavigation(user ? "/minhaconta" : "/minhaconta/login")}
                variant="secondary"
                size="sm"
                className="w-full sm:w-auto"
              >
                {user ? "Acessar Conta" : "Entrar"}
              </Button>
            </div>
          </div>
        </SheetHeader>
        
        <div className="space-y-2 pb-6">
          {user ? (
            <>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-12 text-base"
                onClick={() => handleNavigation("/minhaconta")}
              >
                <User className="mr-3 h-5 w-5 flex-shrink-0" />
                <span>Minha Conta</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start h-12 text-base"
                onClick={() => handleNavigation("/minhaconta/pedidos")}
              >
                <Package className="mr-3 h-5 w-5 flex-shrink-0" />
                <span>Meus Pedidos</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start h-12 text-base"
                onClick={() => handleNavigation("/minhaconta/enderecos")}
              >
                <MapPin className="mr-3 h-5 w-5 flex-shrink-0" />
                <span>Meus Endereços</span>
              </Button>
              
              <div className="pt-2 border-t">
              <Button 
                variant="ghost" 
                  className="w-full justify-start h-12 text-base text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                  <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span>Sair</span>
              </Button>
              </div>
            </>
          ) : (
            <Button 
              className="w-full h-12 text-base"
              onClick={() => handleNavigation("/minhaconta/login")}
            >
              <UserPlus className="mr-3 h-5 w-5" />
              Criar Conta
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
