import { useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Shield,
  FileSpreadsheet,
  MessageCircle,
  ShoppingCart,
  Save,
  Plus,
  CreditCard,
  Trash2,
  Gauge,
  Download,
  BarChart,
  Mail,
  Clock,
  Activity,
  Database,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  type: "pix" | "credit_card";
  title: string;
  description: string;
  enabled: boolean;
  installments?: { value: string; label: string }[];
}

interface Term {
  id: string;
  content: string;
}

export default function Settings() {
  const [imageOptimization, setImageOptimization] = useState(true);
  const [cacheTime, setCacheTime] = useState("1h");
  const [newTerm, setNewTerm] = useState("");
  const [terms, setTerms] = useState<Term[]>([
    { id: "1", content: "O prazo de entrega é de até 60 minutos" },
    { id: "2", content: "Não aceitamos trocas ou devoluções após a entrega" },
    { id: "3", content: "Em caso de problemas, entre em contato conosco" }
  ]);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "pix",
      title: "PIX",
      description: "Pagamento instantâneo",
      enabled: true
    },
    {
      id: "2",
      type: "credit_card",
      title: "Cartão de Crédito",
      description: "Pagamento parcelado",
      enabled: true,
      installments: [
        { value: "1", label: "À vista" },
        { value: "2", label: "2 vezes" },
        { value: "3", label: "3 vezes" }
      ]
    }
  ]);

  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  const handleAddTerm = () => {
    if (newTerm.trim()) {
      setTerms([...terms, { id: Date.now().toString(), content: newTerm.trim() }]);
      setNewTerm("");
      toast.success("Termo adicionado com sucesso!");
    }
  };

  const handleRemoveTerm = (id: string) => {
    setTerms(terms.filter(term => term.id !== id));
    toast.success("Termo removido com sucesso!");
  };

  const handleTogglePaymentMethod = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(method =>
        method.id === id
          ? { ...method, enabled: !method.enabled }
          : method
      )
    );
  };

  const handleSaveSettings = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  const handleExportData = (type: string) => {
    toast.info(`Exportando dados em formato ${type}...`);
  };

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
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <MessageCircle className="mr-2 h-4 w-4" />
              Integrações
            </TabsTrigger>
            
            <TabsTrigger value="performance">
              <Gauge className="mr-2 h-4 w-4" />
              Performance
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
                {paymentMethods.map((method) => (
                  <div key={method.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{method.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {method.description}
                        </p>
                      </div>
                      <Switch
                        checked={method.enabled}
                        onCheckedChange={() => handleTogglePaymentMethod(method.id)}
                      />
                    </div>
                    {method.type === "credit_card" && method.enabled && (
                      <div className="ml-6 space-y-2">
                        <Label>Parcelas disponíveis</Label>
                        {method.installments?.map((inst) => (
                          <div key={inst.value} className="flex items-center space-x-2">
                            <span className="text-sm">{inst.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
                  {terms.map((term) => (
                    <div key={term.id} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                      <span className="text-sm">{term.content}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTerm(term.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>
                  Configure as opções de segurança do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticação em duas etapas</Label>
                    <p className="text-sm text-muted-foreground">
                      Ative para maior segurança
                    </p>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Frequência de Backup</Label>
                  <Select
                    value={backupFrequency}
                    onValueChange={setBackupFrequency}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Logs de Atividades</Label>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Activity className="mr-2 h-4 w-4" />
                      Ver Logs
                    </Button>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Logs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios</CardTitle>
                <CardDescription>
                  Configure e exporte relatórios do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Exportar Dados</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleExportData("pdf")}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Exportar PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleExportData("excel")}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Exportar Excel
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Relatórios Automáticos</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger>
                      <SelectValue placeholder="Frequência dos relatórios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Métricas Personalizadas</Label>
                  <Button variant="outline">
                    <BarChart className="mr-2 h-4 w-4" />
                    Configurar Métricas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integrações</CardTitle>
                <CardDescription>
                  Configure as integrações com serviços externos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Evolution API (WhatsApp)</Label>
                  <div className="flex gap-4">
                    <Input placeholder="URL da API" />
                    <Button>Conectar</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Serviço de SMS</Label>
                  <div className="flex gap-4">
                    <Input placeholder="API Key" type="password" />
                    <Button>Configurar</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Google Analytics</Label>
                  <div className="flex gap-4">
                    <Input placeholder="ID de Rastreamento" />
                    <Button>Ativar</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>E-mail Marketing</Label>
                  <div className="flex gap-4">
                    <Input placeholder="API Key do Serviço" type="password" />
                    <Button>Integrar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
                <CardDescription>
                  Otimize o desempenho do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Otimização de Imagens</Label>
                    <p className="text-sm text-muted-foreground">
                      Compressão automática de imagens
                    </p>
                  </div>
                  <Switch
                    checked={imageOptimization}
                    onCheckedChange={setImageOptimization}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cache do Sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Tempo de expiração do cache
                    </p>
                  </div>
                  <Select defaultValue="1h">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tempo de cache" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30m">30 minutos</SelectItem>
                      <SelectItem value="1h">1 hora</SelectItem>
                      <SelectItem value="4h">4 horas</SelectItem>
                      <SelectItem value="24h">24 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Monitoramento</Label>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Activity className="mr-2 h-4 w-4" />
                      Ver Métricas
                    </Button>
                    <Button variant="outline">
                      <Clock className="mr-2 h-4 w-4" />
                      Histórico
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Configurações
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
