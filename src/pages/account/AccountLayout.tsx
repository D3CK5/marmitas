import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/BottomNav";

export function AccountLayout() {
  const { user, loading } = useAuth();

  // Se estiver carregando, mostra um estado de carregamento
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  // Redirecionar para login se não estiver autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pb-28">
        <Outlet />
      </div>
      
      <BottomNav />
      <Toaster />
    </div>
  );
} 