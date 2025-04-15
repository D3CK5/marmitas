import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CustomerDetails as ICustomerDetails } from "@/hooks/useCustomer";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Pencil, 
  PlusCircle, 
  Trash2, 
  MapPin, 
  Home, 
  Building, 
  Hash, 
  Info, 
  MapPinned,
  LandPlot,
  Building2, 
  Map
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
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
import { Checkbox } from "@/components/ui/checkbox";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface CustomerDetailsProps {
  customer: ICustomerDetails;
  onUpdate: (data: Partial<ICustomerDetails>) => Promise<void>;
}

// Adicionar uma constante com as UFs do Brasil
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

export function CustomerDetails({ customer, onUpdate }: CustomerDetailsProps) {
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<any | null>(null);
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

  // Adicionar estados para o diálogo de confirmação
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<any | null>(null);
  
  // Estado para controlar o diálogo de endereço
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);

  // Adicionar a função de manipulação do CEP e os estados necessários
  const [cepInput, setCepInput] = useState("");
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  
  // Campos de formulário controlados
  const [streetInput, setStreetInput] = useState("");
  const [numberInput, setNumberInput] = useState("");
  const [complementInput, setComplementInput] = useState("");
  const [neighborhoodInput, setNeighborhoodInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);

  // Adicionar estado para controlar o carregamento da lista de endereços
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);

  useEffect(() => {
    if (currentAddress) {
      setAddressForm({
        street: currentAddress.street || '',
        number: currentAddress.number || '',
        complement: currentAddress.complement || '',
        neighborhood: currentAddress.neighborhood || '',
        postal_code: currentAddress.postal_code || '',
        city: currentAddress.city || '',
        state: currentAddress.state || '',
        is_default: currentAddress.is_default || false
      });
    } else {
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
    }
  }, [currentAddress]);

  useEffect(() => {
    // Quando o modal abre ou fecha, reset os inputs
    if (isAddressDialogOpen) {
      if (editingAddress) {
        // Preencher formulário com dados do endereço existente
        setCepInput(editingAddress.postal_code || "");
        setStreetInput(editingAddress.street || "");
        setNumberInput(editingAddress.number || "");
        setComplementInput(editingAddress.complement || "");
        setNeighborhoodInput(editingAddress.neighborhood || "");
        setCityInput(editingAddress.city || "");
        setStateInput(editingAddress.state || "");
        setIsDefaultAddress(editingAddress.is_default || false);
      } else {
        // Reset para valores vazios ao adicionar novo endereço
        setCepInput("");
        setStreetInput("");
        setNumberInput("");
        setComplementInput("");
        setNeighborhoodInput("");
        setCityInput("");
        setStateInput("");
        setIsDefaultAddress(false);
      }
    }
  }, [isAddressDialogOpen, editingAddress]);

  const formatDate = (date: string | null) => {
    if (!date) return "Não informado";
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida";
    }
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return "Não informado";
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data e hora:", error);
      return "Data inválida";
    }
  };

  // Garante que temos valores válidos para evitar NaN e erros de renderização
  const safeTotal = isNaN(customer.total_spent) ? 0 : customer.total_spent;
  const safeOrders = Array.isArray(customer.orders) ? customer.orders : [];
  // Usar os endereços do estado local em vez de customer.addresses
  const safeAddresses = addresses;

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setIsAddressDialogOpen(true);
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsAddressDialogOpen(true);
  };

  const searchCep = async (cep: string) => {
    if (cep.length < 8) return;
    
    // Remove caracteres não numéricos do CEP
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      toast.error('CEP inválido');
      return;
    }
    
    try {
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
    }
  };

  // Adicionar função para buscar endereço pelo CEP
  const fetchAddressByCep = async (cep: string) => {
    try {
      const cleanCep = cep.replace(/\D/g, "");
      if (cleanCep.length !== 8) return null;

      setIsSearchingCep(true);
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      setIsSearchingCep(false);
      
      if (data.erro) {
        toast.error("CEP não encontrado");
        return null;
      }
      
      // Atualizar os estados dos campos com os dados do CEP
      setStreetInput(data.logradouro || "");
      setNeighborhoodInput(data.bairro || "");
      setCityInput(data.localidade || "");
      setStateInput(data.uf || "");
      
      return {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf
      };
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP");
      setIsSearchingCep(false);
      return null;
    }
  };

  // Função para lidar com a mudança do CEP
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value;
    setCepInput(cep);
    
    if (cep.replace(/\D/g, "").length === 8) {
      await fetchAddressByCep(cep);
    }
  };

  // Função para buscar endereços diretamente do banco
  const fetchAddresses = async () => {
    if (!customer?.id) return;
    
    setIsLoadingAddresses(true);
    try {
      // Usar função RPC para buscar endereços em vez de consulta direta
      const { data, error } = await supabase.rpc('get_user_addresses', {
        p_user_id: customer.id
      });
      
      if (error) throw error;
      
      setAddresses(data || []);
    } catch (error) {
      console.error("Erro ao buscar endereços:", error);
      toast.error("Não foi possível carregar os endereços");
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  // Buscar endereços ao montar o componente ou quando o cliente mudar
  useEffect(() => {
    if (customer?.id) {
      fetchAddresses();
    }
  }, [customer?.id]);

  // Função que lida com o salvamento de um endereço (novo ou existente)
  const handleSaveAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAddressLoading(true);

    try {
      const addressData = {
        street: streetInput,
        number: numberInput,
        complement: complementInput || null,
        neighborhood: neighborhoodInput,
        city: cityInput,
        state: stateInput,
        postal_code: cepInput,
        is_default: isDefaultAddress,
        user_id: customer.id
      };

      // Se este endereço estiver sendo definido como padrão, remover o status de padrão de outros endereços
      if (isDefaultAddress) {
        try {
          const { error } = await supabase.rpc('clear_default_addresses', {
            p_user_id: customer.id,
            p_exclude_address_id: editingAddress ? editingAddress.id : null
          });
          
          if (error) {
            console.error("Erro ao limpar endereços padrão:", error);
            // Continuar com o processo mesmo se houver erro aqui
          }
        } catch (error) {
          console.error("Erro ao limpar endereços padrão:", error);
          // Continuar com o processo mesmo se houver erro aqui
        }
      }

      let result;

      if (editingAddress) {
        // Usar a função RPC para atualizar endereço existente
        const { data, error } = await supabase.rpc('update_user_address', {
          p_address_id: editingAddress.id,
          p_street: addressData.street,
          p_number: addressData.number,
          p_complement: addressData.complement,
          p_neighborhood: addressData.neighborhood,
          p_postal_code: addressData.postal_code,
          p_city: addressData.city,
          p_state: addressData.state,
          p_is_default: addressData.is_default
        });

        if (error) throw error;
        result = { id: editingAddress.id };
      } else {
        // Usar a função RPC para inserir novo endereço
        const { data, error } = await supabase.rpc('insert_user_address', {
          p_user_id: customer.id,
          p_street: addressData.street,
          p_number: addressData.number,
          p_complement: addressData.complement,
          p_neighborhood: addressData.neighborhood,
          p_postal_code: addressData.postal_code,
          p_city: addressData.city,
          p_state: addressData.state,
          p_is_default: addressData.is_default
        });

        if (error) throw error;
        result = { id: data };
      }

      toast.success(
        editingAddress
          ? "Endereço atualizado com sucesso"
          : "Endereço adicionado com sucesso"
      );

      // Fechar o diálogo
      setIsAddressDialogOpen(false);
      
      // Atualizar a lista de endereços imediatamente
      await fetchAddresses();
      
      // Também atualizar os dados completos do cliente
      onUpdate({ id: customer.id });
    } catch (error: any) {
      console.error("Erro ao salvar endereço:", error);
      
      // Mensagem de erro mais detalhada
      const errorMessage = error.message || "Erro ao salvar endereço";
      const detailMessage = error.details ? `: ${error.details}` : "";
      
      toast.error(`${errorMessage}${detailMessage}`);
    } finally {
      setIsAddressLoading(false);
    }
  };

  // Função para abrir o diálogo de confirmação
  const handleDeleteAddress = (address: any) => {
    setAddressToDelete(address);
    setIsDeleteDialogOpen(true);
  };
  
  // Função para confirmar e executar a exclusão
  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    
    try {
      // Chamar a função RPC para excluir o endereço
      const { error } = await supabase.rpc('delete_user_address', {
        p_address_id: addressToDelete.id
      });
      
      if (error) throw error;
      
      toast.success('Endereço removido com sucesso!');
      
      // Atualizar a lista de endereços imediatamente
      await fetchAddresses();
      
      // Também atualizar os dados completos do cliente
      onUpdate({ id: customer.id });
    } catch (error) {
      console.error('Erro ao excluir endereço:', error);
      toast.error('Erro ao excluir endereço. Tente novamente.');
    } finally {
      // Fechar o diálogo de confirmação
      setIsDeleteDialogOpen(false);
      setAddressToDelete(null);
    }
  };

  return (
    <>
      <Tabs defaultValue="informacoes" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="informacoes">
          <div className="grid gap-6">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">Status da Conta</h3>
              <div className="flex flex-wrap gap-2">
                {customer.is_active && (
                  <Badge variant="secondary" className="bg-green-100 hover:bg-green-200 text-green-800 border-green-300">
                    Ativo
                  </Badge>
                )}
                {customer.email_verified && (
                  <Badge variant="outline" className="bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300">
                    Email Verificado
                  </Badge>
                )}
                {customer.phone_verified && (
                  <Badge variant="outline" className="bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300">
                    Telefone Verificado
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium">Dados Pessoais</h4>
              <div className="mt-1 space-y-2 text-sm">
                <p>Nome: {customer.full_name || 'Não informado'}</p>
                <p>Email: {customer.email || 'Não informado'}</p>
                <p>Telefone: {customer.phone || "Não informado"}</p>
                <p>Cliente desde: {formatDate(customer.created_at)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium">Métricas</h4>
              <div className="mt-1 space-y-2 text-sm">
                <p>Total gasto: {formatPrice(safeTotal)}</p>
                <p>Última compra: {customer.last_purchase ? formatDate(customer.last_purchase) : "Nunca comprou"}</p>
                <p>Total de pedidos: {safeOrders.length}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">Endereços</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8" 
                  onClick={handleAddAddress}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Endereço
                </Button>
              </div>
              
              {isLoadingAddresses ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : safeAddresses.length > 0 ? (
                <div className="mt-1 space-y-3">
                  {safeAddresses.map(address => (
                    <div key={address.id} className="border rounded-lg p-3 relative">
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEditAddress(address)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          onClick={() => handleDeleteAddress(address)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {address.is_default && (
                        <div className="text-xs mb-2">
                          <Badge variant="outline" className="bg-green-50 hover:bg-green-100 text-green-800 border-green-300">
                            Padrão
                          </Badge>
                        </div>
                      )}
                      <p className="font-medium">
                        {address.street}, {address.number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.neighborhood} - {address.city}/{address.state}
                      </p>
                      {address.complement && (
                        <p className="text-sm text-muted-foreground">
                          Complemento: {address.complement}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        CEP: {address.postal_code}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhum endereço cadastrado
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {safeOrders.length > 0 ? (
            <div className="space-y-4">
              {safeOrders.map(order => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Pedido #{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(order.total)}</p>
                      <div className="flex justify-end">
                        <Badge>{order.status}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Este cliente ainda não fez nenhum pedido
            </p>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Diálogo para adicionar/editar endereço */}
      <Dialog open={isAddressDialogOpen} onOpenChange={(open) => {
        setIsAddressDialogOpen(open);
        if (!open) {
          setEditingAddress(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <MapPin className="h-5 w-5 text-primary" />
              {editingAddress ? "Editar Endereço" : "Adicionar Endereço"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSaveAddress}>
            <div className="grid gap-3">
              {/* Seção CEP com busca automática */}
              <div className="space-y-1">
                <Label htmlFor="postal_code" className="text-sm font-medium flex items-center gap-1">
                  <MapPinned className="h-4 w-4 text-muted-foreground" />
                  CEP <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="postal_code"
                    name="postal_code"
                    placeholder="00000-000"
                    className={`pr-10 h-9 ${isSearchingCep ? 'border-primary' : ''}`}
                    value={cepInput}
                    onChange={handleCepChange}
                    required
                    maxLength={9}
                    // Implementar máscara básica para o CEP (00000-000)
                    onKeyUp={(e) => {
                      const input = e.currentTarget;
                      let value = input.value.replace(/\D/g, '');
                      if (value.length > 5) {
                        value = value.substring(0, 5) + '-' + value.substring(5, 8);
                      }
                      // Só atualiza se o formato estiver diferente
                      if (value !== input.value) {
                        setCepInput(value);
                      }
                    }}
                  />
                  {isSearchingCep && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground -mt-1">
                  Digite o CEP para busca automática
                </p>
              </div>

              {/* Layout em duas colunas para endereço */}
              <div className="grid md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="street" className="text-sm font-medium flex items-center gap-1">
                    <Map className="h-4 w-4 text-muted-foreground" />
                    Rua <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="street"
                    name="street"
                    placeholder="Nome da rua"
                    className="h-9"
                    value={streetInput}
                    onChange={(e) => setStreetInput(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="number" className="text-sm font-medium flex items-center gap-1">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    Número <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="number"
                    name="number"
                    placeholder="123"
                    className="h-9"
                    value={numberInput}
                    onChange={(e) => setNumberInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="complement" className="text-sm font-medium flex items-center gap-1">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  Complemento
                </Label>
                <Input
                  id="complement"
                  name="complement"
                  placeholder="Apto 101, Bloco B, etc."
                  className="h-9"
                  value={complementInput}
                  onChange={(e) => setComplementInput(e.target.value)}
                />
              </div>

              {/* Layout em duas colunas para bairro e cidade */}
              <div className="grid md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="neighborhood" className="text-sm font-medium flex items-center gap-1">
                    <LandPlot className="h-4 w-4 text-muted-foreground" />
                    Bairro <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="neighborhood"
                    name="neighborhood"
                    placeholder="Nome do bairro"
                    className="h-9"
                    value={neighborhoodInput}
                    onChange={(e) => setNeighborhoodInput(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="city" className="text-sm font-medium flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Cidade <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Nome da cidade"
                    className="h-9"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="state" className="text-sm font-medium flex items-center gap-1">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  Estado <span className="text-destructive">*</span>
                </Label>
                <select
                  id="state"
                  name="state"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={stateInput}
                  onChange={(e) => setStateInput(e.target.value)}
                  required
                >
                  <option value="">Selecione o estado</option>
                  {ESTADOS_BRASILEIROS.map((estado) => (
                    <option key={estado.valor} value={estado.valor}>
                      {estado.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 bg-muted/40 p-2 rounded-md mt-1">
                <Checkbox
                  id="is_default"
                  name="is_default"
                  checked={isDefaultAddress}
                  onCheckedChange={(checked) => 
                    setIsDefaultAddress(checked === true)
                  }
                  className="border-primary"
                />
                <Label htmlFor="is_default" className="text-sm cursor-pointer">
                  Definir como endereço padrão
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddressDialogOpen(false)}
                className="h-9"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isAddressLoading} className="gap-2 h-9">
                {isAddressLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Home className="h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmação para excluir endereço */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este endereço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAddress}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 