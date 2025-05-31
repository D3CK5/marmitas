import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Trash, FileDown, ArrowUpFromLine, Trash2 } from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { OrderDetails } from "@/components/admin/OrderDetails";
import { useAdminOrders, type Order } from "@/hooks/useAdminOrders";
import { formatPrice } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomAlertDialog } from "@/components/ui/alert-dialog";
import { DialogCustom } from "@/components/ui/dialog-custom";

export default function Orders() {
  const { 
    orders, 
    isLoading, 
    softDeleteOrders, 
    restoreOrders, 
    permanentDeleteOrders, 
    deletedOrders,
    isLoadingDeleted 
  } = useAdminOrders();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isTrashDialogOpen, setIsTrashDialogOpen] = useState(false);
  const [selectedTrashIds, setSelectedTrashIds] = useState<number[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: "destructive";
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Resetar seleção ao abrir/fechar o modal da lixeira
  useEffect(() => {
    if (!isTrashDialogOpen) {
      setSelectedTrashIds([]);
    }
  }, [isTrashDialogOpen]);

  const filteredOrders = orders?.filter(order => {
    const matchesStatus = selectedStatus === "all" ? true : order.status === selectedStatus;
    const matchesSearch = searchTerm
      ? order.id.toString().includes(searchTerm) ||
        order.user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  }) || [];

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredOrders.map(o => o.id) : []);
  };

  const handleSelectOrder = (id: number, checked: boolean) => {
    setSelectedIds(prev => 
      checked ? [...prev, id] : prev.filter(orderId => orderId !== id)
    );
  };

  const handleSelectAllTrash = (checked: boolean) => {
    setSelectedTrashIds(checked ? deletedOrders?.map(o => o.id) || [] : []);
  };

  const handleSelectTrashOrder = (id: number, checked: boolean) => {
    setSelectedTrashIds(prev => 
      checked ? [...prev, id] : prev.filter(orderId => orderId !== id)
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    setConfirmDialog({
      open: true,
      title: "Mover para Lixeira",
      description: `Tem certeza que deseja mover ${selectedIds.length} pedido(s) para a lixeira?`,
      onConfirm: () => {
        softDeleteOrders.mutateAsync(selectedIds);
        setSelectedIds([]);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
      variant: "destructive"
    });
  };

  const handleRestoreSelected = () => {
    if (selectedTrashIds.length === 0) return;
    
    setConfirmDialog({
      open: true,
      title: "Restaurar Pedidos",
      description: `Tem certeza que deseja restaurar ${selectedTrashIds.length} pedido(s)?`,
      onConfirm: () => {
        restoreOrders.mutateAsync(selectedTrashIds);
        setSelectedTrashIds([]);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handlePermanentDeleteSelected = () => {
    if (selectedTrashIds.length === 0) return;
    
    setConfirmDialog({
      open: true,
      title: "Excluir Permanentemente",
      description: `Tem certeza que deseja excluir permanentemente ${selectedTrashIds.length} pedido(s)? Esta ação não pode ser desfeita.`,
      onConfirm: () => {
        permanentDeleteOrders.mutateAsync(selectedTrashIds);
        setSelectedTrashIds([]);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
      variant: "destructive"
    });
  };

  const handleEmptyTrash = () => {
    if (!deletedOrders || deletedOrders.length === 0) return;
    
    setConfirmDialog({
      open: true,
      title: "Esvaziar Lixeira",
      description: `Tem certeza que deseja excluir permanentemente todos os ${deletedOrders.length} pedido(s) da lixeira? Esta ação não pode ser desfeita.`,
      onConfirm: () => {
        permanentDeleteOrders.mutateAsync(deletedOrders.map(o => o.id)).then(() => {
          setIsTrashDialogOpen(false);
        });
      },
      variant: "destructive"
    });
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie os pedidos do seu estabelecimento
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px]">
            <Label htmlFor="search" className="sr-only">
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar por número ou cliente..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="w-[180px]">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="awaiting_payment">Aguardando Pagamento</SelectItem>
                <SelectItem value="preparing">Em Preparação</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Botões alinhados à direita */}
          <div className="flex gap-2 ml-auto">
            <Button 
              variant="outline"
              onClick={() => {
                // Implementar exportação
              }}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            
            {deletedOrders && deletedOrders.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setIsTrashDialogOpen(true)}
              className="relative text-black hover:bg-red-50 hover:text-black border-red-300"
            >
              <Trash className="h-4 w-4 text-red-500" />
              Lixeira
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
                  {deletedOrders.length}
                </span>
              </Button>
              )}
            
            {selectedIds.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleDeleteSelected}
                className="relative text-black hover:bg-red-50 hover:text-black border-red-300"
              >
                <Trash className="h-4 w-4 text-red-500"/>
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
                  {selectedIds.length}
                </span>
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={selectedIds.length > 0 && selectedIds.length === filteredOrders.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecionar todos os pedidos"
                  />
                </TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Carregando pedidos...
                    </p>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(order.id)}
                        onCheckedChange={(checked) => 
                          handleSelectOrder(order.id, checked as boolean)
                        }
                        aria-label={`Selecionar pedido #${order.id}`}
                      />
                    </TableCell>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>{order.user.full_name}</TableCell>
                    <TableCell>{formatPrice(order.total)}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Pedido #{order.id}</DialogTitle>
                            </DialogHeader>
                            <OrderDetails 
                              order={order}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 text-red-500 hover:text-white hover:bg-amber-500"
                          onClick={() => {
                            setConfirmDialog({
                              open: true,
                              title: "Mover para Lixeira",
                              description: `Tem certeza que deseja mover o pedido #${order.id} para a lixeira?`,
                              onConfirm: () => {
                                softDeleteOrders.mutateAsync([order.id]);
                                setConfirmDialog(prev => ({ ...prev, open: false }));
                              },
                              variant: "destructive"
                            });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhum pedido encontrado
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal da Lixeira */}
      <DialogCustom
        open={isTrashDialogOpen}
        onOpenChange={setIsTrashDialogOpen}
        title="Lixeira"
        className="max-w-4xl"
      >
        {deletedOrders && deletedOrders.length > 0 ? (
          <>
            <div className="flex justify-between mb-4">
              {selectedTrashIds.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleRestoreSelected}
                  className="flex items-center"
                >
                  <ArrowUpFromLine className="mr-2 h-4 w-4" />
                  Restaurar Selecionados ({selectedTrashIds.length})
                </Button>
              )}
              <Button 
                variant="destructive" 
                onClick={handleEmptyTrash}
                className="ml-auto"
                disabled={permanentDeleteOrders.isPending}
              >
                {permanentDeleteOrders.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash className="mr-2 h-4 w-4" />
                    Esvaziar Lixeira
                  </>
                )}
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={
                          selectedTrashIds.length > 0 && 
                          deletedOrders && 
                          selectedTrashIds.length === deletedOrders.length
                        }
                        onCheckedChange={handleSelectAllTrash}
                        aria-label="Selecionar todos os pedidos na lixeira"
                      />
                    </TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Excluído em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingDeleted ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-muted-foreground">
                          Carregando pedidos...
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    deletedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedTrashIds.includes(order.id)}
                            onCheckedChange={(checked) => 
                              handleSelectTrashOrder(order.id, checked as boolean)
                            }
                            aria-label={`Selecionar pedido #${order.id}`}
                          />
                        </TableCell>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>{order.user.full_name}</TableCell>
                        <TableCell>{formatPrice(order.total)}</TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                        <TableCell>
                          {order.deleted_at && new Date(order.deleted_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-accent"
                              onClick={() => {
                                setConfirmDialog({
                                  open: true,
                                  title: "Restaurar Pedido",
                                  description: `Tem certeza que deseja restaurar o pedido #${order.id}?`,
                                  onConfirm: () => {
                                    restoreOrders.mutateAsync([order.id]);
                                    setConfirmDialog(prev => ({ ...prev, open: false }));
                                  }
                                });
                              }}
                            >
                              <ArrowUpFromLine className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0 text-red-500 hover:text-white hover:bg-amber-500"
                              onClick={() => {
                                setConfirmDialog({
                                  open: true,
                                  title: "Excluir Permanentemente",
                                  description: `Tem certeza que deseja excluir permanentemente o pedido #${order.id}? Esta ação não pode ser desfeita.`,
                                  onConfirm: () => {
                                    permanentDeleteOrders.mutateAsync([order.id]);
                                    setConfirmDialog(prev => ({ ...prev, open: false }));
                                  },
                                  variant: "destructive"
                                });
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <Trash className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">Nenhum item na lixeira</p>
          </div>
        )}
      </DialogCustom>

      <CustomAlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </AdminLayout>
  );
}
