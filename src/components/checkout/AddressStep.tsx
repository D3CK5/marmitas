
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  zipCode: string;
}

interface AddressStepProps {
  onComplete: () => void;
  userName?: string;
}

export function AddressStep({ onComplete, userName = "" }: AddressStepProps) {
  const [address, setAddress] = useState({
    receiver: userName,
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
  });

  // Simulando endereços salvos do usuário
  const savedAddresses: Address[] = [
    {
      id: "1",
      street: "Rua das Flores",
      number: "123",
      complement: "Apto 101",
      neighborhood: "Centro",
      zipCode: "12345-678",
    },
    {
      id: "2",
      street: "Av. Principal",
      number: "456",
      neighborhood: "Jardim",
      zipCode: "87654-321",
    },
  ];

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
          }));
        }
      } catch (error) {
        toast.error("Erro ao buscar CEP");
      }
    }
  };

  const handleSelectAddress = (savedAddress: Address) => {
    setAddress({
      receiver: userName,
      cep: savedAddress.zipCode,
      street: savedAddress.street,
      number: savedAddress.number,
      complement: savedAddress.complement || "",
      neighborhood: savedAddress.neighborhood,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Endereço de Entrega</h2>
        <p className="text-muted-foreground mb-6">
          Preencha os dados do endereço de entrega ou selecione um de seus endereços abaixo
        </p>
      </div>

      {savedAddresses.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Endereços Salvos:</p>
          <div className="grid grid-cols-2 gap-2">
            {savedAddresses.map((saved) => (
              <Button
                key={saved.id}
                variant="outline"
                type="button"
                className="justify-start"
                onClick={() => handleSelectAddress(saved)}
              >
                {saved.street}, {saved.number}
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
            onChange={(e) => setAddress({ ...address, receiver: e.target.value })}
            placeholder="Nome de quem vai receber"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            value={address.cep}
            onChange={(e) => setAddress({ ...address, cep: e.target.value })}
            onBlur={handleCepBlur}
            placeholder="00000-000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="street">Rua</Label>
          <Input
            id="street"
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="number">Número</Label>
            <Input
              id="number"
              value={address.number}
              onChange={(e) => setAddress({ ...address, number: e.target.value })}
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
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Continuar
      </Button>
    </form>
  );
}
