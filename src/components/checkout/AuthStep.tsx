import { useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

interface AuthStepProps {
  onComplete: () => void;
}

export function AuthStep({ onComplete }: AuthStepProps) {
  const { user } = useAuth();

  useEffect(() => {
    // Se o usuário já estiver logado, pula a etapa de autenticação
    if (user) {
      onComplete();
    }
  }, [user, onComplete]);

  // Se o usuário já estiver logado, não renderiza nada
  if (user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Autenticação</h2>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>
          Você precisa fazer login para continuar com a compra.
        </AlertDescription>
      </Alert>
    </div>
  );
}

