import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Trash2, Undo } from "lucide-react";

export default function Trash() {
  const { deletedProducts, isLoading, restoreProducts, permanentDeleteProducts } = useProducts();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleRestore = async () => {
    if (!selectedIds.length) return;
    if (confirm(`Restaurar ${selectedIds.length} produtos?`)) {
      await restoreProducts.mutateAsync(selectedIds);
      setSelectedIds([]);
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedIds.length) return;
    if (confirm(`Excluir permanentemente ${selectedIds.length} produtos?`)) {
      await permanentDeleteProducts.mutateAsync(selectedIds);
      setSelectedIds([]);
    }
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
        <h1 className="text-2xl font-bold">Lixeira</h1>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={handleRestore}
            disabled={!selectedIds.length}
          >
            <Undo className="mr-2 h-4 w-4" />
            Restaurar Selecionados
          </Button>
          <Button
            variant="destructive"
            onClick={handlePermanentDelete}
            disabled={!selectedIds.length}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Permanentemente
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.length === deletedProducts.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedIds(deletedProducts.map(p => p.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
              />
            </TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Excluído em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deletedProducts.map((product) => (
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
              <TableCell>{product.title}</TableCell>
              <TableCell>{product.category?.name}</TableCell>
              <TableCell>R$ {product.price.toFixed(2)}</TableCell>
              <TableCell>
                {format(new Date(product.deleted_at!), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 