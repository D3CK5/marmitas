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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CustomAlertDialog } from "@/components/ui/alert-dialog";
import { useIBGE } from "@/hooks/useIBGE";
import { 
  type DeliveryArea,
  getDeliveryAreas,
  createDeliveryArea,
  updateDeliveryArea,
  deleteDeliveryArea
} from "@/components/api/delivery-areas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DeliveryAreas() {
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null);
  const { states, cities, loading: ibgeLoading, error: ibgeError, fetchCities } = useIBGE();
  const [formData, setFormData] = useState<{
    name: string;
    type: "fixed" | "variable";
    state: string;
    city: string;
    neighborhood: string;
    price: string;
    is_active: boolean;
  }>({
    name: "",
    type: "fixed",
    state: "",
    city: "",
    neighborhood: "",
    price: "",
    is_active: true
  });

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

  useEffect(() => {
    loadDeliveryAreas();
  }, []);

  useEffect(() => {
    if (formData.state) {
      fetchCities(formData.state);
    }
  }, [formData.state]);

  async function loadDeliveryAreas() {
    try {
      const data = await getDeliveryAreas();
      setAreas(data);
    } catch (error) {
      toast.error("Erro ao carregar áreas de entrega");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const areaData = {
        name: formData.name,
        type: formData.type,
        state: formData.state,
        city: formData.city,
        neighborhood: formData.neighborhood,
        price: parseFloat(formData.price),
        is_active: formData.is_active
      };

      if (editingArea) {
        await updateDeliveryArea(editingArea.id.toString(), areaData);
        toast.success("Área de entrega atualizada com sucesso");
      } else {
        await createDeliveryArea(areaData);
        toast.success("Área de entrega criada com sucesso");
      }

      setIsDialogOpen(false);
      loadDeliveryAreas();
      resetForm();
    } catch (error) {
      toast.error("Erro ao salvar área de entrega");
    }
  };

  const handleEdit = (area: DeliveryArea) => {
    setEditingArea(area);
    setFormData({
      name: area.name,
      type: area.type,
      state: area.state,
      city: area.city,
      neighborhood: area.neighborhood,
      price: area.price.toString(),
      is_active: area.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (area: DeliveryArea) => {
    setConfirmDialog({
      open: true,
      title: "Excluir Área de Entrega",
      description: "Tem certeza que deseja excluir esta área de entrega? Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        try {
          await deleteDeliveryArea(area.id.toString());
          toast.success("Área de entrega excluída com sucesso");
          loadDeliveryAreas();
        } catch (error) {
          toast.error("Erro ao excluir área de entrega");
        }
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "fixed",
      state: "",
      city: "",
      neighborhood: "",
      price: "",
      is_active: true
    });
    setEditingArea(null);
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
          <Dialog 
            open={isDialogOpen} 
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Área
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingArea ? "Editar Área de Entrega" : "Nova Área de Entrega"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Área</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, state: value, city: "" }));
                        fetchCities(value);
                      }}
                      disabled={ibgeLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={ibgeLoading ? "Carregando..." : "Selecione o estado"} />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" align="start" className="max-h-[200px]">
                        {states.map(state => (
                          <SelectItem key={state.sigla} value={state.sigla}>
                            {state.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                      disabled={!formData.state || ibgeLoading}
                    >
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            !formData.state 
                              ? "Selecione um estado primeiro" 
                              : ibgeLoading 
                                ? "Carregando..." 
                                : "Selecione a cidade"
                          } 
                        />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" align="start" className="max-h-[200px]">
                        {cities.map(city => (
                          <SelectItem key={city.nome} value={city.nome}>
                            {city.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input 
                    id="neighborhood" 
                    value={formData.neighborhood}
                    onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Entrega</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "fixed" | "variable") => 
                        setFormData(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" align="start">
                        <SelectItem value="fixed">Preço Fixo</SelectItem>
                        <SelectItem value="variable">Preço Variável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Valor da Entrega</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      step="0.01" 
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      required 
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="active" 
                    checked={formData.is_active}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_active: checked }))
                    }
                  />
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
                  <Button type="submit">
                    {editingArea ? "Atualizar" : "Salvar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Bairro</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : areas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma área de entrega cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                areas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell>{area.name}</TableCell>
                    <TableCell>
                      {area.type === "fixed" ? "Preço Fixo" : "Preço Variável"}
                    </TableCell>
                    <TableCell>{area.state}</TableCell>
                    <TableCell>{area.city}</TableCell>
                    <TableCell>{area.neighborhood}</TableCell>
                    <TableCell>R$ {area.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={area.is_active ? "default" : "secondary"}>
                        {area.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7 p-0 text-black hover:text-white hover:bg-amber-500"
                          onClick={() => handleEdit(area)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 p-0 text-red-500 hover:text-white hover:bg-amber-500"
                          onClick={() => handleDelete(area)}
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
