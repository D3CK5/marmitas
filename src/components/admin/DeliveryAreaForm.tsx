import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox, ComboboxItem } from "@/components/ui/combobox";
import { estados } from "@/data/estados-cidades";
import { useCidades } from "@/hooks/useCidades";
import { DeliveryArea } from "@/components/api/delivery-areas";
import { Loader2 } from "lucide-react";

interface DeliveryAreaFormProps {
  area?: DeliveryArea;
  onSubmit: (data: Partial<DeliveryArea>) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}

export function DeliveryAreaForm({ area, onSubmit, onCancel, isOpen }: DeliveryAreaFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<DeliveryArea>>({
    name: "",
    type: "fixed",
    state: "",
    city: "",
    neighborhood: "",
    price: 0,
    is_active: true,
    ...area
  });

  const estadosItems: ComboboxItem[] = estados.map(estado => ({
    value: estado.sigla,
    label: estado.nome
  }));

  const { cidades, isLoading: isLoadingCidades } = useCidades(formData.state || null);
  const cidadesItems: ComboboxItem[] = cidades.map(cidade => ({
    value: cidade.nome,
    label: cidade.nome
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{area ? "Editar Área de Entrega" : "Nova Área de Entrega"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Área</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Centro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Entrega</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as "fixed" | "variable" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Preço Fixo</SelectItem>
                <SelectItem value="variable">Preço Variável</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Combobox
                items={estadosItems}
                value={formData.state}
                onValueChange={(value) => setFormData({ ...formData, state: value, city: "" })}
                placeholder="Selecione o estado"
                searchPlaceholder="Digite para buscar..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Combobox
                items={cidadesItems}
                value={formData.city}
                onValueChange={(value) => setFormData({ ...formData, city: value })}
                placeholder={isLoadingCidades ? "Carregando..." : "Selecione a cidade"}
                searchPlaceholder="Digite para buscar..."
                className={isLoadingCidades ? "opacity-50" : ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              value={formData.neighborhood}
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              placeholder="Ex: Centro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Valor da Entrega</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Área Ativa</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isLoadingCidades}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : area ? (
                "Atualizar"
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 