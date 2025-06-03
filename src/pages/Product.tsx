import { useState, useEffect } from "react";
import { Share2, Utensils } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ImageGallery } from "@/components/ImageGallery";
import { QuantityCounter } from "@/components/QuantityCounter";
import { NutritionalTable } from "@/components/NutritionalTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useChangeableFoods } from "@/hooks/useChangeableFoods";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductFood {
  id: number;
  is_active: boolean;
  default_food: {
    id: number;
    name: string;
  };
  alternative_foods?: Array<{
    id: number;
    is_active: boolean;
    food: {
      id: number;
      name: string;
    };
  }>;
}

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedFoodChanges, setSelectedFoodChanges] = useState<Record<number, number>>({});
  const [productFoods, setProductFoods] = useState<ProductFood[]>([]);
  const [isFoodChangesActive, setIsFoodChangesActive] = useState(false);
  const [hasChosenDefault, setHasChosenDefault] = useState(false);
  const { addItem } = useCart();
  const { data: product, isLoading } = useProducts().useProduct(Number(id));
  const { getProductFoods } = useChangeableFoods();

  // Carregar alimentos do produto quando o produto for carregado
  useEffect(() => {
    if (product?.allows_food_changes && product.id) {
      loadProductFoods();
    }
  }, [product?.allows_food_changes, product?.id]);

  const loadProductFoods = async () => {
    if (!product?.id) return;
    
    try {
      const data = await getProductFoods(product.id);
      
      // Agrupar alimentos por default_food_id e filtrar apenas os ativos
      const groupedFoods = data.defaultFoods
        .filter((item: any) => item.is_active) // Filtrar apenas alimentos ativos
        .reduce((acc: any, curr: any) => {
          const defaultFoodId = curr.default_food.id;
          
          if (!acc[defaultFoodId]) {
            acc[defaultFoodId] = {
              id: curr.id,
              is_active: curr.is_active,
              default_food: curr.default_food,
              alternative_foods: []
            };
          }
          
          if (curr.alternative_food && curr.is_active) {
            acc[defaultFoodId].alternative_foods.push({
              id: curr.id,
              is_active: curr.is_active,
              food: curr.alternative_food
            });
          }
          
          return acc;
        }, {});

      const foods = Object.values(groupedFoods) as ProductFood[];
      setProductFoods(foods);
      
      // Remover inicialização automática - agora é feita apenas quando ativar as trocas
    } catch (error) {
      console.error("Erro ao carregar alimentos:", error);
    }
  };

  if (!id) {
    navigate('/');
    return null;
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product?.title,
        text: product?.description,
        url: window.location.href,
      });
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
    }
  };

  const handleFoodChange = (defaultFoodId: number, selectedFoodId: number) => {
    setSelectedFoodChanges(prev => ({
      ...prev,
      [defaultFoodId]: selectedFoodId
    }));
  };

  const handleActivateFoodChanges = () => {
    setIsFoodChangesActive(true);
    setHasChosenDefault(false);
    
    // Inicializar seleções com os alimentos padrão
    const defaultSelections: Record<number, number> = {};
    productFoods.forEach((food) => {
      defaultSelections[food.default_food.id] = food.default_food.id;
    });
    setSelectedFoodChanges(defaultSelections);
  };

  const handleChooseDefault = () => {
    setIsFoodChangesActive(false);
    setHasChosenDefault(true);
    setSelectedFoodChanges({});
  };

  const handleDeactivateFoodChanges = () => {
    setIsFoodChangesActive(false);
    setHasChosenDefault(false);
    setSelectedFoodChanges({});
  };

  // Função para verificar se pelo menos um alimento foi alterado do padrão
  const hasAtLeastOneChange = () => {
    return productFoods.some(food => {
      const selectedId = selectedFoodChanges[food.default_food.id];
      return selectedId && selectedId !== food.default_food.id;
    });
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Nova lógica de validação para trocas ativas
    if (product.allows_food_changes && isFoodChangesActive && productFoods.length > 0) {
      const missingSelections = productFoods.filter(food => 
        !selectedFoodChanges[food.default_food.id]
      );
      
      // Se há seleções faltando, bloquear
      if (missingSelections.length > 0) {
        toast.error("Por favor, selecione todas as opções de alimentos");
        return;
      }

      // Se tem apenas 1 item de troca: DEVE ser alterado obrigatoriamente
      if (productFoods.length === 1) {
        const hasChanges = hasAtLeastOneChange();
        if (!hasChanges) {
          toast.error("Para personalizar, você deve alterar o alimento ou clicar em 'Manter padrão'");
          return;
        }
      }
      
      // Se tem 2 ou mais itens: pelo menos 1 DEVE ser alterado
      if (productFoods.length >= 2) {
        const hasChanges = hasAtLeastOneChange();
        if (!hasChanges) {
          toast.error("Para personalizar, altere pelo menos um alimento ou clique em 'Manter padrão'");
          return;
        }
      }
    }

    // Gerar texto das trocas selecionadas para as observações apenas se ativo
    let foodChangesText = "";
    if (product.allows_food_changes && isFoodChangesActive && productFoods.length > 0) {
      const changes = productFoods.map(food => {
        const selectedId = selectedFoodChanges[food.default_food.id];
        const selectedFood = selectedId === food.default_food.id 
          ? food.default_food
          : food.alternative_foods?.find(alt => alt.food.id === selectedId)?.food;
        
        return `${food.default_food.name}: ${selectedFood?.name || food.default_food.name}`;
      });
      
      foodChangesText = `Trocas: ${changes.join(", ")}`;
    }

    const finalNotes = [notes, foodChangesText].filter(Boolean).join(" | ");

    addItem(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        notes: finalNotes,
      },
      quantity
    );
    toast.success("Produto adicionado ao carrinho!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 pt-20 pb-20">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="w-full h-[300px] rounded-lg" />
            <div className="mt-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-8 w-32 mt-2" />
                </div>
              </div>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!product) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 pb-20">
        <div className="max-w-4xl mx-auto">
          <ImageGallery images={product.images} title={product.title} />
          
          <div className="mt-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
                <p className="text-2xl font-bold text-primary mt-2">
                  R$ {product.price.toFixed(2)}
                </p>
                {product.allows_food_changes && (
                  <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                    <Utensils className="w-3 h-3 mr-1" />
                    Permite trocas de alimentos
                  </Badge>
                )}
              </div>
              <button
                onClick={handleShare}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <Share2 className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600">{product.description}</p>

            {product.nutritional_info && (
              <NutritionalTable nutritionalInfo={product.nutritional_info} />
            )}

            {/* Sistema de Trocas de Alimentos */}
            {product.allows_food_changes && productFoods.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-primary" />
                    Personalize seu Pedido
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Você pode personalizar os alimentos desta marmita
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {hasChosenDefault ? (
                    // Estado colapsado quando escolheu manter padrão
                    <div className="text-center py-2">
                      <p className="text-sm text-green-600 font-medium">
                        Manteve Padrão
                      </p>
                    </div>
                  ) : !isFoodChangesActive ? (
                    // Pergunta inicial para ativar as trocas
                    <div className="text-center space-y-4 py-4">
                      <div className="flex gap-3 justify-center">
                        <Button 
                          onClick={handleActivateFoodChanges}
                          className="px-6"
                        >
                          Sim, quero personalizar
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleChooseDefault}
                          className="px-6"
                        >
                          Não, manter padrão
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Interface completa de trocas quando ativado
                    <>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-green-600 font-medium">
                          ✓ Trocas ativadas - Personalize seus alimentos
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleChooseDefault}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          Manter padrão
                        </Button>
                      </div>
                      
                      {productFoods.map((food) => (
                        <div key={food.default_food.id} className="space-y-3">
                          <h4 className="font-medium text-gray-900">
                            {food.default_food.name}
                          </h4>
                          <RadioGroup
                            value={selectedFoodChanges[food.default_food.id]?.toString()}
                            onValueChange={(value) => 
                              handleFoodChange(food.default_food.id, parseInt(value))
                            }
                            className="space-y-2"
                          >
                            {/* Opção padrão */}
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value={food.default_food.id.toString()} 
                                id={`default-${food.default_food.id}`}
                              />
                              <Label 
                                htmlFor={`default-${food.default_food.id}`}
                                className="font-normal cursor-pointer"
                              >
                                {food.default_food.name} (padrão)
                              </Label>
                            </div>
                            
                            {/* Opções alternativas */}
                            {food.alternative_foods?.map((alt) => (
                              <div key={alt.id} className="flex items-center space-x-2">
                                <RadioGroupItem 
                                  value={alt.food.id.toString()} 
                                  id={`alt-${alt.id}`}
                                />
                                <Label 
                                  htmlFor={`alt-${alt.id}`}
                                  className="font-normal cursor-pointer"
                                >
                                  {alt.food.name}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <Input
                  id="notes"
                  placeholder="Ex: Sem cebola, molho à parte..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <QuantityCounter
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                />
                <button
                  onClick={handleAddToCart}
                  className="bg-primary text-white px-8 py-3 rounded-full font-medium hover:bg-primary-600 transition-colors"
                >
                  Adicionar ao Carrinho
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
