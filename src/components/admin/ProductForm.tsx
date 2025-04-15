import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImagePlus, X } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { FoodSelector } from "./FoodSelector";
import { useCategories } from "@/hooks/useCategories";
import { useChangeableFoods } from "@/hooks/useChangeableFoods";
import { supabase } from "@/lib/supabase";

interface ProductFormProps {
  onSubmit: () => void;
  initialData?: Product;
}

export function ProductForm({ onSubmit, initialData }: ProductFormProps) {
  const { createProduct, updateProduct, uploadImage } = useProducts();
  const { categories } = useCategories();
  const { clearSessionFoods, transferTempFoods } = useChangeableFoods();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [originalFormData, setOriginalFormData] = useState({
    title: "",
    description: "",
    price: 0,
    category_id: null,
    stock: 0,
    is_active: true,
    is_featured: false,
    allows_food_changes: false,
    images: [],
    nutritional_info: {
      calories: 0,
      proteins: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
      sodium: 0
    }
  });

  const [formData, setFormData] = useState(originalFormData);
  const [tempProductId, setTempProductId] = useState<number | null>(null);

  // Resetar formulário quando o modal abrir/fechar ou quando initialData mudar
  useEffect(() => {
    if (!initialData) {
      setFormData(originalFormData);
      setImages([]);
    } else {
      const newFormData = {
        title: initialData.title,
        description: initialData.description || "",
        price: initialData.price,
        category_id: initialData.category_id,
        stock: initialData.stock,
        is_active: initialData.is_active,
        is_featured: initialData.is_featured,
        allows_food_changes: initialData.allows_food_changes,
        images: initialData.images || [],
        nutritional_info: initialData.nutritional_info || {
          calories: 0,
          proteins: 0,
          carbs: 0,
          fats: 0,
          fiber: 0,
          sodium: 0
        }
      };
      
      setFormData(newFormData);
      setOriginalFormData(newFormData);
      setImages(initialData.images || []);
    }
  }, [initialData]);

  // Gerar um ID temporário para novos produtos quando ativar troca de alimentos
  useEffect(() => {
    if (!initialData && formData.allows_food_changes && !tempProductId) {
      setTempProductId(Math.floor(Math.random() * -1000000)); // ID negativo para garantir que não conflite com IDs reais
    }
  }, [formData.allows_food_changes, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    // Se for um campo da tabela nutricional
    if (['calories', 'proteins', 'carbs', 'fats', 'fiber', 'sodium'].includes(id)) {
      setFormData(prev => ({
        ...prev,
        nutritional_info: {
          ...prev.nutritional_info,
          [id]: value ? Number(value) : 0
        }
      }));
    } else {
      // Outros campos...
      setFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsLoading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      toast.error("Erro ao fazer upload das imagens");
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Limpar o ID temporário quando desativar troca de alimentos
  const handleFoodChangesToggle = (value: boolean) => {
    setFormData(prev => ({ ...prev, allows_food_changes: value }));
    if (!value) {
      setTempProductId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Preparar dados básicos do produto (sem changeable_foods)
      const productData = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        stock: Number(formData.stock),
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        images: formData.images,
        nutritional_info: formData.nutritional_info ? {
          calories: Number(formData.nutritional_info.calories),
          proteins: Number(formData.nutritional_info.proteins),
          carbs: Number(formData.nutritional_info.carbs),
          fats: Number(formData.nutritional_info.fats),
          fiber: Number(formData.nutritional_info.fiber),
          sodium: Number(formData.nutritional_info.sodium),
        } : null,
        allows_food_changes: formData.allows_food_changes
      };

      if (initialData) {
        await updateProduct.mutateAsync({
          id: initialData.id,
          ...productData,
        });
      } else {
        const newProduct = await createProduct.mutateAsync(productData);
        if (tempProductId) {
          await transferTempFoods(tempProductId, newProduct.id);
        }
      }
      
      setFormData(originalFormData);
      setImages([]);
      setTempProductId(null);
      
      toast.success(initialData ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!");
      onSubmit();
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);
      toast.error(`Erro ao ${initialData ? 'atualizar' : 'criar'} produto: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para lidar com o cancelamento
  const handleCancel = async () => {
    // Restaurar o estado original
    setFormData(originalFormData);
    
    if (initialData?.id) {
      // Se o estado original tinha troca de alimentos ativada e foi desativada durante a edição
      // ou vice-versa, precisamos limpar os alimentos adicionados na sessão
      if (originalFormData.allows_food_changes !== formData.allows_food_changes) {
        await clearSessionFoods(initialData.id);
      }
    }
    
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Imagens</Label>
          <div className="mt-2 grid grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image}
                  alt={`Produto ${index + 1}`}
                  className="h-24 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white hover:bg-destructive/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <label className="flex h-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400">
              <div className="flex flex-col items-center">
                <ImagePlus className="h-6 w-6 text-gray-400" />
                <span className="mt-1 text-sm text-gray-500">Adicionar</span>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="title" required value={formData.title} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.category_id?.toString() || ""} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: parseInt(value) }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Preço</Label>
            <Input id="price" name="price" type="number" step="0.01" required value={formData.price} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Estoque</Label>
            <Input id="stock" name="stock" type="number" required value={formData.stock} onChange={handleChange} />
          </div>
        </div>

        <div className="space-y-4">
          <Label>Informações Nutricionais (por 100g)</Label>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Calorias (kcal)</Label>
              <Input 
                id="calories" 
                type="number" 
                value={formData.nutritional_info?.calories || 0} 
                onChange={handleChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proteins">Proteínas (g)</Label>
              <Input 
                id="proteins" 
                type="number" 
                step="0.1" 
                value={formData.nutritional_info?.proteins || 0} 
                onChange={handleChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Carboidratos (g)</Label>
              <Input 
                id="carbs" 
                type="number" 
                step="0.1" 
                value={formData.nutritional_info?.carbs || 0} 
                onChange={handleChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fats">Gorduras (g)</Label>
              <Input 
                id="fats" 
                type="number" 
                step="0.1" 
                value={formData.nutritional_info?.fats || 0} 
                onChange={handleChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiber">Fibras (g)</Label>
              <Input 
                id="fiber" 
                type="number" 
                step="0.1" 
                value={formData.nutritional_info?.fiber || 0} 
                onChange={handleChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sodium">Sódio (mg)</Label>
              <Input 
                id="sodium" 
                type="number" 
                value={formData.nutritional_info?.sodium || 0} 
                onChange={handleChange} 
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="status"
              checked={formData.is_active}
              onCheckedChange={(value) => setFormData(prev => ({ ...prev, is_active: value }))}
            />
            <Label htmlFor="status">Produto ativo</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="food_changes"
              checked={formData.allows_food_changes}
              onCheckedChange={handleFoodChangesToggle}
            />
            <Label htmlFor="food_changes">Troca alimentos?</Label>
          </div>
        </div>
      </div>

      {formData.allows_food_changes && (initialData || tempProductId) && (
        <div className="space-y-4 border rounded-lg p-4">
          <h3 className="font-medium">Configuração de Troca de Alimentos</h3>
          <FoodSelector 
            productId={initialData?.id || tempProductId} 
            isTemp={!initialData}
          />
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          Salvar
        </Button>
      </div>
    </form>
  );
}
