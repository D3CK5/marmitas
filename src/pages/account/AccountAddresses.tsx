import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { IMaskInput } from 'react-imask';
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Lista de estados brasileiros
const ESTADOS_BRASILEIROS = [
  { valor: "AC", nome: "Acre" },
  { valor: "AL", nome: "Alagoas" },
  { valor: "AP", nome: "Amapá" },
  { valor: "AM", nome: "Amazonas" },
  { valor: "BA", nome: "Bahia" },
  { valor: "CE", nome: "Ceará" },
  { valor: "DF", nome: "Distrito Federal" },
  { valor: "ES", nome: "Espírito Santo" },
  { valor: "GO", nome: "Goiás" },
  { valor: "MA", nome: "Maranhão" },
  { valor: "MT", nome: "Mato Grosso" },
  { valor: "MS", nome: "Mato Grosso do Sul" },
  { valor: "MG", nome: "Minas Gerais" },
  { valor: "PA", nome: "Pará" },
  { valor: "PB", nome: "Paraíba" },
  { valor: "PR", nome: "Paraná" },
  { valor: "PE", nome: "Pernambuco" },
  { valor: "PI", nome: "Piauí" },
  { valor: "RJ", nome: "Rio de Janeiro" },
  { valor: "RN", nome: "Rio Grande do Norte" },
  { valor: "RS", nome: "Rio Grande do Sul" },
  { valor: "RO", nome: "Rondônia" },
  { valor: "RR", nome: "Roraima" },
  { valor: "SC", nome: "Santa Catarina" },
  { valor: "SP", nome: "São Paulo" },
  { valor: "SE", nome: "Sergipe" },
  { valor: "TO", nome: "Tocantins" }
];

export function AccountAddresses() {
  const { user } = useAuth();
  const { 
    isLoading,
    getAddresses, 
    addAddress, 
    updateAddress, 
    deleteAddress 
  } = useProfile();
  
  const [addresses, setAddresses] = useState([]);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [addressForm, setAddressForm] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    postal_code: '',
    city: '',
    state: '',
    is_default: false
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = { ...addressForm };
      
      if (selectedAddress) {
        await updateAddress({
          id: selectedAddress.id,
          user_id: user?.id,
          ...formData
        });
      } else {
        await addAddress(formData);
      }
      
      await loadAddresses();
      setIsAddressDialogOpen(false);
      setAddressForm({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        postal_code: '',
        city: '',
        state: '',
        is_default: false
      });
      toast.success(selectedAddress ? 'Endereço atualizado com sucesso!' : 'Endereço adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      toast.error('Erro ao salvar endereço');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await deleteAddress(addressId);
      loadAddresses();
    } catch (error) {
      console.error('Erro ao excluir endereço:', error);
    }
  };

  // Função para buscar CEP
  const searchCep = async (cep) => {
    if (cep.length < 8) return;
    
    // Remove caracteres não numéricos do CEP
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      toast.error('CEP inválido');
      return;
    }
    
    try {
      setIsLoadingCep(true);
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }
      
      setAddressForm(prev => ({
        ...prev,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        // Mantém os valores que o usuário já inseriu
        number: prev.number,
        complement: prev.complement,
        is_default: prev.is_default
      }));
      
    } catch (error) {
      toast.error('Erro ao buscar CEP');
      console.error('Erro na busca do CEP:', error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Meus Endereços</h1>
          <p className="text-muted-foreground">
            Gerencie seus endereços de entrega
          </p>
        </div>
        <Button onClick={() => {
          setSelectedAddress(null);
          setAddressForm({
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            postal_code: '',
            city: '',
            state: '',
            is_default: false
          });
          setIsAddressDialogOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Endereço
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {addresses.map(address => (
          <Card key={address.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-1 text-primary" />
                  <div>
                    {address.is_default && (
                      <Badge className="mb-2">Endereço Padrão</Badge>
                    )}
                    <p className="font-medium">
                      {address.street}, {address.number}
                    </p>
                    {address.complement && (
                      <p className="text-sm text-muted-foreground">
                        {address.complement}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {address.neighborhood}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.city} - {address.state}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CEP: {address.postal_code}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedAddress(address);
                      setAddressForm(address);
                      setIsAddressDialogOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      setSelectedAddress(address);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {addresses.length === 0 && (
          <div className="md:col-span-2 text-center py-10">
            <p className="text-muted-foreground mb-4">
              Você ainda não possui endereços cadastrados
            </p>
            <Button onClick={() => {
              setSelectedAddress(null);
              setAddressForm({
                street: '',
                number: '',
                complement: '',
                neighborhood: '',
                postal_code: '',
                city: '',
                state: '',
                is_default: false
              });
              setIsAddressDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Endereço
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAddress ? 'Editar Endereço' : 'Adicionar Endereço'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddressSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code">CEP</Label>
              <div className="relative">
                <IMaskInput
                  id="postal_code"
                  mask="00000-000"
                  value={addressForm.postal_code}
                  onAccept={(value) => {
                    setAddressForm(prev => ({
                      ...prev,
                      postal_code: value
                    }));
                    
                    // Busca CEP quando o campo estiver com 9 caracteres (00000-000)
                    if (value.length === 9) {
                      searchCep(value);
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Informe o CEP"
                />
                {isLoadingCep && (
                  <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Rua</Label>
              <Input
                id="street"
                value={addressForm.street}
                onChange={(e) => setAddressForm(prev => ({
                  ...prev,
                  street: e.target.value
                }))}
                disabled={isLoadingCep}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={addressForm.number}
                  onChange={(e) => setAddressForm(prev => ({
                    ...prev,
                    number: e.target.value
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={addressForm.complement}
                  onChange={(e) => setAddressForm(prev => ({
                    ...prev,
                    complement: e.target.value
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={addressForm.neighborhood}
                onChange={(e) => setAddressForm(prev => ({
                  ...prev,
                  neighborhood: e.target.value
                }))}
                disabled={isLoadingCep}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm(prev => ({
                    ...prev,
                    city: e.target.value
                  }))}
                  disabled={isLoadingCep}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Select
                  value={addressForm.state}
                  onValueChange={(value) => setAddressForm(prev => ({
                    ...prev,
                    state: value
                  }))}
                  disabled={isLoadingCep}
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Selecione um estado" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[300px] overflow-y-auto">
                    {ESTADOS_BRASILEIROS.map((estado) => (
                      <SelectItem key={estado.valor} value={estado.valor}>
                        {estado.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={addressForm.is_default}
                onChange={(e) => setAddressForm(prev => ({
                  ...prev,
                  is_default: e.target.checked
                }))}
              />
              <Label htmlFor="is_default">Definir como endereço padrão</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddressDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || isLoadingCep}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Endereço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este endereço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedAddress) {
                  handleDeleteAddress(selectedAddress.id);
                }
                setIsDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 