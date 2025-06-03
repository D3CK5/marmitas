import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/BottomNav";

export function AccountLayout() {
  const { user, loading } = useAuth();

  // Se estiver carregando, mostra um estado de carregamento
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm sm:text-base text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirecionar para login se não estiver autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pb-20 sm:pb-24 lg:pb-28">
        <Outlet />
      </div>
      
      <BottomNav />
      <Toaster />
    </div>
  );
} 