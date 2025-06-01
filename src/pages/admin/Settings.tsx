import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ShoppingCart,
  Plus,
  Trash2,
} from "lucide-react";
import { useSettings, type PaymentMethods } from "@/hooks/useSettings";

export default function Settings() {
  const { settings, isLoading, updatePaymentMethods, updateCheckoutTerms } = useSettings();
  const [newTerm, setNewTerm] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Estado local para editar termos
  const [localTerms, setLocalTerms] = useState<string[]>([]);

  // Sincronizar termos quando carregados
  useEffect(() => {
    if (settings?.checkout_terms) {
      setLocalTerms(settings.checkout_terms);
    }
  }, [settings?.checkout_terms]);

  const handleAddTerm = () => {
    if (newTerm.trim()) {
      const updatedTerms = [...localTerms, newTerm.trim()];
      setLocalTerms(updatedTerms);
      setNewTerm("");
      // Salvar imediatamente
      updateCheckoutTerms(updatedTerms);
    }
  };

  const handleRemoveTerm = (index: number) => {
    const updatedTerms = localTerms.filter((_, i) => i !== index);
    setLocalTerms(updatedTerms);
    // Salvar imediatamente
    updateCheckoutTerms(updatedTerms);
  };

  const handleTogglePaymentMethod = async (method: 'pix' | 'credit_card') => {
    if (!settings?.payment_methods) return;
    
    setIsUpdating(true);
    try {
      const updatedMethods: PaymentMethods = {
        ...settings.payment_methods,
        [method]: {
          ...settings.payment_methods[method],
          enabled: !settings.payment_methods[method].enabled
        }
      };
      
      await updatePaymentMethods(updatedMethods);
    } catch (error) {
      console.error('Erro ao atualizar método de pagamento:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando configurações...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>

        <Tabs defaultValue="checkout" className="space-y-4">
          <TabsList>
            <TabsTrigger value="checkout">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Checkout
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkout" className="space-y-4">
            {/* Formas de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle>Formas de Pagamento</CardTitle>
                <CardDescription>
                  Configure as formas de pagamento disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings?.payment_methods && Object.entries(settings.payment_methods).map(([key, method]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{method.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                    <Switch
                      checked={method.enabled}
                      onCheckedChange={() => handleTogglePaymentMethod(key as 'pix' | 'credit_card')}
                      disabled={isUpdating}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Termos e Condições */}
            <Card>
              <CardHeader>
                <CardTitle>Termos e Condições</CardTitle>
                <CardDescription>
                  Gerencie os termos exibidos no checkout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite um novo termo..."
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                  />
                  <Button onClick={handleAddTerm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {localTerms.map((term, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                      <span className="text-sm">{term}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTerm(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
