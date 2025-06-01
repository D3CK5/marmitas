import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "sonner";

import { CartProvider } from "./contexts/CartContext";
import { CartDrawer } from "./components/CartDrawer";

import Index from "./pages/Index";
import Product from "./pages/Product";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import { AccountLayout } from "./pages/account/AccountLayout";
import { AccountAuth } from "./pages/account/AccountAuth";
import { AccountOrders } from "./pages/account/AccountOrders";
import { AccountAddresses } from "./pages/account/AccountAddresses";
import { AccountProfile } from "./pages/account/AccountProfile";
import { AccountHome } from "./pages/account/AccountHome";

import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Finance from "./pages/admin/Finance";
import Customers from "./pages/admin/Customers";
import Analytics from "./pages/admin/Analytics";
import DeliveryAreas from "./pages/admin/DeliveryAreas";
import Settings from "./pages/admin/Settings";
import AdminLogin from "./pages/admin/Login";
import Categories from "./pages/admin/Categories";
import Trash from "./pages/admin/Trash";

import { AuthProvider } from "./contexts/AuthContext";
import { AdminRoute } from "./components/AdminRoute";
import { AuthModal } from "@/components/auth/AuthModal";
import { PrivateRoute } from "@/components/PrivateRoute";
import { useAuthModal } from "@/hooks/useAuthModal";
import { OrderSuccess } from "./pages/OrderSuccess";

const queryClient = new QueryClient();

const App = () => {
  const { isOpen, closeAuthModal, defaultTab } = useAuthModal();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/produto/:id" element={<Product />} />
                <Route path="/checkout" element={<PrivateRoute> <Checkout /> </PrivateRoute>} />
                <Route path="/pedido-realizado" element={<OrderSuccess />} />
                
                {/* Rotas da área do cliente */}
                <Route path="/minhaconta" element={<AccountLayout />}>
                  <Route index element={<AccountHome />} />
                  <Route path="dados" element={<AccountProfile />} />
                  <Route path="pedidos" element={<AccountOrders />} />
                  <Route path="enderecos" element={<AccountAddresses />} />
                </Route>
                <Route path="/minhaconta/login" element={<AccountAuth />} />
                
                {/* Rota de login admin */}
                <Route path="/admin/login" element={<AdminLogin />} />
                
                {/* Rotas protegidas do admin */}
                <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
                <Route path="/admin/produtos" element={<AdminRoute><Products /></AdminRoute>} />
                <Route path="/admin/pedidos" element={<AdminRoute><Orders /></AdminRoute>} />
                <Route path="/admin/financeiro" element={<AdminRoute><Finance /></AdminRoute>} />
                <Route path="/admin/clientes" element={<AdminRoute><Customers /></AdminRoute>} />
                <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
                <Route path="/admin/areas-entrega" element={<AdminRoute><DeliveryAreas /></AdminRoute>} />
                <Route path="/admin/configuracoes" element={<AdminRoute><Settings /></AdminRoute>} />
                <Route path="/admin/categorias" element={<AdminRoute><Categories /></AdminRoute>} />
                <Route path="/admin/lixeira" element={<AdminRoute><Trash /></AdminRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <CartDrawer />
              <AuthModal 
                isOpen={isOpen} 
                onClose={closeAuthModal}
                defaultTab={defaultTab}
              />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
