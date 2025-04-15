
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeliveryArea {
  id: number;
  name: string;
  type: "fixed" | "variable";
  cepRange?: {
    start: string;
    end: string;
  };
  price: number;
  city?: string;
  isActive: boolean;
}

const deliveryAreas: DeliveryArea[] = [
  {
    id: 1,
    name: "Centro",
    type: "variable",
    cepRange: {
      start: "01000-000",
      end: "01999-999"
    },
    price: 10.00,
    isActive: true
  },
  {
    id: 2,
    name: "São Paulo",
    type: "fixed",
    city: "São Paulo",
    price: 15.00,
    isActive: true
  }
];

export default function DeliveryAreas() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<"fixed" | "variable">("fixed");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar criação de área de entrega
    toast.success("Área de entrega criada com sucesso");
    setIsDialogOpen(false);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Áreas de Entrega</h1>
          <p className="text-muted-foreground">
            Gerencie as áreas e preços de entrega
          </p>
        </div>

        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Área
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Área de Entrega</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Área</Label>
                  <Input id="name" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Entrega</Label>
                  <Select
                    value={deliveryType}
                    onValueChange={(value: "fixed" | "variable") =>
                      setDeliveryType(value)
                    }
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

                {deliveryType === "fixed" ? (
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" required />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cepStart">CEP Inicial</Label>
                      <Input id="cepStart" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cepEnd">CEP Final</Label>
                      <Input id="cepEnd" required />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="price">Valor da Entrega</Label>
                  <Input id="price" type="number" step="0.01" required />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="active" defaultChecked />
                  <Label htmlFor="active">Área Ativa</Label>
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
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Região</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryAreas.map((area) => (
                <TableRow key={area.id}>
                  <TableCell>{area.name}</TableCell>
                  <TableCell>
                    {area.type === "fixed" ? "Preço Fixo" : "Preço Variável"}
                  </TableCell>
                  <TableCell>
                    {area.type === "fixed"
                      ? area.city
                      : `${area.cepRange?.start} - ${area.cepRange?.end}`}
                  </TableCell>
                  <TableCell>R$ {area.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={area.isActive ? "default" : "secondary"}>
                      {area.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
