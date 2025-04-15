
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface AuthStepProps {
  onComplete: () => void;
}

export function AuthStep({ onComplete }: AuthStepProps) {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [countdown, setCountdown] = useState(7);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!isLoggedIn && !showLoginDialog) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowLoginDialog(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLoggedIn, showLoginDialog]);

  const handleLogin = () => {
    // Aqui implementaremos o login
    toast.success("Login realizado com sucesso!");
    setIsLoggedIn(true);
    setShowLoginDialog(false);
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Identificação</h2>
        <Alert>
          <AlertDescription>
            Precisa estar logado para terminar o pedido, faça login em{" "}
            <span className="text-primary font-medium">{countdown}</span> segundos
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

