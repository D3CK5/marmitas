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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MessageCircle, Edit, Trash2, Loader2, Pencil } from "lucide-react";
import { useCustomer, type Customer } from "@/hooks/useCustomer";
import { formatPrice } from "@/lib/utils";
import { CustomerDetails } from "@/components/admin/CustomerDetails";
import { CustomAlertDialog } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { CustomerDetails as ICustomerDetails } from "@/hooks/useCustomer";

export default function Customers() {
  const { customers, getCustomerDetails, updateCustomerStatus, deleteCustomer, updateCustomer } = useCustomer();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDetails, setCustomerDetails] = useState<ICustomerDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
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
      title: "Excluir Cliente",
      description: "Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.",
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

  const filteredCustomers = customers?.filter(customer => 
    customer?.is_admin !== true && 
    ((customer?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (customer?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (customer?.phone || '').includes(searchTerm))
  ) || [];

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
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Total Gasto</TableHead>
                <TableHead>Última Compra</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
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
                      variant={customer.is_active ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => updateCustomerStatus.mutateAsync({
                        userId: customer.id,
                        isActive: !customer.is_active
                      })}
                    >
                      {customer.is_active ? "Ativo" : "Inativo"}
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
              ))}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
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
