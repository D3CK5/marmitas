import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Settings as SettingsIcon,
  BarChart3,
  Eye,
  Target,
  Link2,
  Check,
  MessageCircle,
  TestTube
} from "lucide-react";
import { useSettings, type PaymentMethods } from "@/hooks/useSettings";
import { useIntegrations } from "@/hooks/useIntegrations";
import { toast } from "sonner";

export default function Settings() {
  const { settings, isLoading, updatePaymentMethods, updateCheckoutTerms } = useSettings();
  const { 
    settings: integrations, 
    isLoading: integrationsLoading, 
    isUpdating, 
    updateGoogleAnalytics, 
    updateHotjar,
    updateFacebookPixel,
    updateGoogleTagManager,
    updateSettings 
  } = useIntegrations();

  const [newTerm, setNewTerm] = useState("");
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  // Estados para integrações
  const [gaId, setGaId] = useState("");
  const [gaEnabled, setGaEnabled] = useState(false);
  const [hotjarId, setHotjarId] = useState("");
  const [hotjarEnabled, setHotjarEnabled] = useState(false);
  const [fbPixelId, setFbPixelId] = useState("");
  const [fbPixelEnabled, setFbPixelEnabled] = useState(false);
  const [gtmId, setGtmId] = useState("");
  const [gtmEnabled, setGtmEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Estado local para editar termos
  const [localTerms, setLocalTerms] = useState<string[]>([]);

  // Sincronizar termos quando carregados
  useEffect(() => {
    if (settings?.checkout_terms) {
      setLocalTerms(settings.checkout_terms);
    }
  }, [settings?.checkout_terms]);

  // Sincronizar configurações de integrações
  useEffect(() => {
    if (integrations) {
      setGaId(integrations.google_analytics_id || "");
      setGaEnabled(integrations.is_google_analytics_enabled);
      setHotjarId(integrations.hotjar_id || "");
      setHotjarEnabled(integrations.is_hotjar_enabled);
      setFbPixelId(integrations.facebook_pixel_id || "");
      setFbPixelEnabled(integrations.is_facebook_pixel_enabled);
      setGtmId(integrations.google_tag_manager_id || "");
      setGtmEnabled(integrations.is_google_tag_manager_enabled);
      setWhatsappNumber(integrations.whatsapp_number || "");
    }
  }, [integrations]);

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
    
    setIsUpdatingPayment(true);
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
      setIsUpdatingPayment(false);
    }
  };

  // Handlers para integrações
  const handleSaveGoogleAnalytics = () => {
    if (!gaId.trim() && gaEnabled) {
      toast.error('Digite um ID válido do Google Analytics');
      return;
    }
    updateGoogleAnalytics(gaId.trim(), gaEnabled);
  };

  const handleSaveHotjar = () => {
    if (!hotjarId.trim() && hotjarEnabled) {
      toast.error('Digite um ID válido do Hotjar');
      return;
    }
    updateHotjar(hotjarId.trim(), hotjarEnabled);
  };

  const handleSaveFacebookPixel = () => {
    if (!fbPixelId.trim() && fbPixelEnabled) {
      toast.error('Digite um ID válido do Facebook Pixel');
      return;
    }
    updateFacebookPixel(fbPixelId.trim(), fbPixelEnabled);
  };

  const handleSaveGoogleTagManager = () => {
    if (!gtmId.trim() && gtmEnabled) {
      toast.error('Digite um ID válido do Google Tag Manager');
      return;
    }
    updateGoogleTagManager(gtmId.trim(), gtmEnabled);
  };

  const handleSaveWhatsApp = () => {
    // Validar formato do telefone
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10 || cleanNumber.length > 15) {
      toast.error('Digite um número de WhatsApp válido (com DDD)');
      return;
    }
    
    updateSettings({
      whatsapp_number: cleanNumber
    });
  };

  if (isLoading || integrationsLoading) {
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

        <Tabs defaultValue="integrations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="integrations">
              <Link2 className="mr-2 h-4 w-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="checkout">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Checkout
            </TabsTrigger>
          </TabsList>

          {/* Aba Integrações */}
          <TabsContent value="integrations" className="space-y-4">
            {/* Aviso de BETA */}
            <Alert className="border-2 border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50">
              <TestTube className="h-5 w-5 text-orange-600" />
              <AlertDescription className="ml-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-orange-800">🧪 INTEGRAÇÕES EM BETA</span>
                    <p className="text-orange-700 text-sm mt-1">
                      Funcionalidades de analytics e tracking estão em fase de testes. 
                      Configure com cuidado e monitore os resultados.
                    </p>
                  </div>
                  <Badge variant="outline" className="border-orange-500 text-orange-700 font-semibold">
                    BETA
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              {/* Google Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Google Analytics
                    <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">BETA</Badge>
                  </CardTitle>
                  <CardDescription>
                    Acompanhe o comportamento dos usuários e métricas de conversão
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ga-enabled">Ativar Google Analytics</Label>
                    <Switch
                      id="ga-enabled"
                      checked={gaEnabled}
                      onCheckedChange={setGaEnabled}
                      disabled={isUpdating}
                    />
                  </div>
                  
                  {gaEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="ga-id">Measurement ID (G-XXXXXXXXXX)</Label>
                      <Input
                        id="ga-id"
                        placeholder="G-XXXXXXXXXX"
                        value={gaId}
                        onChange={(e) => setGaId(e.target.value)}
                        disabled={isUpdating}
                      />
                      <p className="text-xs text-muted-foreground">
                        Encontre seu ID em Google Analytics → Admin → Propriedade → Streams de dados
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleSaveGoogleAnalytics}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <SettingsIcon className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Salvar Google Analytics
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Hotjar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-orange-500" />
                    Hotjar Heatmaps
                    <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">BETA</Badge>
                  </CardTitle>
                  <CardDescription>
                    Visualize mapas de calor e gravações das sessões dos usuários
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hotjar-enabled">Ativar Hotjar</Label>
                    <Switch
                      id="hotjar-enabled"
                      checked={hotjarEnabled}
                      onCheckedChange={setHotjarEnabled}
                      disabled={isUpdating}
                    />
                  </div>
                  
                  {hotjarEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="hotjar-id">Site ID</Label>
                      <Input
                        id="hotjar-id"
                        placeholder="1234567"
                        value={hotjarId}
                        onChange={(e) => setHotjarId(e.target.value)}
                        disabled={isUpdating}
                      />
                      <p className="text-xs text-muted-foreground">
                        Encontre seu ID em Hotjar → Sites & Organizations → Configurações
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleSaveHotjar}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <SettingsIcon className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Salvar Hotjar
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Facebook Pixel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Facebook Pixel
                    <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">BETA</Badge>
                  </CardTitle>
                  <CardDescription>
                    Acompanhe conversões e otimize campanhas no Facebook
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fb-enabled">Ativar Facebook Pixel</Label>
                    <Switch
                      id="fb-enabled"
                      checked={fbPixelEnabled}
                      onCheckedChange={setFbPixelEnabled}
                      disabled={isUpdating}
                    />
                  </div>
                  
                  {fbPixelEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="fb-id">Pixel ID</Label>
                      <Input
                        id="fb-id"
                        placeholder="1234567890123456"
                        value={fbPixelId}
                        onChange={(e) => setFbPixelId(e.target.value)}
                        disabled={isUpdating}
                      />
                      <p className="text-xs text-muted-foreground">
                        Encontre seu ID em Meta Business → Gerenciador de Eventos → Pixels
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleSaveFacebookPixel}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <SettingsIcon className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Salvar Facebook Pixel
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Google Tag Manager */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5 text-green-600" />
                    Google Tag Manager
                    <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">BETA</Badge>
                  </CardTitle>
                  <CardDescription>
                    Gerencie todas as tags e códigos de tracking em um só lugar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="gtm-enabled">Ativar Google Tag Manager</Label>
                    <Switch
                      id="gtm-enabled"
                      checked={gtmEnabled}
                      onCheckedChange={setGtmEnabled}
                      disabled={isUpdating}
                    />
                  </div>
                  
                  {gtmEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="gtm-id">Container ID (GTM-XXXXXXX)</Label>
                      <Input
                        id="gtm-id"
                        placeholder="GTM-XXXXXXX"
                        value={gtmId}
                        onChange={(e) => setGtmId(e.target.value)}
                        disabled={isUpdating}
                      />
                      <p className="text-xs text-muted-foreground">
                        Encontre seu ID em Google Tag Manager → Área de trabalho → ID do contêiner
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleSaveGoogleTagManager}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <SettingsIcon className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Salvar Google Tag Manager
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* WhatsApp Empresarial */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    WhatsApp Empresarial
                  </CardTitle>
                  <CardDescription>
                    Configure o número para recuperação de checkout abandonado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-number">Número do WhatsApp (com DDD)</Label>
                    <Input
                      id="whatsapp-number"
                      placeholder="5511999999999"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      disabled={isUpdating}
                    />
                    <p className="text-xs text-muted-foreground">
                      Formato: código do país + DDD + número (ex: 5511999999999)
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleSaveWhatsApp}
                    disabled={isUpdating}
                    className="w-full"
                  >
                    {isUpdating ? (
                      <>
                        <SettingsIcon className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Salvar WhatsApp
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Checkout */}
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
                        disabled={isUpdatingPayment}
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
