import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FoodSelector } from "./FoodSelector";

interface ChangeableFoodsConfigProps {
  productId: number;
}

export function ChangeableFoodsConfig({ productId }: ChangeableFoodsConfigProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          Configurar Trocas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configuração de Troca de Alimentos</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <FoodSelector productId={productId} />
        </div>
      </DialogContent>
    </Dialog>
  );
} 