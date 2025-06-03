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
import { AccountMenu } from "@/components/account/AccountMenu";

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
    addresses,
    isLoading,
    addAddress, 
    updateAddress, 
    deleteAddress 
  } = useProfile();
  
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
    receiver: '',
    is_default: false,
    user_id: user?.id || ''
  });

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
      
      setIsAddressDialogOpen(false);
      setAddressForm({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        postal_code: '',
        city: '',
        state: '',
        receiver: '',
        is_default: false,
        user_id: user?.id || ''
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
    <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
      <AccountMenu />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Meus Endereços</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gerencie seus endereços de entrega
          </p>
        </div>
        <Button 
          size="sm"
          className="self-start sm:self-auto"
          onClick={() => {
            setSelectedAddress(null);
            setAddressForm({
              street: '',
              number: '',
              complement: '',
              neighborhood: '',
              postal_code: '',
              city: '',
              state: '',
              receiver: '',
              is_default: false,
              user_id: user?.id || ''
            });
            setIsAddressDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Endereço
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {addresses.map(address => (
          <Card key={address.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mt-1 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    {address.is_default && (
                      <Badge className="mb-2 text-xs">Endereço Padrão</Badge>
                    )}
                    <p className="font-medium text-sm sm:text-base break-words">
                      {address.street}, {address.number}
                    </p>
                    {address.complement && (
                      <p className="text-xs sm:text-sm text-muted-foreground break-words">
                        {address.complement}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {address.neighborhood}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {address.city} - {address.state}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      CEP: {address.postal_code}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                    onClick={() => {
                      setSelectedAddress(address);
                      setAddressForm({
                        street: address.street || '',
                        number: address.number || '',
                        complement: address.complement || '',
                        neighborhood: address.neighborhood || '',
                        postal_code: address.postal_code || '',
                        city: address.city || '',
                        state: address.state || '',
                        receiver: address.receiver || '',
                        is_default: address.is_default || false,
                        user_id: user?.id || ''
                      });
                      setIsAddressDialogOpen(true);
                    }}
                  >
                    <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9 text-destructive"
                    onClick={() => {
                      setSelectedAddress(address);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {addresses.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3 text-center py-8 lg:py-12">
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Você ainda não possui endereços cadastrados
            </p>
            <Button 
              size="sm"
              onClick={() => {
                setSelectedAddress(null);
                setAddressForm({
                  street: '',
                  number: '',
                  complement: '',
                  neighborhood: '',
                  postal_code: '',
                  city: '',
                  state: '',
                  receiver: '',
                  is_default: false,
                  user_id: user?.id || ''
                });
                setIsAddressDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Endereço
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Endereço */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-4 sm:p-6 pb-4">
            <DialogTitle className="text-lg sm:text-xl">
              {selectedAddress ? 'Editar Endereço' : 'Adicionar Endereço'}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(90vh-120px)] px-4 sm:px-6">
            <form onSubmit={handleAddressSubmit} className="space-y-4 pb-4">
              <div className="space-y-2">
                <Label htmlFor="receiver" className="text-sm font-medium">Destinatário</Label>
                <Input
                  id="receiver"
                  value={addressForm.receiver}
                  onChange={(e) => setAddressForm(prev => ({
                    ...prev,
                    receiver: e.target.value
                  }))}
                  placeholder="Nome de quem vai receber"
                  className="h-10 sm:h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code" className="text-sm font-medium">CEP</Label>
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
                    className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Informe o CEP"
                  />
                  {isLoadingCep && (
                    <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3 sm:top-3.5" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="street" className="text-sm font-medium">Rua</Label>
                <Input
                  id="street"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm(prev => ({
                    ...prev,
                    street: e.target.value
                  }))}
                  disabled={isLoadingCep}
                  className="h-10 sm:h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number" className="text-sm font-medium">Número</Label>
                  <Input
                    id="number"
                    value={addressForm.number}
                    onChange={(e) => setAddressForm(prev => ({
                      ...prev,
                      number: e.target.value
                    }))}
                    className="h-10 sm:h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complement" className="text-sm font-medium">Complemento</Label>
                  <Input
                    id="complement"
                    value={addressForm.complement}
                    onChange={(e) => setAddressForm(prev => ({
                      ...prev,
                      complement: e.target.value
                    }))}
                    className="h-10 sm:h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood" className="text-sm font-medium">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={addressForm.neighborhood}
                  onChange={(e) => setAddressForm(prev => ({
                    ...prev,
                    neighborhood: e.target.value
                  }))}
                  disabled={isLoadingCep}
                  className="h-10 sm:h-11"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">Cidade</Label>
                  <Input
                    id="city"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm(prev => ({
                      ...prev,
                      city: e.target.value
                    }))}
                    disabled={isLoadingCep}
                    className="h-10 sm:h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">Estado</Label>
                  <Select
                    value={addressForm.state}
                    onValueChange={(value) => setAddressForm(prev => ({
                      ...prev,
                      state: value
                    }))}
                    disabled={isLoadingCep}
                  >
                    <SelectTrigger id="state" className="h-10 sm:h-11">
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

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm(prev => ({
                    ...prev,
                    is_default: e.target.checked
                  }))}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_default" className="text-sm">Definir como endereço padrão</Label>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddressDialogOpen(false)}
                  className="order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading || isLoadingCep} size="sm" className="order-1 sm:order-2">
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Tem certeza que deseja excluir este endereço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
            <AlertDialogCancel className="order-2 sm:order-1 mt-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedAddress) {
                  handleDeleteAddress(selectedAddress.id);
                }
                setIsDeleteDialogOpen(false);
              }}
              className="order-1 sm:order-2 bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 