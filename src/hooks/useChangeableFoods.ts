import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface ChangeableFood {
  id: number;
  name: string;
  description: string | null;
  category: string;
  created_at: string;
}

export interface ProductChangeableFood {
  id: number;
  product_id: number;
  default_food_id: number;
  alternative_food_id: number;
  created_at: string;
}

interface Food {
  id: number;
  name: string;
}

interface ProductFood {
  id: number;
  product_id: number;
  default_food: Food;
  default_food_id: number;
  alternative_food?: Food;
  alternative_food_id?: number;
}

interface LinkFoodParams {
  productId: number;
  defaultFoodId: number;
  alternativeFoodId?: number;
}

export function useChangeableFoods() {
  const queryClient = useQueryClient();

  // Buscar todos os alimentos disponíveis
  const { data: foods, refetch: refetchFoods } = useQuery<Food[]>({
    queryKey: ["changeable-foods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("changeable_foods")
        .select("id, name")
        .order("name");

      if (error) {
        throw error;
      }
      return data;
    }
  });

  // Buscar alimentos configurados para um produto
  const getProductFoods = async (productId: number) => {
    try {
      const { data, error } = await supabase
        .from("product_changeable_foods")
        .select(`
          id,
          product_id,
          is_active,
          default_food:changeable_foods!default_food_id (
            id,
            name
          ),
          alternative_food:changeable_foods!alternative_food_id (
            id,
            name
          )
        `)
        .eq("product_id", productId);

      if (error) {
        throw error;
      }

      return {
        defaultFoods: data || []
      };
    } catch (error) {
      throw error;
    }
  };

  // Vincular alimento ao produto
  const linkFoodToProduct = async ({ productId, defaultFoodId, alternativeFoodId }: LinkFoodParams) => {
    try {
      // Se for um alimento alternativo, verificar se já existe
      if (alternativeFoodId) {
        const { data: existing } = await supabase
          .from("product_changeable_foods")
          .select("id")
          .eq("product_id", productId)
          .eq("default_food_id", defaultFoodId)
          .eq("alternative_food_id", alternativeFoodId);

        if (existing && existing.length > 0) {
          toast.error("Este alimento substituto já está cadastrado");
          return;
        }
      } else {
        // Se for um alimento padrão, verificar se já existe
      const { data: existing } = await supabase
          .from("product_changeable_foods")
        .select("id")
          .eq("product_id", productId)
        .eq("default_food_id", defaultFoodId)
          .is("alternative_food_id", null);

        if (existing && existing.length > 0) {
          toast.error("Este alimento já está cadastrado");
        return;
        }
      }

      // Inserir novo vínculo
      const { error } = await supabase
        .from("product_changeable_foods")
        .insert({
          product_id: productId,
          default_food_id: defaultFoodId,
          alternative_food_id: alternativeFoodId || null
        });

      if (error) {
        toast.error("Erro ao vincular alimento");
        throw error;
      }

      // Invalidar cache
      await queryClient.invalidateQueries({ queryKey: ["product-foods", productId] });

      // Só mostrar o toast de sucesso se não houver erro
      toast.success(alternativeFoodId ? "Substituto adicionado!" : "Alimento adicionado!");
    } catch (error) {
      throw error;
    }
  };

  // Desvincular alimento do produto
  const unlinkFoodFromProduct = async (productId: number, foodId: number) => {
    try {
      const { error } = await supabase
        .from("product_changeable_foods")
        .delete()
        .eq("id", foodId);

      if (error) {
      toast.error("Erro ao remover alimento");
      throw error;
    }

      toast.success("Alimento removido!");
      
      // Invalidar cache
      await queryClient.invalidateQueries({ queryKey: ["product-foods", productId] });
    } catch (error) {
      throw error;
    }
  };

  // Criar alimento
  const createFood = useMutation({
    mutationFn: async (food: Omit<ChangeableFood, "id" | "created_at">) => {
      // Verificar se já existe um alimento com o mesmo nome
      const { data: existingFoods, error: searchError } = await supabase
        .from("changeable_foods")
        .select("id")
        .eq("name", food.name);

      if (searchError) throw searchError;
      
      if (existingFoods && existingFoods.length > 0) {
        throw new Error("Já existe um alimento com este nome");
      }

      const { data, error } = await supabase
        .from("changeable_foods")
        .insert(food)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["changeable-foods"] });
      toast.success("Alimento criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Atualizar alimento
  const updateFood = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ChangeableFood> & { id: number }) => {
      const { data: updatedFood, error } = await supabase
        .from("changeable_foods")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updatedFood;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["changeable-foods"] });
      // Invalidar todas as consultas de produtos, já que os alimentos podem estar vinculados a vários produtos
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-foods"] });
      toast.success("Alimento atualizado com sucesso!");
    },
  });

