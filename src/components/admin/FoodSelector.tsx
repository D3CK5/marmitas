import { useState, useEffect } from "react";
import { useChangeableFoods } from "@/hooks/useChangeableFoods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash, ArrowDown } from "lucide-react";
import { CustomAlertDialog } from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface FoodSelectorProps {
  productId: number;
  isTemp?: boolean;
}

export function FoodSelector({ productId, isTemp = false }: FoodSelectorProps) {
  const { 
    foods, 
    getProductFoods,
    linkFoodToProduct,
    unlinkFoodFromProduct 
  } = useChangeableFoods();
  
  const [defaultFoods, setDefaultFoods] = useState<any[]>([]);
  const [alternativeFoods, setAlternativeFoods] = useState<any[]>([]);
  const [selectedDefaultFood, setSelectedDefaultFood] = useState<string>("");
  const [selectedAlternativeFood, setSelectedAlternativeFood] = useState<string>("");

  useEffect(() => {
    loadProductFoods();
  }, [productId]);

  const loadProductFoods = async () => {
    try {
      const data = await getProductFoods(productId, isTemp);
      setDefaultFoods(data.defaultFoods);
      setAlternativeFoods(data.alternativeFoods);
    } catch (error) {
      console.error("Erro ao carregar alimentos:", error);
      toast.error("Erro ao carregar alimentos");
    }
  };

  const handleAddDefaultFood = async () => {
    if (!selectedDefaultFood) {
      toast.error("Selecione um alimento primeiro");
      return;
    }

    try {
      await linkFoodToProduct({
        productId,
        defaultFoodId: parseInt(selectedDefaultFood),
        isTemp
      });
      
      loadProductFoods();
      setSelectedDefaultFood("");
    } catch (error: any) {
      console.error("Erro ao adicionar alimento:", error);
      toast.error(error.message || "Erro ao adicionar alimento");
    }
  };

  const handleAddAlternativeFood = async (defaultFoodId: number) => {
    if (!selectedAlternativeFood) {
      toast.error("Selecione um alimento substituto");
      return;
    }

    try {
      await linkFoodToProduct({
        productId,
        defaultFoodId,
        alternativeFoodId: parseInt(selectedAlternativeFood),
        isTemp
      });
      
      loadProductFoods();
      setSelectedAlternativeFood("");
    } catch (error: any) {
      console.error("Erro ao adicionar alimento substituto:", error);
      toast.error(error.message || "Erro ao adicionar alimento substituto");
    }
  };

  const handleRemoveFood = async (foodId: number) => {
    try {
      if (defaultFoods.some(df => df.id === foodId)) {
        setDefaultFoods(prev => prev.filter(df => df.id !== foodId));
      } else {
        setAlternativeFoods(prev => prev.filter(af => af.id !== foodId));
      }

      await unlinkFoodFromProduct(productId, foodId, isTemp);
      
      toast.success("Alimento removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover alimento:", error);
      toast.error("Erro ao remover alimento");
      loadProductFoods();
    }
  };

  return (
    <div className="space-y-6">
      {/* Seção de Alimentos Originais */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Alimentos Originais</h4>
        <div className="flex gap-2">
          <Select value={selectedDefaultFood} onValueChange={setSelectedDefaultFood}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um alimento" />
            </SelectTrigger>
            <SelectContent>
              {foods?.map((food) => (
                <SelectItem key={food.id} value={food.id.toString()}>
                  {food.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddDefaultFood} type="button">
            Adicionar
          </Button>
        </div>

        {/* Lista de Alimentos Originais com seus Substitutos */}
        <div className="space-y-4">
          {defaultFoods.map((defaultFood) => (
            <div key={defaultFood.id} className="border rounded-lg p-4 space-y-4">
              {/* Alimento Original */}
              <div className="flex justify-between items-center">
                <span className="font-medium">{defaultFood.default_food.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFood(defaultFood.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>

              {/* Seção de Substitutos */}
              <div className="pl-4 space-y-2">
                <h5 className="text-sm font-medium flex items-center gap-2">
                  <ArrowDown className="h-4 w-4" />
                  Substituir por:
                </h5>
                
                <div className="flex gap-2">
                  <Select 
                    value={selectedAlternativeFood} 
                    onValueChange={setSelectedAlternativeFood}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um alimento substituto" />
                    </SelectTrigger>
                    <SelectContent>
                      {foods?.filter(food => food.id !== defaultFood.default_food.id)
                        .map((food) => (
                          <SelectItem key={food.id} value={food.id.toString()}>
                            {food.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => handleAddAlternativeFood(defaultFood.default_food.id)}
                    type="button"
                  >
                    Adicionar
                  </Button>
                </div>

                {/* Lista de Substitutos */}
                <div className="space-y-2">
                  {alternativeFoods
                    .filter(af => af.defaultFoodId === defaultFood.default_food.id)
                    .map((altFood) => (
                      <div key={altFood.id} className="flex justify-between items-center p-2 border rounded">
                        <span>{altFood.alternative.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFood(altFood.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 