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
      <SheetContent side="bottom" className="h-[33vh] w-[75%] max-w-3xl mx-auto rounded-t-xl">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatar_url || ""} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <SheetTitle>
                {user ? `Olá, ${user.full_name}!` : "Minha Conta"}
              </SheetTitle>
              <Button 
                onClick={() => handleNavigation(user ? "/minhaconta" : "/minhaconta/login")}
                variant="secondary"
              >
                {user ? "Acessar Conta" : "Entrar"}
              </Button>
            </div>
          </div>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {user ? (
            <>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => handleNavigation("/minhaconta/dados")}
              >
                <User className="mr-2 h-5 w-5" />
                Meus Dados
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => handleNavigation("/minhaconta/pedidos")}
              >
                <Package className="mr-2 h-5 w-5" />
                Meus Pedidos
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => handleNavigation("/minhaconta/enderecos")}
              >
                <MapPin className="mr-2 h-5 w-5" />
                Meus Endereços
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sair
              </Button>
            </>
          ) : (
            <Button 
              className="w-full"
              onClick={() => handleNavigation("/minhaconta/login")}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Criar Conta
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
