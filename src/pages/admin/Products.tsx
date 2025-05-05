import { useState, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, MoreHorizontal, Search, FileDown, Filter, Star, Trash2, Loader2, Trash, ArrowUpFromLine, Pencil } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductFilters } from "@/components/admin/ProductFilters";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useProducts } from "@/hooks/useProducts";
import { Pagination } from "@/components/ui/pagination";
import { FoodSelector } from "@/components/admin/FoodSelector";
import { useChangeableFoods } from "@/hooks/useChangeableFoods";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { Popup } from "@/components/ui/popup";
import { DialogCustom } from "@/components/ui/dialog-custom";
import { CustomAlertDialog } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ManageFoods } from "@/components/admin/ManageFoods";

interface ProductFilters {
  category_id?: number | null;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  is_active?: boolean;
}

export default function Products() {
  const { 
    products, 
    isLoading, 
    updateProduct, 
    softDeleteProducts, 
    toggleFeatured,
    deletedProducts,
    permanentDeleteProducts,
    restoreProducts
  } = useProducts();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  const [isFoodDialogOpen, setIsFoodDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<ProductFilters>({});
  const [editingCell, setEditingCell] = useState<{
    id: number;
    field: string;
    value: any;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isTrashDialogOpen, setIsTrashDialogOpen] = useState(false);
  const [selectedTrashIds, setSelectedTrashIds] = useState<number[]>([]);
  const itemsPerPage = 20; // Alterado para 20 itens por página
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
  const [tempFilters, setTempFilters] = useState<ProductFilters>({});
  const [isManageFoodsOpen, setIsManageFoodsOpen] = useState(false);
  const { clearSessionFoods } = useChangeableFoods();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter(product => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          product.title?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.category?.name?.toLowerCase().includes(searchLower) ||
          product.price.toString().includes(searchLower);
        
        if (!matchesSearch) return false;
      }
      
      if (filters.category_id && product.category_id !== filters.category_id) {
        return false;
      }
      
      if (filters.min_price && product.price < filters.min_price) {
        return false;
      }
      
      if (filters.max_price && product.price > filters.max_price) {
        return false;
      }
      
      if (filters.in_stock !== undefined) {
        if (filters.in_stock && product.stock <= 0) return false;
        if (!filters.in_stock && product.stock > 0) return false;
      }
      
      if (filters.is_active !== undefined && product.is_active !== filters.is_active) {
        return false;
      }
      
      return true;
    });
  }, [products, searchTerm, filters]);

  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleExportData = () => {
    // Implementar exportação
    const csvContent = "data:text/csv;charset=utf-8," + 
      "ID,Nome,Preço,Categoria,Estoque,Status\n" +
      products.map(p => `${p.id},${p.name},${p.price},${p.category},${p.stock},${p.status}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "produtos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Edição inline
  const handleCellEdit = async (id: number, field: string, value: any) => {
    try {
      await updateProduct.mutateAsync({ id, [field]: value });
      setEditingCell(null);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  // Exclusão em lote
  const handleBulkDelete = () => {
    setConfirmDialog({
      open: true,
      title: "Excluir Produtos",
      description: `Tem certeza que deseja mover ${selectedIds.length} produtos para a lixeira?`,
      onConfirm: () => {
        softDeleteProducts.mutateAsync(selectedIds);
        setSelectedIds([]);
      },
      variant: "destructive"
    });
  };

  // Toggle destaque
  const handleToggleFeatured = async (id: number, featured: boolean) => {
    try {
      await toggleFeatured.mutateAsync({ id, featured });
      toast.success(
        featured 
          ? "Produto colocado em Destaque" 
          : "Produto removido do Destaque"
      );
    } catch (error) {
      toast.error("Erro ao alterar destaque do produto");
    }
  };

  // Função para fechar o modal e limpar o estado
  const handleCloseDialog = async () => {
    setIsCreateDialogOpen(false);
    setIsEditingProduct(null);
  };

  // Função para exportar em CSV
  const exportToCSV = () => {
    // Ordenar produtos por ID em ordem crescente
    const sortedProducts = [...filteredProducts].sort((a, b) => a.id - b.id);

    // Definir cabeçalhos com acentuação correta
    const headers = [
      'ID',
      'Nome',
      'Descrição',
      'Preço (R$)',
      'Categoria',
      'Estoque',
      'Status',
      'Destaque',
      'Info. Nutricionais (por 100g)',
      'Calorias (kcal)',
      'Proteínas (g)',
      'Carboidratos (g)',
      'Gorduras (g)',
      'Fibras (g)',
      'Sódio (mg)'
    ].join(';');

    // Mapear produtos para o formato CSV
    const csvData = sortedProducts.map(product => {
      const nutritionalInfo = product.nutritional_info || {
        calories: 0,
        proteins: 0,
        carbs: 0,
        fats: 0,
        fiber: 0,
        sodium: 0
      };

      return [
        product.id,
        product.title,
        product.description || '',
        product.price.toFixed(2).replace('.', ','),
        product.category?.name || 'Sem categoria',
        product.stock,
        product.is_active ? 'Ativo' : 'Inativo',
        product.is_featured ? 'Sim' : 'Não',
        '', // Coluna vazia para separar info nutricional
        nutritionalInfo.calories,
        nutritionalInfo.proteins,
        nutritionalInfo.carbs,
        nutritionalInfo.fats,
        nutritionalInfo.fiber,
        nutritionalInfo.sodium
      ].join(';');
    }).join('\n');

    // Criar e fazer download do arquivo
    const blob = new Blob([`\uFEFF${headers}\n${csvData}`], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `produtos_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); // Liberar memória
  };

  // Função para exportar em PDF
  const exportToPDF = () => {
    // Implementar exportação PDF
    toast.error("Exportação em PDF será implementada em breve!");
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-muted-foreground">
            Gerencie os produtos do seu estabelecimento
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsCategoryDialogOpen(true)}
            >
              Gerenciar Categorias
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsManageFoodsOpen(true)}
            >
              Gerenciar Alimentos
            </Button>
            <ProductFilters 
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Produto
              </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar por nome, descrição, categoria, preço..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={() => setIsExportDialogOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white hover:text-white"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsTrashDialogOpen(true)}
            className="relative text-black hover:bg-red-50 hover:text-black border-red-300"
          >
            <Trash className="h-4 w-4 text-red-500" />
            Lixeira
            {deletedProducts?.length > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
                {deletedProducts.length}
              </span>
            )}
          </Button>
          {selectedIds.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              className="ml-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Selecionados ({selectedIds.length})
            </Button>
          )}
        </div>

        <div className="flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === (products?.length || 0)}
                    onCheckedChange={(checked) => {
                      if (checked && products) {
                        setSelectedIds(products.map(p => p.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Destaque</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Carregando produtos...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhum produto encontrado
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(product.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds([...selectedIds, product.id]);
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== product.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {editingCell?.id === product.id && editingCell.field === 'title' ? (
                        <Input
                          value={editingCell.value}
                          onChange={(e) => setEditingCell({
                            ...editingCell,
                            value: e.target.value
                          })}
                          onBlur={() => handleCellEdit(product.id, 'title', editingCell.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCellEdit(product.id, 'title', editingCell.value);
                            } else if (e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-secondary/50 p-1 rounded"
                          onClick={() => setEditingCell({
                            id: product.id,
                            field: 'title',
                            value: product.title
                          })}
                        >
                          {product.title}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{product.category?.name}</TableCell>
                    <TableCell>
                      {editingCell?.id === product.id && editingCell.field === 'price' ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editingCell.value}
                          onChange={(e) => setEditingCell({
                            ...editingCell,
                            value: parseFloat(e.target.value)
                          })}
                          onBlur={() => handleCellEdit(product.id, 'price', editingCell.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCellEdit(product.id, 'price', editingCell.value);
                            } else if (e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-secondary/50 p-1 rounded"
                          onClick={() => setEditingCell({
                            id: product.id,
                            field: 'price',
                            value: product.price
                          })}
                        >
                          R$ {product.price.toFixed(2)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCell?.id === product.id && editingCell.field === 'stock' ? (
                        <Input
                          type="number"
                          value={editingCell.value}
                          onChange={(e) => setEditingCell({
                            ...editingCell,
                            value: parseInt(e.target.value)
                          })}
                          onBlur={() => handleCellEdit(product.id, 'stock', editingCell.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCellEdit(product.id, 'stock', editingCell.value);
                            } else if (e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-secondary/50 p-1 rounded"
                          onClick={() => setEditingCell({
                            id: product.id,
                            field: 'stock',
                            value: product.stock
                          })}
                        >
                          {product.stock}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={product.is_active}
                        onCheckedChange={(checked) => 
                          handleCellEdit(product.id, 'is_active', checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleFeatured(product.id, !product.is_featured)}
                        className={`hover:bg-transparent h-7 w-7 transition-all duration-300 ${
                          product.is_featured 
                            ? "text-yellow-500 [&>svg]:fill-yellow-400" 
                            : "[&>svg]:hover:fill-yellow-400 hover:text-gray-800 hover:scale-110"
                        }`}
                        title={product.is_featured ? "Remover destaque" : "Destacar produto"}
                      >
                        <Star className="h-5 w-5" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setIsEditingProduct(product);
                            setIsCreateDialogOpen(true);
                          }}
                          title="Editar"
                          className="h-7 w-7"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setConfirmDialog({
                              open: true,
                              title: "Excluir Produto",
                              description: "Tem certeza que deseja mover este produto para a lixeira?",
                              onConfirm: () => softDeleteProducts.mutateAsync([product.id]),
                              variant: "destructive"
                            });
                          }}
                          className="h-7 w-7 text-destructive"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {!isLoading && filteredProducts.length > itemsPerPage && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredProducts.length / itemsPerPage)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Dialog de alimentos */}
        <DialogCustom
          open={isManageFoodsOpen}
          onOpenChange={setIsManageFoodsOpen}
          title="Gerenciar Alimentos"
        >
          <ManageFoods />
        </DialogCustom>

        {/* Dialog de categorias */}
        <DialogCustom 
          open={isCategoryDialogOpen} 
          onOpenChange={setIsCategoryDialogOpen}
          title="Gerenciar Categorias"
        >
          <CategoryManager onClose={() => setIsCategoryDialogOpen(false)} />
        </DialogCustom>

        {/* Dialog de criar/editar produto */}
        <DialogCustom 
          open={isCreateDialogOpen} 
          onOpenChange={(open) => {
            if (!open) handleCloseDialog();
            else setIsCreateDialogOpen(true);
          }}
          title={isEditingProduct ? "Editar Produto" : "Novo Produto"}
        >
          <ProductForm 
            initialData={isEditingProduct}
            onSubmit={handleCloseDialog}
          />
        </DialogCustom>

        {/* Dialog da lixeira */}
        <DialogCustom
          open={isTrashDialogOpen}
          onOpenChange={setIsTrashDialogOpen}
          title="Lixeira"
        >
          <div className="min-h-[400px] space-y-4">
            {deletedProducts?.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  {selectedTrashIds.length > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setConfirmDialog({
                          open: true,
                          title: "Restaurar Produtos",
                          description: `Tem certeza que deseja restaurar ${selectedTrashIds.length} produtos?`,
                          onConfirm: () => {
                            restoreProducts.mutateAsync(selectedTrashIds);
                            setSelectedTrashIds([]);
                          }
                        });
                      }}
                      className="gap-2"
                    >
                      <ArrowUpFromLine className="h-4 w-4" />
                      Restaurar Selecionados ({selectedTrashIds.length})
                    </Button>
                  )}
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      setConfirmDialog({
                        open: true,
                        title: "Esvaziar Lixeira",
                        description: "Tem certeza que deseja excluir permanentemente todos os itens da lixeira? Esta ação não poderá ser desfeita.",
                        onConfirm: () => {
                          permanentDeleteProducts.mutateAsync(deletedProducts.map(p => p.id));
                          setIsTrashDialogOpen(false);
                        }
                      });
                    }}
                    className="gap-2 ml-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                    Esvaziar Lixeira
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedTrashIds.length === deletedProducts.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTrashIds(deletedProducts.map(p => p.id));
                            } else {
                              setSelectedTrashIds([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Excluído em</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deletedProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTrashIds.includes(product.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTrashIds([...selectedTrashIds, product.id]);
                              } else {
                                setSelectedTrashIds(selectedTrashIds.filter(id => id !== product.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>{product.title}</TableCell>
                        <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(product.deleted_at!).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setConfirmDialog({
                                  open: true,
                                  title: "Restaurar Produto",
                                  description: "Tem certeza que deseja restaurar este produto?",
                                  onConfirm: () => restoreProducts.mutateAsync([product.id])
                                });
                              }}
                              title="Restaurar"
                            >
                              <ArrowUpFromLine className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setConfirmDialog({
                                  open: true,
                                  title: "Excluir Permanentemente",
                                  description: "Tem certeza que deseja excluir permanentemente este produto? Esta ação não poderá ser desfeita.",
                                  onConfirm: () => permanentDeleteProducts.mutateAsync([product.id]),
                                  variant: "destructive"
                                });
                              }}
                              className="text-destructive"
                              title="Excluir Permanentemente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Trash2 className="h-10 w-10 mb-2" />
                <p>Nenhum item na lixeira</p>
              </div>
            )}
          </div>
        </DialogCustom>

        <CustomAlertDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onConfirm={confirmDialog.onConfirm}
          variant={confirmDialog.variant}
        />

        <DialogCustom
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          title="Exportar Produtos"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escolha o formato de exportação desejado:
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  exportToCSV();
                  setIsExportDialogOpen(false);
                }}
                className="justify-start"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Exportar como CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  exportToPDF();
                  setIsExportDialogOpen(false);
                }}
                className="justify-start"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Exportar como PDF
              </Button>
            </div>
          </div>
        </DialogCustom>
      </div>
    </AdminLayout>
  );
}
