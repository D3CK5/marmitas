import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";

interface AddressStepProps {
  onComplete: (addressId: string) => void;
  userName?: string;
}

export function AddressStep({ onComplete, userName = "" }: AddressStepProps) {
  const { getAddresses, addAddress } = useProfile();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [address, setAddress] = useState({
    receiver: userName,
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const userAddresses = await getAddresses();
      setAddresses(userAddresses);
      // Se houver um endereço padrão, seleciona ele
      const defaultAddress = userAddresses.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }
    } catch (error) {
      toast.error("Erro ao carregar endereços");
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleCepBlur = async () => {
    if (address.cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${address.cep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setAddress(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
          }));
        }
      } catch (error) {
        toast.error("Erro ao buscar CEP");
      }
    }
  };

  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddressId && !address.street) {
      toast.error("Selecione um endereço ou preencha um novo");
      return;
    }

    if (selectedAddressId) {
      onComplete(selectedAddressId);
      return;
    }

    // Se não selecionou um endereço existente, cadastra o novo
    try {
      setIsLoading(true);
      const newAddress = await addAddress({
        cep: address.cep,
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        receiver: address.receiver,
        is_default: addresses.length === 0 // Se for o primeiro endereço, marca como padrão
      });

      onComplete(newAddress.id);
    } catch (error) {
      toast.error("Erro ao salvar endereço");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingAddresses) {
    return <div>Carregando endereços...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Endereço de Entrega</h2>
        <p className="text-muted-foreground mb-6">
          Selecione um endereço salvo ou cadastre um novo
        </p>
      </div>

      {addresses.length > 0 && (
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
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              value={address.cep}
              onChange={(e) => setAddress({ ...address, cep: e.target.value.replace(/\D/g, '') })}
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

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Salvando..." : "Continuar"}
      </Button>
    </form>
  );
}
