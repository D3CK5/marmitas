import { useState } from "react";
import { useChangeableFoods } from "@/hooks/useChangeableFoods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomAlertDialog } from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash, Pencil } from "lucide-react";

export function ManageFoods() {
  const { foods, createFood, deleteFood } = useChangeableFoods();
  const [newFoodName, setNewFoodName] = useState("");
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

  const handleCreateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodName.trim()) return;

    try {
      await createFood.mutateAsync({ name: newFoodName });
      setNewFoodName("");
    } catch (error) {
      console.error("Erro ao criar alimento:", error);
    }
  };

  const handleDelete = (id: number, name: string) => {
    setConfirmDialog({
      open: true,
      title: "Excluir Alimento",
      description: `Tem certeza que deseja excluir o alimento "${name}"?`,
      onConfirm: () => deleteFood.mutateAsync(id)
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreateFood} className="flex gap-2">
        <Input
          placeholder="Nome do alimento"
          value={newFoodName}
          onChange={(e) => setNewFoodName(e.target.value)}
        />
        <Button type="submit" disabled={createFood.isPending}>
          Adicionar
        </Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {foods?.map((food) => (
            <TableRow key={food.id}>
              <TableCell>{food.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(food.id, food.name)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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