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
  const { addresses, addAddress } = useProfile();
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [address, setAddress] = useState<AddressFormData>({
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

  useEffect(() => {
    // Se houver um endereço padrão, seleciona ele e calcula a taxa
    const defaultAddress = addresses?.find(addr => addr.is_default);
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
      calculateFee(defaultAddress.postal_code);
    }
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

  const handleSelectAddress = async (addressId: string) => {
    const selectedAddress = addresses?.find(addr => addr.id === addressId);
    setSelectedAddressId(addressId);
    if (selectedAddress) {
      await calculateFee(selectedAddress.postal_code);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddressId && !address.street) {
      toast.error("Selecione um endereço ou preencha um novo");
      return;
    }

    if (deliveryFee === null) {
      toast.error("Não é possível prosseguir sem uma taxa de entrega válida");
      return;
    }

    if (selectedAddressId) {
      onComplete(selectedAddressId, deliveryFee);
      return;
    }

    // Se não selecionou um endereço existente, cadastra o novo
    try {
      setIsLoading(true);
      const newAddress = await addAddress({
        ...address,
        is_default: addresses?.length === 0 // Se for o primeiro endereço, marca como padrão
      });

      onComplete(newAddress.id, deliveryFee);
    } catch (error) {
      toast.error("Erro ao salvar endereço");
    } finally {
      setIsLoading(false);
    }
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
      <div>
        <h2 className="text-lg font-semibold mb-4">Endereço de Entrega</h2>
        <p className="text-muted-foreground mb-6">
          Selecione um endereço salvo ou cadastre um novo
        </p>
      </div>

      {addresses && addresses.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Endereços Salvos:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {addresses.map((saved) => (
              <Button
                key={saved.id}
                variant={selectedAddressId === saved.id ? "default" : "outline"}
                type="button"
                className="justify-start h-auto py-4"
                onClick={() => handleSelectAddress(saved.id)}
              >
                <div className="text-left">
                  <p className="font-medium">{saved.receiver}</p>
                  <p className="text-sm text-muted-foreground">
                    {saved.street}, {saved.number}
                    {saved.complement && ` - ${saved.complement}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {saved.neighborhood} - {saved.city}/{saved.state}
                  </p>
                  {saved.is_default && (
                    <p className="text-sm text-primary mt-1">Endereço padrão</p>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {!selectedAddressId && (
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="receiver">Recebedor</Label>
            <Input
              id="receiver"
              value={address.receiver}
              onChange={(e) => setAddress({ ...address, receiver: e.target.value })}
              placeholder="Nome de quem vai receber"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal_code">CEP</Label>
            <Input
              id="postal_code"
              value={address.postal_code}
              onChange={(e) => setAddress({ ...address, postal_code: e.target.value.replace(/\D/g, '') })}
              onBlur={handleCepBlur}
              placeholder="00000000"
              required
              maxLength={8}
            />
            <p className="text-sm text-muted-foreground">
              Digite o CEP para preenchimento automático
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Rua</Label>
            <Input
              id="street"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={address.number}
                onChange={(e) => setAddress({ ...address, number: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={address.complement}
                onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              value={address.neighborhood}
              onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                required
                maxLength={2}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={isLoading || isCalculatingFee || deliveryFee === null}
          className="w-full md:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Continuar"
          )}
        </Button>
      </div>
    </form>
  );
}
