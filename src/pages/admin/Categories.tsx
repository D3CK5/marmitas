import { useState } from "react";
import { useCategories, Category } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Pencil, Trash, Lock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CustomAlertDialog } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

export default function Categories() {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory, refetchCategories } = useCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        if (editingCategory.is_default) {
          toast.error("A categoria padrão não pode ser alterada");
          setIsDialogOpen(false);
          return;
        }
        
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          name: newCategoryName,
        });
      } else {
        await createCategory.mutateAsync({ name: newCategoryName });
      }

      setIsDialogOpen(false);
      setEditingCategory(null);
      setNewCategoryName("");
      await refetchCategories();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleEdit = (category: Category) => {
    if (category.is_default) {
      toast.error("A categoria padrão não pode ser alterada");
      return;
    }
    
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setIsDialogOpen(true);
  };

  const handleDelete = (category: Category) => {
    if (category.is_default) {
      toast.error("A categoria padrão não pode ser excluída");
      return;
    }
    
    setConfirmDialog({
      open: true,
      title: "Excluir Categoria",
      description: `Tem certeza que deseja excluir a categoria "${category.name}"? Os produtos desta categoria serão movidos para "Sem Categoria".`,
      onConfirm: async () => {
        try {
          await deleteCategory.mutateAsync(category.id);
          await refetchCategories();
          setConfirmDialog(prev => ({ ...prev, open: false }));
        } catch (error) {
          console.error('Erro ao excluir categoria:', error);
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button onClick={() => {
          setEditingCategory(null);
          setNewCategoryName("");
          setIsDialogOpen(true);
        }}>
          Nova Categoria
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories?.map((category) => (
            <TableRow 
              key={category.id}
              className={category.is_default ? "bg-muted" : ""}
            >
              <TableCell>{category.id}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {category.name}
                  {category.is_default && (
                    <Badge variant="outline" className="ml-2">
                      <Lock className="h-3 w-3 mr-1" />
                      Padrão
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{category.slug}</TableCell>
              <TableCell>
                {format(new Date(category.created_at), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell className="space-x-2">
                {!category.is_default && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
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
        variant="destructive"
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </div>
  );
} 