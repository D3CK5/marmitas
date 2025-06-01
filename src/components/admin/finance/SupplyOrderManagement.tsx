import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Phone, Edit, Trash2, AlertTriangle, X, Check, Ban, Building2, Filter, Eye, Edit3, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinance, type SupplyOrder } from "@/hooks/useFinance";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CustomAlertDialog } from "@/components/ui/alert-dialog";

interface Product {
  id: string;
  name: string;
  quantity: string;
  price: string;
  numericPrice?: string;
}

interface SupplyOrderManagementProps {
  activeTab?: string;
}

export function SupplyOrderManagement({ activeTab = "orders" }: SupplyOrderManagementProps) {
  // Constantes para filtros
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Estados para filtros de pedidos / entregas (filtros visuais iniciam em "all")
  const [showSupplyOrderFilters, setShowSupplyOrderFilters] = useState(false);
  const [supplyOrderFilters, setSupplyOrderFilters] = useState<{ month?: number; year?: number }>({});
  const [filterSupplyOrderMonth, setFilterSupplyOrderMonth] = useState<string>("all");
  const [filterSupplyOrderYear, setFilterSupplyOrderYear] = useState<string>("all");

  const { 
    suppliers, 
    supplyOrders, 
    loadingSuppliers, 
    loadingSupplyOrders, 
    createSupplier, 
    createSupplyOrder,
    updateSupplyOrderStatus,
    updateSupplyOrder,
    deleteSupplier,
    updateSupplier,
    deleteSupplyOrder
  } = useFinance(undefined, 
    // Se não há filtros aplicados pelo usuário, usar filtro fixo do mês atual
    Object.keys(supplyOrderFilters).length > 0 
      ? supplyOrderFilters 
      : { month: currentMonth, year: currentYear }
  );

  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isSupplyOrderDialogOpen, setIsSupplyOrderDialogOpen] = useState(false);
  const [isViewSupplyOrderDialogOpen, setIsViewSupplyOrderDialogOpen] = useState(false);
  const [isEditSupplyOrderDialogOpen, setIsEditSupplyOrderDialogOpen] = useState(false);
  const [selectedSupplyOrder, setSelectedSupplyOrder] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState(activeTab);

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
    variant: "default" as "default" | "destructive"
  });

  const [supplierFormData, setSupplierFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    is_active: true,
  });

  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  const [products, setProducts] = useState<Product[]>([
    { id: "1", name: "", quantity: "", price: "" }
  ]);

  const [supplyOrderFormData, setSupplyOrderFormData] = useState({
    supplier_id: "",
    delivery_date: "",
    notes: "",
    status: "pending" as const,
  });

  // Gerar lista de anos (3 anos anteriores até 1 ano futuro)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i);

  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  // Funções de filtros
  const applySupplyOrderFilter = () => {
    const newFilters: { month?: number; year?: number } = {};
    
    if (filterSupplyOrderMonth !== 'all') newFilters.month = parseInt(filterSupplyOrderMonth);
    if (filterSupplyOrderYear !== 'all') newFilters.year = parseInt(filterSupplyOrderYear);
    
    // Se não há filtros, usar undefined para buscar todos os pedidos
    if (Object.keys(newFilters).length === 0) {
      setSupplyOrderFilters({});
    } else {
      setSupplyOrderFilters(newFilters);
    }
  };

  const clearSupplyOrderFilters = () => {
    setSupplyOrderFilters({});
    setFilterSupplyOrderMonth("all");
    setFilterSupplyOrderYear("all");
  };

  const addProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: "",
      quantity: "",
      price: ""
    };
    setProducts([...products, newProduct]);
  };

  const removeProduct = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter(product => product.id !== id));
    }
  };

  const updateProduct = (id: string, field: keyof Product, value: string) => {
    setProducts(products.map(product => {
      if (product.id === id) {
        if (field === 'price') {
          // Formatar o preço conforme digita
          const formattedPrice = formatPriceInput(value);
          const numericValue = extractNumericValue(formattedPrice);
          return { 
            ...product, 
            [field]: formattedPrice,
            // Armazenar valor numérico para cálculos
            numericPrice: numericValue
          };
        }
        return { ...product, [field]: value };
      }
      return product;
    }));
  };

  const getTotalAmount = () => {
    return products.reduce((total, product) => {
      const price = parseFloat(product.numericPrice || product.price) || 0;
      return total + price;
    }, 0);
  };

  const getProductsDescription = () => {
    return products
      .filter(product => product.name.trim())
      .map(product => `${product.name} (${product.quantity})`)
      .join(", ");
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSupplier) {
        await updateSupplier.mutateAsync({
          id: editingSupplier.id,
          ...supplierFormData
        });
      } else {
        await createSupplier.mutateAsync(supplierFormData);
      }

      setSupplierFormData({
        name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
        is_active: true,
      });
      setEditingSupplier(null);
      setIsSupplierDialogOpen(false);
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
    }
  };

  const resetSupplierForm = () => {
    setSupplierFormData({
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      is_active: true,
    });
    setEditingSupplier(null);
  };

  const openEditSupplierDialog = (supplier: any) => {
    setSupplierFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
      is_active: supplier.is_active,
    });
    setEditingSupplier(supplier);
    setIsSupplierDialogOpen(true);
  };

  const handleSupplyOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validProducts = products.filter(product => 
      product.name.trim() && product.quantity.trim() && (product.numericPrice || product.price).trim()
    );

    if (validProducts.length === 0) {
      alert("Adicione pelo menos um produto válido");
      return;
    }
    
    try {
      // Criar dados completos dos produtos para salvar
      const productsData = validProducts.map(product => ({
        name: product.name,
        quantity: product.quantity,
        price: parseFloat(product.numericPrice || extractNumericValue(product.price)) || 0
      }));

      // Criar notes que combinam observações do usuário + dados dos produtos
      const notesWithProducts = {
        userNotes: supplyOrderFormData.notes || "",
        products: productsData
      };

      const orderData = {
        supplier_id: Number(supplyOrderFormData.supplier_id),
        description: getProductsDescription(),
        amount: getTotalAmount(),
        quantity: validProducts.length > 1 ? `${validProducts.length} itens` : validProducts[0].quantity,
        delivery_date: supplyOrderFormData.delivery_date,
        notes: JSON.stringify(notesWithProducts),
        status: supplyOrderFormData.status,
      };

      if (selectedSupplyOrder) {
        // Modo edição
        await updateSupplyOrder.mutateAsync({
          id: selectedSupplyOrder.id,
          ...orderData,
        });
        setIsEditSupplyOrderDialogOpen(false);
        setSelectedSupplyOrder(null);
      } else {
        // Modo criação
        await createSupplyOrder.mutateAsync(orderData);
        setIsSupplyOrderDialogOpen(false);
      }

      setProducts([{ id: "1", name: "", quantity: "", price: "" }]);
      setSupplyOrderFormData({
        supplier_id: "",
        delivery_date: "",
        notes: "",
        status: "pending",
      });
    } catch (error) {
      console.error('Erro ao salvar pedido de insumo:', error);
    }
  };

  const getStatusBadge = (status: SupplyOrder['status']) => {
    const variants = {
      pending: { variant: "secondary" as const, label: "Pendente", className: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100" },
      today: { variant: "default" as const, label: "Entrega Hoje", className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100" },
      delivered: { variant: "default" as const, label: "Entregue", className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100" },
      overdue: { variant: "destructive" as const, label: "Atrasado", className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100" },
      cancelled: { variant: "destructive" as const, label: "Cancelado", className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100" },
    };
    
    return variants[status];
  };

  const handleWhatsApp = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${cleanPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCancelOrder = (orderId: number) => {
    setConfirmDialog({
      open: true,
      title: "Cancelar Pedido",
      description: "Tem certeza que deseja cancelar este pedido?",
      onConfirm: () => {
        updateSupplyOrderStatus.mutate({
          id: orderId,
          status: 'cancelled'
        });
      },
      variant: "destructive"
    });
  };

  const handleDeliveryApproval = (orderId: number) => {
    updateSupplyOrderStatus.mutate({
      id: orderId,
      status: 'delivered'
    });
  };

  const handleDeleteSupplier = (supplierId: number, supplierName: string) => {
    setConfirmDialog({
      open: true,
      title: "Excluir Fornecedor",
      description: `Tem certeza que deseja excluir o fornecedor "${supplierName}"? Esta ação não pode ser desfeita.`,
      onConfirm: () => {
        deleteSupplier.mutate(supplierId);
      },
      variant: "destructive"
    });
  };

  const handleDeleteSupplyOrder = (orderId: number, description: string) => {
    setConfirmDialog({
      open: true,
      title: "Excluir Pedido",
      description: `Tem certeza que deseja excluir o pedido "${description}"? Esta ação não pode ser desfeita.`,
      onConfirm: () => {
        deleteSupplyOrder.mutate(orderId);
        setIsViewSupplyOrderDialogOpen(false); // Fechar o modal após excluir
      },
      variant: "destructive"
    });
  };

  const handleViewSupplyOrder = (order: any) => {
    setSelectedSupplyOrder(order);
    setIsViewSupplyOrderDialogOpen(true);
  };

  const handleEditSupplyOrder = (order: any) => {
    setSelectedSupplyOrder(order);
    
    let productsList: Product[] = [];
    let userNotes = "";

    try {
      // Tentar recuperar dados dos produtos do JSON
      if (order.notes) {
        const notesData = JSON.parse(order.notes);
        if (notesData.products && Array.isArray(notesData.products)) {
          // Usar dados salvos dos produtos
          productsList = notesData.products.map((product: any, index: number) => ({
            id: (index + 1).toString(),
            name: product.name || "",
            quantity: product.quantity || "",
            price: formatPriceInput((product.price * 100).toString()),
            numericPrice: product.price.toString()
          }));
          userNotes = notesData.userNotes || "";
        } else {
          // Fallback para formato antigo
          userNotes = order.notes;
          throw new Error("Formato antigo");
        }
      } else {
        throw new Error("Sem notes");
      }
    } catch (error) {
      // Fallback: usar método antigo (dividir valor total)
      productsList = order.description.split(', ').map((item: string, index: number) => {
        const priceValue = (order.amount / order.description.split(', ').length).toFixed(2);
        const formattedPrice = formatPriceInput((parseFloat(priceValue) * 100).toString());
        
        return {
          id: (index + 1).toString(),
          name: item.split(' (')[0],
          quantity: item.includes('(') ? item.split('(')[1].split(')')[0] : '',
          price: formattedPrice,
          numericPrice: priceValue
        };
      });
      userNotes = order.notes || "";
    }

    setProducts(productsList);
    setSupplyOrderFormData({
      supplier_id: order.supplier_id.toString(),
      delivery_date: order.delivery_date,
      notes: userNotes,
      status: order.status,
    });
    setIsEditSupplyOrderDialogOpen(true);
  };

  const getProductCount = (description: string) => {
    if (!description) return "0 produtos";
    const products = description.split(', ').length;
    return `${products} produto${products !== 1 ? 's' : ''}`;
  };

  // Função para formatar preço conforme digita
  const formatPriceInput = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Se vazio, retorna vazio
    if (!numbers) return '';
    
    // Converte para centavos e depois para reais
    const amount = parseInt(numbers) / 100;
    
    // Formata como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Função para extrair valor numérico do preço formatado
  const extractNumericValue = (formattedValue: string): string => {
    const numbers = formattedValue.replace(/\D/g, '');
    if (!numbers) return '';
    return (parseInt(numbers) / 100).toFixed(2);
  };

  // Função para formatar data sem conversão de timezone
  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return '';
    // Se a data está no formato YYYY-MM-DD, formatar diretamente
    if (dateString.includes('-') && dateString.length >= 10) {
      const [year, month, day] = dateString.split('T')[0].split('-');
      return `${day}/${month}/${year}`;
    }
    return dateString;
  };

  // Se activeTab for "suppliers", mostra apenas fornecedores
  if (activeTab === "suppliers") {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Fornecedores
          </CardTitle>
          <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetSupplierForm}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSupplierSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    value={supplierFormData.name}
                    onChange={(e) => setSupplierFormData({ 
                      ...supplierFormData, 
                      name: e.target.value 
                    })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_person">Pessoa de Contato</Label>
                  <Input
                    id="contact_person"
                    value={supplierFormData.contact_person}
                    onChange={(e) => setSupplierFormData({ 
                      ...supplierFormData, 
                      contact_person: e.target.value 
                    })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={supplierFormData.phone}
                      onChange={(e) => setSupplierFormData({ 
                        ...supplierFormData, 
                        phone: e.target.value 
                      })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={supplierFormData.email}
                      onChange={(e) => setSupplierFormData({ 
                        ...supplierFormData, 
                        email: e.target.value 
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea
                    id="address"
                    value={supplierFormData.address}
                    onChange={(e) => setSupplierFormData({ 
                      ...supplierFormData, 
                      address: e.target.value 
                    })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={supplierFormData.notes}
                    onChange={(e) => setSupplierFormData({ 
                      ...supplierFormData, 
                      notes: e.target.value 
                    })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsSupplierDialogOpen(false);
                      resetSupplierForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createSupplier.isPending || updateSupplier.isPending}
                  >
                    {(createSupplier.isPending || updateSupplier.isPending) 
                      ? "Salvando..." 
                      : "Salvar"
                    }
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loadingSuppliers ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Carregando fornecedores...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers && suppliers.length > 0 ? (
                    suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{supplier.name}</div>
                            {supplier.address && (
                              <div className="text-sm text-muted-foreground">
                                {supplier.address}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {supplier.contact_person || '-'}
                        </TableCell>
                        <TableCell>{supplier.phone || '-'}</TableCell>
                        <TableCell>{supplier.email || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={supplier.is_active ? "default" : "secondary"}>
                            {supplier.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                            {supplier.phone && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleWhatsApp(supplier.phone)}
                                title="Conversar no WhatsApp"
                                className="h-7 w-7"
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditSupplierDialog(supplier)}
                              title="Editar fornecedor"
                              className="h-7 w-7"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                              title="Excluir fornecedor"
                              className="h-7 w-7 text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum fornecedor encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
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
      </Card>
    );
  }

  // Se activeTab for "orders", mostra apenas pedidos / entregas
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pedidos / Entregas</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSupplyOrderFilters(!showSupplyOrderFilters)}
            className={Object.keys(supplyOrderFilters).length > 0 ? "border-blue-500 text-blue-600" : ""}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {Object.keys(supplyOrderFilters).length > 0 && (
              <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {Object.keys(supplyOrderFilters).length}
              </span>
            )}
          </Button>
          <Dialog open={isSupplyOrderDialogOpen} onOpenChange={setIsSupplyOrderDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Pedido de Insumo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSupplyOrderSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Fornecedor</Label>
                  <Select
                    value={supplyOrderFormData.supplier_id}
                    onValueChange={(value) => setSupplyOrderFormData({ 
                      ...supplyOrderFormData, 
                      supplier_id: value 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Produtos</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addProduct}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Produto
                    </Button>
                  </div>

                  {products.map((product, index) => (
                    <div key={product.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Produto {index + 1}</Label>
                        {products.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(product.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`product-name-${product.id}`}>Nome do Produto</Label>
                        <Input
                          id={`product-name-${product.id}`}
                          value={product.name}
                          onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                          placeholder="Ex: Frango orgânico"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`product-quantity-${product.id}`}>Quantidade</Label>
                          <Input
                            id={`product-quantity-${product.id}`}
                            value={product.quantity}
                            onChange={(e) => updateProduct(product.id, "quantity", e.target.value)}
                            placeholder="Ex: 10kg, 5 unidades"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`product-price-${product.id}`}>Preço</Label>
                          <Input
                            id={`product-price-${product.id}`}
                            type="text"
                            value={product.price}
                            onChange={(e) => updateProduct(product.id, "price", e.target.value)}
                            placeholder="R$ 0,00"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total do Pedido:</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(getTotalAmount())}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_date">Data de Entrega</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={supplyOrderFormData.delivery_date}
                    onChange={(e) => setSupplyOrderFormData({ 
                      ...supplyOrderFormData, 
                      delivery_date: e.target.value 
                    })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={supplyOrderFormData.notes}
                    onChange={(e) => setSupplyOrderFormData({ 
                      ...supplyOrderFormData, 
                      notes: e.target.value 
                    })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSupplyOrderDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createSupplyOrder.isPending}>
                    {createSupplyOrder.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      {showSupplyOrderFilters && (
        <CardContent className="border-t bg-muted/20 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter-supply-month" className="text-sm font-medium">Mês</Label>
                <Select value={filterSupplyOrderMonth} onValueChange={setFilterSupplyOrderMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os meses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-supply-year" className="text-sm font-medium">Ano</Label>
                <Select value={filterSupplyOrderYear} onValueChange={setFilterSupplyOrderYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os anos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os anos</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 items-end">
                <Button onClick={applySupplyOrderFilter} size="icon" title="Aplicar filtros">
                  <Check className="h-4 w-4" />
                </Button>
                {Object.keys(supplyOrderFilters).length > 0 && (
                  <Button variant="outline" onClick={clearSupplyOrderFilters} size="icon" title="Limpar filtros">
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFilterSupplyOrderMonth(currentMonth.toString());
                    setFilterSupplyOrderYear(currentYear.toString());
                    setSupplyOrderFilters({ month: currentMonth, year: currentYear });
                  }}
                  title="Filtrar pelo mês atual"
                  className="text-xs"
                >
                  Atual
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      )}
      
      <CardContent>
        {loadingSupplyOrders ? (
          <div className="space-y-3">
            <div className="rounded-md border">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Entrega</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="flex items-center justify-center py-4">
              <p className="text-muted-foreground text-sm">Carregando pedidos e entregas...</p>
            </div>
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 border-b">
                  <TableRow>
                    <TableHead className="font-semibold">Fornecedor</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                    <TableHead className="font-semibold">Quantidade</TableHead>
                    <TableHead className="font-semibold">Valor</TableHead>
                    <TableHead className="font-semibold">Entrega</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplyOrders && supplyOrders.length > 0 ? (
                    supplyOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.supplier?.name || 'Fornecedor não encontrado'}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate" title={order.description}>
                            {order.description}
                          </div>
                        </TableCell>
                        <TableCell>{getProductCount(order.description)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(Number(order.amount))}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {formatDateDisplay(order.delivery_date)}
                            {order.status === 'overdue' && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            {order.status === 'today' && (
                              <AlertTriangle className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getStatusBadge(order.status).variant}
                            className={getStatusBadge(order.status).className}
                          >
                            {getStatusBadge(order.status).label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                            {/* Primeira linha: Aprovar e Cancelar */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeliveryApproval(order.id)}
                              title={order.status === 'delivered' ? 'Já entregue' : 'Aprovar Entrega'}
                              className="h-7 w-7"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon" 
                              onClick={() => handleCancelOrder(order.id)}
                              title={order.status === 'cancelled' ? 'Já cancelado' : 'Cancelar Pedido'}
                              className="h-7 w-7 text-destructive"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                            {/* Segunda linha: Visualizar e Editar */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewSupplyOrder(order)}
                              title="Visualizar detalhes do pedido"
                              className="h-7 w-7"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSupplyOrder(order)}
                              title="Editar pedido"
                              className="h-7 w-7"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-4xl">📦</div>
                          <div className="font-medium">
                            {Object.keys(supplyOrderFilters).length > 0 
                              ? "Nenhum pedido encontrado"
                              : "Nenhum pedido de insumo cadastrado"
                            }
                          </div>
                          <div className="text-sm">
                            {Object.keys(supplyOrderFilters).length > 0 ? (
                              <div className="space-y-1">
                                <div>
                                  Período filtrado:{" "}
                                  {supplyOrderFilters.month && (
                                    <span className="font-medium">
                                      {months.find(m => m.value === supplyOrderFilters.month)?.label}
                                    </span>
                                  )}
                                  {supplyOrderFilters.month && supplyOrderFilters.year && " de "}
                                  {supplyOrderFilters.year && (
                                    <span className="font-medium">
                                      {supplyOrderFilters.year}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Tente selecionar um período diferente ou verificar se há pedidos cadastrados neste período
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div>Mostrando apenas pedidos do mês atual</div>
                                <div className="text-xs text-muted-foreground">
                                  Use os filtros para ver pedidos de outros períodos
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {supplyOrders && supplyOrders.length > 0 && (
              <div className="border-t px-4 py-3 bg-muted/20">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {supplyOrders.length} pedido{supplyOrders.length !== 1 ? 's' : ''}
                    {Object.keys(supplyOrderFilters).length > 0 && (
                      <span className="ml-1">
                        (filtrado{supplyOrders.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </span>
                  <span className="font-medium text-foreground">
                    Total: {formatCurrency(
                      supplyOrders.reduce((sum, order) => sum + Number(order.amount), 0)
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Modal de Visualização do Pedido */}
      <Dialog open={isViewSupplyOrderDialogOpen} onOpenChange={setIsViewSupplyOrderDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido de Insumo</DialogTitle>
          </DialogHeader>
          {selectedSupplyOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Fornecedor</Label>
                  <p className="font-medium">{selectedSupplyOrder.supplier?.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div>
                    <Badge 
                      variant={getStatusBadge(selectedSupplyOrder.status).variant}
                      className={getStatusBadge(selectedSupplyOrder.status).className}
                    >
                      {getStatusBadge(selectedSupplyOrder.status).label}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Data de Entrega</Label>
                  <p>{formatDateDisplay(selectedSupplyOrder.delivery_date)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Valor Total</Label>
                  <p className="font-medium text-lg">{formatCurrency(Number(selectedSupplyOrder.amount))}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Produtos</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  {(() => {
                    try {
                      // Tentar usar dados salvos dos produtos
                      if (selectedSupplyOrder.notes) {
                        const notesData = JSON.parse(selectedSupplyOrder.notes);
                        if (notesData.products && Array.isArray(notesData.products)) {
                          return notesData.products.map((product: any, index: number) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">{product.quantity}</p>
                              </div>
                              <span className="font-medium">
                                {formatCurrency(product.price)}
                              </span>
                            </div>
                          ));
                        }
                      }
                      throw new Error("Fallback");
                    } catch (error) {
                      // Fallback para método antigo
                      return selectedSupplyOrder.description.split(', ').map((product: string, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <div>
                            <p className="font-medium">{product.split(' (')[0]}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.includes('(') ? product.split('(')[1].split(')')[0] : 'Quantidade não especificada'}
                            </p>
                          </div>
                          <span className="font-medium">
                            {formatCurrency(selectedSupplyOrder.amount / selectedSupplyOrder.description.split(', ').length)}
                          </span>
                        </div>
                      ));
                    }
                  })()}
                </div>
              </div>

              {(() => {
                try {
                  // Tentar extrair observações do usuário do JSON
                  if (selectedSupplyOrder.notes) {
                    const notesData = JSON.parse(selectedSupplyOrder.notes);
                    if (notesData.userNotes && notesData.userNotes.trim()) {
                      return (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
                          <p className="p-3 bg-muted rounded-lg">{notesData.userNotes}</p>
                        </div>
                      );
                    }
                  }
                } catch (error) {
                  // Fallback para formato antigo
                  if (selectedSupplyOrder.notes && selectedSupplyOrder.notes.trim()) {
                    return (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
                        <p className="p-3 bg-muted rounded-lg">{selectedSupplyOrder.notes}</p>
                      </div>
                    );
                  }
                }
                return null;
              })()}

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Criado em:</span> {formatDateDisplay(selectedSupplyOrder.created_at)}
                </div>
                <div>
                  <span className="font-medium">Atualizado em:</span> {formatDateDisplay(selectedSupplyOrder.updated_at)}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => handleDeleteSupplyOrder(selectedSupplyOrder.id, selectedSupplyOrder.description)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Pedido
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsViewSupplyOrderDialogOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição do Pedido */}
      <Dialog open={isEditSupplyOrderDialogOpen} onOpenChange={setIsEditSupplyOrderDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Pedido de Insumo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSupplyOrderSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Fornecedor</Label>
              <Select
                value={supplyOrderFormData.supplier_id}
                onValueChange={(value) => setSupplyOrderFormData({ 
                  ...supplyOrderFormData, 
                  supplier_id: value 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Produtos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProduct}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Produto
                </Button>
              </div>

              {products.map((product, index) => (
                <div key={product.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Produto {index + 1}</Label>
                    {products.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(product.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`product-name-${product.id}`}>Nome do Produto</Label>
                    <Input
                      id={`product-name-${product.id}`}
                      value={product.name}
                      onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                      placeholder="Ex: Frango orgânico"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`product-quantity-${product.id}`}>Quantidade</Label>
                      <Input
                        id={`product-quantity-${product.id}`}
                        value={product.quantity}
                        onChange={(e) => updateProduct(product.id, "quantity", e.target.value)}
                        placeholder="Ex: 10kg, 5 unidades"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`product-price-${product.id}`}>Preço</Label>
                      <Input
                        id={`product-price-${product.id}`}
                        type="text"
                        value={product.price}
                        onChange={(e) => updateProduct(product.id, "price", e.target.value)}
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total do Pedido:</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(getTotalAmount())}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_date">Data de Entrega</Label>
              <Input
                id="delivery_date"
                type="date"
                value={supplyOrderFormData.delivery_date}
                onChange={(e) => setSupplyOrderFormData({ 
                  ...supplyOrderFormData, 
                  delivery_date: e.target.value 
                })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={supplyOrderFormData.notes}
                onChange={(e) => setSupplyOrderFormData({ 
                  ...supplyOrderFormData, 
                  notes: e.target.value 
                })}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditSupplyOrderDialogOpen(false);
                  setSelectedSupplyOrder(null);
                  setProducts([{ id: "1", name: "", quantity: "", price: "" }]);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createSupplyOrder.isPending || updateSupplyOrder.isPending}>
                {(createSupplyOrder.isPending || updateSupplyOrder.isPending) ? "Salvando..." : selectedSupplyOrder ? "Salvar Alterações" : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
    </Card>
  );
} 