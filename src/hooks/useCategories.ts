import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface Category {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  is_default?: boolean;
}

export function useCategories() {
  const queryClient = useQueryClient();

  const { data: categories, isLoading, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('id', { ascending: true });  // Ordenar por ID para garantir que "Sem Categoria" vem primeiro

      if (error) throw error;
      
      // Marcar a categoria com ID=1 como padrão (não pode ser excluída)
      return data?.map(category => ({
        ...category,
        is_default: category.id === 1
      }));
    },
  });

  // Verificar se a categoria padrão existe e criar se necessário
  const ensureDefaultCategory = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id')
      .eq('id', 1)
      .maybeSingle();
    
    if (!data) {
      await supabase
        .from('categories')
        .insert([
          { 
            id: 1,
            name: 'Sem Categoria',
            slug: 'sem-categoria'
          }
        ]);
      await refetchCategories();
    }
  };

  // Executar na inicialização
  ensureDefaultCategory();

  const createCategory = useMutation({
    mutationFn: async (newCategory: { name: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert([
          { 
            name: newCategory.name,
            slug: newCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar categoria:', error);
      toast.error('Erro ao criar categoria');
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      // Não permitir alterar a categoria padrão
      if (id === 1) {
        throw new Error("A categoria padrão não pode ser alterada");
      }
      
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      
      const { data, error } = await supabase
        .from("categories")
        .update({ name, slug, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria atualizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar categoria: " + error.message);
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: number) => {
      // Não permitir excluir a categoria padrão
      if (id === 1) {
        throw new Error("A categoria padrão não pode ser excluída");
      }
      
      // Primeiro, deletar a categoria usando a função RPC
      const { error: deleteError } = await supabase
        .rpc('delete_category', { target_category_id: id });

      if (deleteError) throw deleteError;

      // Esperar um pouco antes de reorganizar
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reorganizar os IDs
      const { error: reorganizeError } = await supabase
        .rpc('reorganize_categories_ids');

      if (reorganizeError) throw reorganizeError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Categoria excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir categoria: " + error.message);
    },
  });

  return {
    categories,
    isLoading,
    refetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
} 