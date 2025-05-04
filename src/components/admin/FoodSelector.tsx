import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { useChangeableFoods } from "@/hooks/useChangeableFoods";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface FoodSelectorProps {
  productId: number;
}

interface ProductFood {
  id: number;
  is_active: boolean;
  default_food: {
    id: number;
    name: string;
  };
  alternative_foods?: {
    id: number;
    is_active: boolean;
    food: {
      id: number;
      name: string;
    };
  }[];
}

export function FoodSelector({ productId }: FoodSelectorProps) {
  const { foods, getProductFoods, linkFoodToProduct, unlinkFoodFromProduct, toggleFoodStatus } = useChangeableFoods();
  const [selectedFood, setSelectedFood] = useState<string>("");
  const [selectedAlternatives, setSelectedAlternatives] = useState<Record<number, string>>({});
  const [productFoods, setProductFoods] = useState<ProductFood[]>([]);

  // Carregar alimentos do produto quando o componente montar
  useEffect(() => {
    loadProductFoods();
  }, [productId]);

  // Carregar alimentos do produto
  const loadProductFoods = async () => {
    try {
      const data = await getProductFoods(productId);
      
      // Agrupar alimentos por default_food_id
      const groupedFoods = data.defaultFoods.reduce((acc: any, curr: any) => {
        const defaultFoodId = curr.default_food.id;
        
        if (!acc[defaultFoodId]) {
          acc[defaultFoodId] = {
            id: curr.id,
            is_active: curr.is_active,
            default_food: curr.default_food,
            alternative_foods: []
          };
        }
        
        if (curr.alternative_food) {
          acc[defaultFoodId].alternative_foods.push({
            id: curr.id,
            is_active: curr.is_active,
            food: curr.alternative_food
          });
        }
        
        return acc;
      }, {});

      setProductFoods(Object.values(groupedFoods));
    } catch (error) {
      toast.error("Erro ao carregar alimentos");
    }
  };

  // Obter lista de alimentos já usados como padrão
  const getUsedDefaultFoods = () => {
    return productFoods.map(food => food.default_food.id);
  };

  // Obter lista de alimentos já usados como substitutos para um alimento padrão específico
  const getUsedAlternativeFoods = (defaultFoodId: number) => {
    const defaultFood = productFoods.find(food => food.default_food.id === defaultFoodId);
    if (!defaultFood) return [];
    return defaultFood.alternative_foods?.map(alt => alt.food.id) || [];
  };

  // Obter lista de alimentos disponíveis para seleção como padrão
  const getAvailableDefaultFoods = () => {
    const usedFoodIds = getUsedDefaultFoods();
    return foods?.filter(food => !usedFoodIds.includes(food.id)) || [];
  };

  // Obter lista de alimentos disponíveis para seleção como substitutos
  const getAvailableAlternativeFoods = (defaultFoodId: number) => {
    if (!foods) return [];
    const usedAlternativeFoodIds = getUsedAlternativeFoods(defaultFoodId);
    return foods.filter(food => 
      food.id !== defaultFoodId && 
      !usedAlternativeFoodIds.includes(food.id)
    );
  };

  // Adicionar alimento padrão
  const handleAddDefaultFood = async () => {
    if (!selectedFood || selectedFood === "no-options") {
      toast.error("Selecione um alimento primeiro");
      return;
    }
    
    try {
      await linkFoodToProduct({
        productId,
        defaultFoodId: parseInt(selectedFood)
      });

      setSelectedFood("");
      loadProductFoods();
    } catch (error) {
      console.error("Erro ao adicionar alimento:", error);
    }
  };

  // Adicionar alimento alternativo
  const handleAddAlternativeFood = async (defaultFoodId: number) => {
    const selectedAlternative = selectedAlternatives[defaultFoodId];
    if (!selectedAlternative || selectedAlternative === "no-alternatives") {
      toast.error("Selecione um alimento substituto");
      return;
    }

    try {
      await linkFoodToProduct({
        productId,
        defaultFoodId,
        alternativeFoodId: parseInt(selectedAlternative)
      });

      setSelectedAlternatives(prev => ({
        ...prev,
        [defaultFoodId]: ""
      }));
      loadProductFoods();
    } catch (error) {
      console.error("Erro ao adicionar substituto:", error);
    }
  };

  // Remover alimento ou substituto
  const handleRemoveFood = async (foodId: number) => {
    try {
      await unlinkFoodFromProduct(productId, foodId);
      loadProductFoods();
    } catch (error) {
      console.error("Erro ao remover alimento:", error);
    }
  };

  // Função para alternar o status de um alimento
  const handleToggleStatus = async (foodId: number) => {
    try {
      await toggleFoodStatus(foodId, productId, true);
      loadProductFoods();
    } catch (error) {
      console.error("Erro ao alterar status do alimento:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Select 
            value={selectedFood} 
            onValueChange={setSelectedFood}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um alimento" />
            </SelectTrigger>
            <SelectContent>
              {getAvailableDefaultFoods().length > 0 ? (
                getAvailableDefaultFoods().map((food) => (
                  <SelectItem key={food.id} value={food.id.toString()}>
                    {food.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-options" disabled>
                  Todas as opções já foram cadastradas
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAddDefaultFood}>
          Adicionar
        </Button>
      </div>

      <div className="space-y-6">
        {productFoods.map((food) => (
          <div key={food.id} className="space-y-2">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-4">
                <span className={`font-medium ${!food.is_active ? 'text-gray-400' : ''}`}>
                  {food.default_food.name}
                </span>
                <Switch
                  checked={food.is_active}
                  onCheckedChange={async () => {
                    try {
                      await toggleFoodStatus(food.id, productId, true);
                      loadProductFoods();
                    } catch (error) {
                      console.error("Erro ao alterar status do alimento:", error);
                    }
                  }}
                />
              </div>
              <button
                onClick={() => handleRemoveFood(food.id)}
                className="text-gray-500 hover:text-red-500"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            <div className="pl-8 space-y-4">
              <span className="text-sm text-gray-500">Substituir por:</span>
              
              {/* Lista de substitutos */}
              {food.alternative_foods?.map((alt) => (
                <div key={alt.id} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-4">
                    <span className={!alt.is_active ? 'text-gray-400' : ''}>
                      {alt.food.name}
                    </span>
                    <Switch
                      checked={alt.is_active}
                      onCheckedChange={async () => {
                        try {
                          await toggleFoodStatus(alt.id, productId, false);
                          loadProductFoods();
                        } catch (error) {
                          console.error("Erro ao alterar status do alimento:", error);
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveFood(alt.id)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}

              {/* Adicionar novo substituto */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Select 
                    value={selectedAlternatives[food.default_food.id] || ""}
                    onValueChange={(value) => setSelectedAlternatives(prev => ({
                      ...prev,
                      [food.default_food.id]: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um alimento substituto" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableAlternativeFoods(food.default_food.id).length > 0 ? (
                        getAvailableAlternativeFoods(food.default_food.id).map((food) => (
                          <SelectItem key={food.id} value={food.id.toString()}>
                            {food.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-alternatives" disabled>
                          Todas as trocas já foram cadastradas
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => handleAddAlternativeFood(food.default_food.id)}>
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 