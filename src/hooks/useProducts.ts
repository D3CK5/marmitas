import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { STORAGE_PATHS } from "@/lib/supabase";

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  allows_food_changes: boolean;
  category_id: number;
  images: string[];
  nutritional_info?: {
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
    fiber: number;
    sodium: number;
  } | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  category?: {
    id: number;
    name: string;
  };
  changeable_foods?: Array<{
    id: number;
    is_default: boolean;
    default_food: {
      id: number;
      name: string;
    };
    alternative_food?: {
      id: number;
      name: string;
    };
  }>;
}

export function useProducts() {
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        // Buscar produtos
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select(`
            id,
            title,
            description,
            price,
            stock,
            is_active,
            is_featured,
            allows_food_changes,
            created_at,
            updated_at,
            category_id,
            images,
            nutritional_info,
            product_changeable_foods!left (
              id,
              is_default,
              default_food:changeable_foods!default_food_id (
                id,
                name
              ),
              alternative_food:changeable_foods!alternative_food_id (
                id,
                name
              )
            )
          `)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;

        // Buscar categorias
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name")
          .is('deleted_at', null);

        if (categoriesError) throw categoriesError;

        // Formatar os dados
        return (productsData || []).map(product => ({
          ...product,
          category: categoriesData?.find(c => c.id === product.category_id),
          changeable_foods: product.product_changeable_foods?.map(food => ({
            id: food.id,
            is_default: food.is_default,
            default_food: food.default_food,
            alternative_food: food.alternative_food
          })) || []
        }));

      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 1000 * 60,
  });

  // Buscar produtos na lixeira
  const getDeletedProducts = useQuery({
    queryKey: ["deleted-products"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            id,
            title,
            description,
            price,
            stock,
            is_active,
            created_at,
            deleted_at,
            category_id,
            category:categories(id, name)
          `)
          .not('deleted_at', 'is', null)
          .order('deleted_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Erro ao buscar produtos deletados:', error);
        return [];
      }
    },
  });

  // Soft delete
  const softDeleteProducts = useMutation({
    mutationFn: async (ids: number[]) => {
      const { error } = await supabase
        .from("products")
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["deleted-products"] });
      toast.success("Produtos movidos para a lixeira!");
    },
  });

  // Restaurar produtos
  const restoreProducts = useMutation({
    mutationFn: async (ids: number[]) => {
      const { error } = await supabase
        .from("products")
        .update({ deleted_at: null })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["deleted-products"] });
      toast.success("Produtos restaurados com sucesso!");
    },
  });

  // Exclusão permanente
  const permanentDeleteProducts = useMutation({
    mutationFn: async (ids: number[]) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deleted-products"] });
      toast.success("Produtos excluídos permanentemente!");
    },
  });

  // Toggle destaque
  const toggleFeatured = useMutation({
    mutationFn: async ({ id, featured }: { id: number; featured: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_featured: featured })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Status de destaque atualizado!");
    },
  });

  // Criar produto
  const createProduct = useMutation({
    mutationFn: async (newProduct: CreateProductInput) => {
      const { data, error } = await supabase
        .from("products")
        .insert(newProduct)
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar produto:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto criado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro detalhado:", error);
      toast.error("Erro ao criar produto: " + (error.message || "Erro desconhecido"));
    },
  });

  // Atualizar produto
  const updateProduct = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Product> & { id: number }) => {
      // Remover campos que não devem ser enviados na atualização
      const { changeable_foods, created_at, updated_at, deleted_at, ...updateData } = data as any;

      const { error } = await supabase
        .from("products")
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto atualizado com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar produto:", error);
      toast.error("Erro ao atualizar produto: " + (error.message || "Erro desconhecido"));
    },
  });

  // Deletar produto
  const deleteProduct = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir produto: " + error.message);
    },
  });

  // Upload de imagem
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${STORAGE_PATHS.PRODUCT_IMAGES}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Buscar produto por ID
  const useProduct = (id: number) => {
    return useQuery({
      queryKey: ["product", id],
      queryFn: async () => {
        try {
          const { data: product, error } = await supabase
            .from("products")
            .select(`
              *,
              category:categories(id, name)
            `)
            .eq('id', id)
            .is('deleted_at', null)
            .single();

          if (error) throw error;
          return product;
        } catch (error) {
          console.error('Erro ao buscar produto:', error);
          return null;
        }
      },
      retry: 3,
      retryDelay: 1000,
      staleTime: 1000 * 60,
    });
  };

  return {
    products,
    isLoading,
    deletedProducts: getDeletedProducts.data || [],
    totalPages: Math.ceil((products?.length || 0) / 20), // Ajustado para 20 itens por página
    currentPage: 1,
    totalProducts: products?.length || 0,
    softDeleteProducts,
    restoreProducts,
    permanentDeleteProducts,
    toggleFeatured,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadImage,
    useProduct
  };
} 