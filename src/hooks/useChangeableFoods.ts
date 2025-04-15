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

export function useChangeableFoods() {
  const queryClient = useQueryClient();

  // Buscar todos os alimentos disponíveis
  const { data: foods, isLoading } = useQuery({
    queryKey: ["changeable-foods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("changeable_foods")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Buscar alimentos de um produto (temporário ou real)
  const getProductFoods = async (productId: number, isTemp = false) => {
    try {
      const table = isTemp ? 'temp_product_changeable_foods' : 'product_changeable_foods';
      const idField = isTemp ? 'temp_product_id' : 'product_id';

      // Buscar alimentos originais
      const { data: defaultFoods, error: defaultError } = await supabase
        .from(table)
        .select(`
          id,
          default_food:changeable_foods!default_food_id(
            id,
            name
          )
        `)
        .eq(idField, productId)
        .is("alternative_food_id", null);

      if (defaultError) throw defaultError;

      // Buscar alimentos substitutos
      const { data: alternativeFoods, error: altError } = await supabase
        .from(table)
        .select(`
          id,
          defaultFoodId:default_food_id,
          alternative:changeable_foods!alternative_food_id(
            id,
            name
          )
        `)
        .eq(idField, productId)
        .not("alternative_food_id", "is", null);

      if (altError) throw altError;

      return {
        defaultFoods: defaultFoods || [],
        alternativeFoods: alternativeFoods || []
      };
    } catch (error) {
      console.error("Erro ao buscar alimentos:", error);
      throw error;
    }
  };

  // Adicionar alimento ao produto (seja temporário ou real)
  const linkFoodToProduct = async ({
    productId,
    defaultFoodId,
    alternativeFoodId,
    isTemp = false
  }: {
    productId: number;
    defaultFoodId: number;
    alternativeFoodId?: number;
    isTemp?: boolean;
  }) => {
    try {
      const table = isTemp ? 'temp_product_changeable_foods' : 'product_changeable_foods';
      const idField = isTemp ? 'temp_product_id' : 'product_id';
      
      // Verificar duplicatas
      const { data: existing } = await supabase
        .from(table)
        .select("id")
        .eq(idField, productId)
        .eq("default_food_id", defaultFoodId)
        .eq("alternative_food_id", alternativeFoodId || null)
        .maybeSingle();

      if (existing) {
        toast.error("Este alimento já está vinculado ao produto");
        return;
      }

      const { error } = await supabase
        .from(table)
        .insert({
          [idField]: productId,
          default_food_id: defaultFoodId,
          alternative_food_id: alternativeFoodId || null
        });

      if (error) throw error;

      toast.success(alternativeFoodId 
        ? "Alimento substituto adicionado com sucesso!"
        : "Alimento adicionado com sucesso!"
      );
    } catch (error) {
      console.error("Erro ao vincular alimento:", error);
      toast.error("Erro ao adicionar alimento");
      throw error;
    }
  };

  // Remover alimento (temporário ou real)
  const unlinkFoodFromProduct = async (productId: number, foodId: number, isTemp = false) => {
    try {
      const table = isTemp ? 'temp_product_changeable_foods' : 'product_changeable_foods';
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", foodId);

      if (error) throw error;
      
      toast.success("Alimento removido com sucesso!");
      return true;
    } catch (error) {
      console.error("Erro ao desvincular alimento:", error);
      toast.error("Erro ao remover alimento");
      throw error;
    }
  };

  // Transferir alimentos temporários para produto real
  const transferTempFoods = async (tempId: number, realId: number) => {
    try {
      const { data: tempFoods } = await supabase
        .from('temp_product_changeable_foods')
        .select('*')
        .eq('temp_product_id', tempId);

      if (tempFoods?.length) {
        const newFoods = tempFoods.map(food => ({
          product_id: realId,
          default_food_id: food.default_food_id,
          alternative_food_id: food.alternative_food_id
        }));

        await supabase
          .from('product_changeable_foods')
          .insert(newFoods);
      }

      // Limpar alimentos temporários
      await supabase
        .from('temp_product_changeable_foods')
        .delete()
        .eq('temp_product_id', tempId);

    } catch (error) {
      console.error("Erro ao transferir alimentos:", error);
      throw error;
    }
  };

  // Criar alimento
  const createFood = useMutation({
    mutationFn: async (food: Omit<ChangeableFood, "id" | "created_at">) => {
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
      toast.success("Alimento atualizado com sucesso!");
    },
  });

  // Excluir alimento
  const deleteFood = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("changeable_foods")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["changeable-foods"] });
      toast.success("Alimento excluído com sucesso!");
    },
  });

  // Função para limpar alimentos vinculados em uma sessão
  const clearSessionFoods = async (productId: number) => {
    try {
      // Primeiro, buscar os alimentos originais para não excluí-los
      const { data: originalFoods } = await supabase
        .from("product_changeable_foods")
        .select("id")
        .eq("product_id", productId)
        .lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()); // alimentos mais antigos que 5 minutos

      const originalIds = originalFoods?.map(f => f.id) || [];

      if (originalIds.length > 0) {
        // Excluir apenas os alimentos adicionados na sessão atual
        const { error } = await supabase
          .from("product_changeable_foods")
          .delete()
          .eq("product_id", productId)
          .gt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // últimos 5 minutos
          .not("id", "in", `(${originalIds.join(",")})`); // Formatação correta do array para a query

        if (error) throw error;
      } else {
        // Se não houver alimentos originais, apenas limpa os últimos 5 minutos
        const { error } = await supabase
          .from("product_changeable_foods")
          .delete()
          .eq("product_id", productId)
          .gt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

        if (error) throw error;
      }

      await queryClient.invalidateQueries({ 
        queryKey: ["product-foods", productId],
        exact: true
      });
    } catch (error) {
      console.error("Erro ao limpar alimentos da sessão:", error);
    }
  };

  return {
    foods,
    isLoading,
    createFood,
    getProductFoods,
    linkFoodToProduct,
    unlinkFoodFromProduct,
    updateFood,
    deleteFood,
    clearSessionFoods,
    transferTempFoods,
  };
} 