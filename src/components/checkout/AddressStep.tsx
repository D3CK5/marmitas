import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { calculateDeliveryFee } from "@/components/api/delivery-areas";
import { Loader2 } from "lucide-react";

interface AddressStepProps {
  onComplete: (addressId: string, deliveryFee: number) => void;
  userName?: string;
  onDeliveryFeeCalculated?: (fee: number | null) => void;
}

interface AddressFormData {
  receiver: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  is_default?: boolean;
}

export function AddressStep({ onComplete, userName = "", onDeliveryFeeCalculated }: AddressStepProps) {
  const { addresses, addAddress, updateAddress } = useProfile();
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [address, setAddress] = useState<AddressFormData>({
    receiver: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    postal_code: "",
    is_default: false
  });

  useEffect(() => {
    setIsLoadingAddresses(false);
  }, [addresses]);

  const calculateFee = async (postalCode: string) => {
    setIsCalculatingFee(true);
    setDeliveryFee(null);
    onDeliveryFeeCalculated?.(null); // Notifica que está calculando
    
    try {
      const fee = await calculateDeliveryFee(postalCode);
      if (fee === null) {
        toast.error("Não entregamos nesta região");
        setDeliveryFee(null);
        onDeliveryFeeCalculated?.(null);
        return false;
      }
      setDeliveryFee(fee);
      onDeliveryFeeCalculated?.(fee); // Notifica o novo valor da taxa
      return true;
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      toast.error("Erro ao calcular frete");
      onDeliveryFeeCalculated?.(null);
      return false;
    } finally {
      setIsCalculatingFee(false);
    }
  };

  const handleCepBlur = async () => {
    if (address.postal_code.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${address.postal_code}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setAddress(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          }));

          // Calcular taxa de entrega
          await calculateFee(address.postal_code);
        }
      } catch (error) {
        toast.error("Erro ao buscar CEP");
      }
    }
  };

  const handleNewAddress = () => {
    setIsNewAddress(true);
    setSelectedAddressId("");
    setDeliveryFee(null);
    onDeliveryFeeCalculated?.(null);
    // Limpa o formulário
    setAddress({
      receiver: userName,
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      postal_code: "",
      is_default: false
    });
  };

  const handleCancelNewAddress = () => {
    setIsNewAddress(false);
    // Se tinha um endereço selecionado anteriormente, restaura ele
    if (addresses && addresses.length > 0) {
      const lastSelectedAddress = addresses.find(addr => addr.id === selectedAddressId) || addresses[0];
      handleSelectAddress(lastSelectedAddress.id);
    }
  };

  const handleSelectAddress = async (addressId: string) => {
    setIsNewAddress(false);
    const selectedAddress = addresses?.find(addr => addr.id === addressId);
    setSelectedAddressId(addressId);
    if (selectedAddress) {
      setAddress({
        receiver: selectedAddress.receiver,
        street: selectedAddress.street,
        number: selectedAddress.number,
        complement: selectedAddress.complement || "",
        neighborhood: selectedAddress.neighborhood,
        city: selectedAddress.city,
        state: selectedAddress.state,
        postal_code: selectedAddress.postal_code,
        is_default: selectedAddress.is_default
      });
      await calculateFee(selectedAddress.postal_code);
      setHasChanges(false);
    }
  };

  const handleAddressChange = (field: keyof AddressFormData, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    if (!isNewAddress) {
      setHasChanges(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddressId && !address.street) {
      toast.error("Preencha o endereço de entrega");
      return;
    }

    if (deliveryFee === null) {
      toast.error("Não é possível prosseguir sem uma taxa de entrega válida");
      return;
    }

    try {
      setIsLoading(true);

      if (selectedAddressId && hasChanges) {
        // Atualiza o endereço existente se houve mudanças
        await updateAddress({
          id: selectedAddressId,
          ...address
        });
        toast.success("Endereço atualizado com sucesso!");
      } else if (!selectedAddressId) {
        // Se não tem nenhum endereço cadastrado, define este como padrão
        const isFirstAddress = !addresses || addresses.length === 0;
        // Cria um novo endereço
      const newAddress = await addAddress({
          ...address,
          is_default: isFirstAddress
      });
        setSelectedAddressId(newAddress.id);
      }

      onComplete(selectedAddressId, deliveryFee);
    } catch (error) {
      toast.error(selectedAddressId ? "Erro ao atualizar endereço" : "Erro ao salvar endereço");
    } finally {
      setIsLoading(false);
    }
  };

  // Função para formatar o nome da rua
  const formatStreetName = (street: string) => {
    // Remove a palavra "Rua" se existir no início
    let formattedStreet = street.replace(/^(Rua|R\.)\s+/i, "");
    
    // Divide o nome em palavras
    const words = formattedStreet.split(" ");
    
    // Se tiver mais de 2 palavras, abrevia as palavras do meio
    if (words.length > 2) {
      return words.map((word, index) => {
        // Mantém a primeira e última palavra completas
        if (index === 0 || index === words.length - 1) return word;
        // Abrevia palavras do meio que não sejam preposições
        if (!/^(de|da|do|das|dos)$/i.test(word)) {
          return `${word.charAt(0)}.`;
        }
        return word;
      }).join(" ");
    }
    
    return formattedStreet;
  };

  if (isLoadingAddresses) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Endereço de Entrega</h2>
        {addresses && addresses.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={isNewAddress ? handleCancelNewAddress : handleNewAddress}
            className={isNewAddress ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
          >
            {isNewAddress ? "Cancelar" : "Novo Endereço"}
          </Button>
        )}
      </div>

      {addresses && addresses.length > 0 && !isNewAddress && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Endereços Salvos:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {addresses.map((saved) => (
              <Button
                key={saved.id}
                variant={selectedAddressId === saved.id ? "default" : "outline"}
                type="button"
                className={`w-full justify-start h-auto py-2 px-3 ${
                  selectedAddressId === saved.id 
                    ? "bg-primary hover:bg-primary/90" 
                    : "hover:bg-accent"
                }`}
                onClick={() => handleSelectAddress(saved.id)}
              >
                <div className="text-left w-full">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-base truncate">
                      {saved.receiver}
                  </p>
                  {saved.is_default && (
                      <span className="text-[10px] font-medium bg-primary/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        Padrão
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    <p className={`text-sm truncate ${
                      selectedAddressId === saved.id 
                        ? "text-primary-foreground" 
                        : "text-foreground"
                    }`}>
                      R. {formatStreetName(saved.street)}
                    </p>
                    <p className={`text-sm truncate ${
                      selectedAddressId === saved.id 
                        ? "text-primary-foreground/90" 
                        : "text-foreground/90"
                    }`}>
                      {saved.number}
                      {saved.complement && ` - ${saved.complement}`}
                    </p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="receiver">Recebedor</Label>
            <Input
              id="receiver"
              value={address.receiver}
            onChange={(e) => handleAddressChange("receiver", e.target.value)}
              required
            disabled={addresses?.length > 0 && !isNewAddress && !selectedAddressId}
            />
          </div>

          <div className="space-y-2">
          <Label htmlFor="postal_code">CEP</Label>
            <Input
            id="postal_code"
            value={address.postal_code}
            onChange={(e) => {
              const cep = e.target.value.replace(/\D/g, "");
              if (cep.length <= 8) {
                handleAddressChange("postal_code", cep);
              }
            }}
              onBlur={handleCepBlur}
              required
              maxLength={8}
            placeholder="Somente números"
            disabled={addresses?.length > 0 && !isNewAddress && !selectedAddressId}
            />
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="street">Rua</Label>
            <Input
              id="street"
              value={address.street}
              onChange={(e) => handleAddressChange("street", e.target.value)}
              required
              disabled={addresses?.length > 0 && !isNewAddress && !selectedAddressId}
            />
          </div>

            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={address.number}
              onChange={(e) => handleAddressChange("number", e.target.value)}
                required
              disabled={addresses?.length > 0 && !isNewAddress && !selectedAddressId}
              />
          </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={address.complement}
            onChange={(e) => handleAddressChange("complement", e.target.value)}
                placeholder="Opcional"
            disabled={addresses?.length > 0 && !isNewAddress && !selectedAddressId}
              />
          </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              value={address.neighborhood}
              onChange={(e) => handleAddressChange("neighborhood", e.target.value)}
              required
              disabled={addresses?.length > 0 && !isNewAddress && !selectedAddressId}
            />
          </div>

            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={address.city}
              onChange={(e) => handleAddressChange("city", e.target.value)}
                required
              disabled={addresses?.length > 0 && !isNewAddress && !selectedAddressId}
              />
          </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={address.state}
            onChange={(e) => handleAddressChange("state", e.target.value)}
                required
            disabled={addresses?.length > 0 && !isNewAddress && !selectedAddressId}
              />
            </div>
          </div>

      <div className="flex justify-end space-x-2">
        <Button 
          type="submit" 
          disabled={isLoading || deliveryFee === null || isCalculatingFee}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : isCalculatingFee ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculando frete...
            </>
          ) : (
            "Continuar"
          )}
      </Button>
      </div>
    </form>
  );
}