// Excluir alimento
const deleteFood = useMutation({
  mutationFn: async (id: number) => {
    // Primeiro deletar o alimento
    const { error: deleteError } = await supabase
      .rpc('delete_changeable_food', { target_food_id: id });

    if (deleteError) throw deleteError;

    // Esperar um pouco antes de reorganizar
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Depois reorganizar os IDs
    const { error: reorganizeError } = await supabase
      .rpc('reorganize_changeable_foods_ids');

    if (reorganizeError) throw reorganizeError;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["changeable-foods"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["product-foods"] });
    queryClient.invalidateQueries({ queryKey: ["foods"] });
    toast.success("Alimento excluído com sucesso!");
  },
});

  // Função para limpar alimentos vinculados em uma sessão
  const clearSessionFoods = async (productId: number) => {
    try {
      const { error } = await supabase
          .from("product_changeable_foods")
          .delete()
        .eq("product_id", productId);

        if (error) throw error;

      await queryClient.invalidateQueries({ 
        queryKey: ["product-foods", productId],
        exact: true
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    } catch (error) {
      throw error;
    }
  };

  // Toggle status do alimento (ativar/desativar)
  const toggleFoodStatus = async (foodId: number, productId: number, isDefaultFood: boolean = false) => {
    try {
      // Primeiro, buscar o status atual
      const { data: currentFood, error: fetchError } = await supabase
        .from("product_changeable_foods")
        .select("is_active, default_food_id")
        .eq("id", foodId)
        .single();

      if (fetchError) throw fetchError;

      // Se for um alimento padrão, atualizar todos os substitutos
      if (isDefaultFood) {
        const { data: alternatives, error: altError } = await supabase
          .from("product_changeable_foods")
          .select("id")
          .eq("product_id", productId)
          .eq("default_food_id", currentFood.default_food_id)
          .not("id", "eq", foodId); // Não incluir o próprio alimento padrão

        if (altError) throw altError;

        // Atualizar status de todos os substitutos para o mesmo do alimento padrão
        if (alternatives && alternatives.length > 0) {
          const { error: updateAltError } = await supabase
            .from("product_changeable_foods")
            .update({ is_active: !currentFood.is_active })
            .in("id", alternatives.map(alt => alt.id));

          if (updateAltError) throw updateAltError;
        }
      }

      // Atualizar o status do alimento principal
      const { error: updateError } = await supabase
        .from("product_changeable_foods")
        .update({ is_active: !currentFood.is_active })
        .eq("id", foodId);

      if (updateError) {
        toast.error("Erro ao alterar status do alimento");
        throw updateError;
      }

      // Invalidar cache
      await queryClient.invalidateQueries({ queryKey: ["product-foods", productId] });
      
      toast.success(currentFood.is_active 
        ? "Alimento desativado com sucesso!" 
        : "Alimento ativado com sucesso!"
      );
    } catch (error) {
      throw error;
    }
  };

  return {
    foods,
    refetchFoods,
    createFood,
    getProductFoods,
    linkFoodToProduct,
    unlinkFoodFromProduct,
    updateFood,
    deleteFood,
    clearSessionFoods,
    toggleFoodStatus
  };
} 