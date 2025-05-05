import { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash, Lock } from "lucide-react";
import { toast } from "sonner";
import { CustomAlertDialog } from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";

interface CategoryManagerProps {
  onClose: () => void;
}

export function CategoryManager({ onClose }: CategoryManagerProps) {
  const queryClient = useQueryClient();
  const { categories, createCategory, updateCategory, deleteCategory, refetchCategories } = useCategories();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<{ id: number; name: string } | null>(null);
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

  // Recarregar categorias quando o componente for montado
  useEffect(() => {
    refetchCategories();
  }, [refetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Verificar se é a categoria padrão
        if (editingCategory.id === 1) {
          toast.error("A categoria padrão não pode ser alterada");
          return;
        }
        
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          name: newCategoryName,
        });
      } else {
        await createCategory.mutateAsync({ 
          name: newCategoryName
        });
      }

      setNewCategoryName("");
      setEditingCategory(null);
      await refetchCategories();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleDelete = (id: number, name: string, isDefault: boolean) => {
    // Verificar se é a categoria padrão
    if (isDefault) {
      toast.error("A categoria padrão não pode ser excluída");
      return;
    }
    
    setConfirmDialog({
      open: true,
      title: "Excluir Categoria",
      description: `Tem certeza que deseja excluir a categoria "${name}"? Os produtos desta categoria serão movidos para "Sem Categoria".`,
      onConfirm: async () => {
        try {
          await deleteCategory.mutateAsync(id);
          await refetchCategories();
          setConfirmDialog(prev => ({ ...prev, open: false }));
        } catch (error) {
          console.error('Erro ao excluir categoria:', error);
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <div className="flex-1">
          <Label htmlFor="categoryName" className="sr-only">
            Nome da Categoria
          </Label>
          <Input
            id="categoryName"
            placeholder="Nome da categoria"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            required
          />
        </div>
        <Button type="submit">
          {editingCategory ? "Atualizar" : "Adicionar"}
        </Button>
      </form>

      <div className="space-y-2">
        {categories?.map((category) => (
          <div
            key={category.id}
            className={`flex items-center justify-between rounded-lg border p-3 ${category.is_default ? 'bg-muted' : ''}`}
          >
            <div className="flex items-center gap-2">
              {category.is_default && <Lock className="h-4 w-4 text-muted-foreground" />}
              <span>{category.name}</span>
              {category.is_default && (
                <span className="text-xs text-muted-foreground">(Padrão)</span>
              )}
            </div>
            <div className="flex space-x-2">
              {!category.is_default ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingCategory({ id: category.id, name: category.name });
                      setNewCategoryName(category.name);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id, category.name, !!category.is_default)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <CustomAlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant="destructive"
      />
    </div>
  );
} 