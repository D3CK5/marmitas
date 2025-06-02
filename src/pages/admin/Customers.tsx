import { useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, MessageCircle, Edit, Trash2, Loader2, Pencil, Plus } from "lucide-react";
import { useCustomer, type Customer, getCustomerActivityStatus, type CustomerActivityStatus } from "@/hooks/useCustomer";
import { formatPrice } from "@/lib/utils";
import { CustomerDetails } from "@/components/admin/CustomerDetails";
import { CustomAlertDialog } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { CustomerDetails as ICustomerDetails } from "@/hooks/useCustomer";
import { CustomerFilters } from "@/components/admin/CustomerFilters";
import { Label } from "@/components/ui/label";

interface CustomerFiltersType {
  activityStatus?: CustomerActivityStatus | "all";
}

export default function Customers() {
  const { customers, getCustomerDetails, updateCustomerStatus, deleteCustomer, updateCustomer, createCustomer } = useCustomer();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDetails, setCustomerDetails] = useState<ICustomerDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [filters, setFilters] = useState<CustomerFiltersType>({ activityStatus: "all" });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const handleViewDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsLoadingDetails(true);
    try {
      const details = await getCustomerDetails(customer.id);
      if (details) {
        setCustomerDetails(details);
      }
    } catch (error) {
      toast.error("Erro ao carregar detalhes do cliente");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleWhatsApp = (phone: string) => {
    const formattedPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/55${formattedPhone}`, "_blank");
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      open: true,
      title: "Excluir Cliente Permanentemente",
      description: "⚠️ ATENÇÃO: Esta ação irá excluir PERMANENTEMENTE o cliente e TODOS os dados relacionados (pedidos, endereços, etc.). Esta ação NÃO pode ser desfeita. Tem certeza que deseja continuar?",
      onConfirm: () => deleteCustomer.mutateAsync(id)
    });
  };

  const handleUpdateCustomer = async (data: Partial<Customer>) => {
    if (!selectedCustomer) return;
    try {
      await updateCustomer.mutateAsync({
        id: selectedCustomer.id,
        ...data
      });
      const details = await getCustomerDetails(selectedCustomer.id);
      if (details) {
        setCustomerDetails(details);
      }
    } catch (error) {
      toast.error("Erro ao atualizar cliente");
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createFormData.full_name || !createFormData.email || !createFormData.password) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createCustomer.mutateAsync(createFormData);
      setCreateFormData({
        full_name: "",
        email: "",
        phone: "",
        password: ""
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      full_name: "",
      email: "",
      phone: "",
      password: ""
    });
  };

  const getStatusBadgeVariant = (color: string) => {
    switch (color) {
      case 'green': return 'default';
      case 'yellow': return 'secondary';
      case 'orange': return 'outline';
      case 'red': return 'destructive';
      case 'gray': return 'secondary';
      default: return 'secondary';
    }
  };

  const filteredCustomers = customers?.filter(customer => {
    // Verificar se o cliente tem ID válido
    if (!customer?.id) return false;
    
    // Filtro básico para excluir admins
    if (customer?.is_admin === true) return false;
    
    // Filtro de busca por texto
    const matchesSearch = 
      (customer?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (customer?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer?.phone || '').includes(searchTerm);
    
    if (!matchesSearch) return false;
    
    // Filtro por status de atividade
    if (filters.activityStatus !== "all") {
      const activityStatus = getCustomerActivityStatus(customer.last_purchase);
      return activityStatus.status === filters.activityStatus;
    }
    
    return true;
  }) || [];

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie os clientes do seu estabelecimento
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <CustomerFilters 
            filters={filters}
            onFiltersChange={setFilters}
          />

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetCreateForm}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                <DialogDescription>
                  Preencha as informações abaixo para criar um novo cliente no sistema.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={createFormData.full_name}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Digite o e-mail"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Digite o telefone (opcional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Digite a senha"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCustomer.isPending}
                  >
                    {createCustomer.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar Cliente"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow key="header">
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Total Gasto</TableHead>
                <TableHead>Última Compra</TableHead>
                <TableHead>Atividade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const activityStatus = getCustomerActivityStatus(customer.last_purchase);
                
                return (
                <TableRow key={customer.id}>
                  <TableCell>{customer.full_name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{formatPrice(customer.total_spent)}</TableCell>
                  <TableCell>
                    {customer.last_purchase 
                      ? new Date(customer.last_purchase).toLocaleDateString("pt-BR")
                      : "Nunca comprou"}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={getStatusBadgeVariant(activityStatus.color)}
                      title={`${activityStatus.daysSinceLastPurchase} dias desde a última compra`}
                    >
                      {activityStatus.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-row gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(customer)}
                              title="Editar"
                              className="h-7 w-7"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Cliente</DialogTitle>
                            </DialogHeader>
                            {isLoadingDetails ? (
                              <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                              </div>
                            ) : customerDetails ? (
                              <CustomerDetails 
                                customer={customerDetails}
                                onUpdate={handleUpdateCustomer}
                              />
                            ) : null}
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(customer.id)}
                          title="Excluir"
                          className="h-7 w-7 text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleWhatsApp(customer.phone)}
                        title="WhatsApp"
                        className="h-7 w-7"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
              {filteredCustomers.length === 0 && (
                <TableRow key="no-customers-found">
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {filters.activityStatus && filters.activityStatus !== "all"
                      ? `Nenhum cliente encontrado com status "${filters.activityStatus}"`
                      : "Nenhum cliente encontrado"
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CustomAlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant="destructive"
      />
    </AdminLayout>
  );
}
