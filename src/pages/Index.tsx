
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MealCard } from "@/components/MealCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { Skeleton } from "@/components/ui/skeleton";

type Product = Database['public']['Tables']['products']['Row'];

const Index = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Esqueleto de carregamento
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </div>
            ))
          ) : products?.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <p className="text-lg text-gray-500">
                Nenhum produto disponível no momento.
              </p>
            </div>
          ) : (
            products?.map((product) => (
              <MealCard
                key={product.id}
                id={product.id}
                title={product.title}
                description={product.description}
                price={Number(product.price)}
                image={product.images?.[0] || '/placeholder.svg'}
              />
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
