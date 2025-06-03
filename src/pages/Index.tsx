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
        .select(`
          *,
          category:categories(id, name)
        `)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 pt-20 pb-20">
        {/* Grid responsivo: 1 col mobile, 2 tablet, 3 laptop, 4+ desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {isLoading ? (
            // Loading Skeletons
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-4">
                <Skeleton className="h-40 sm:h-48 w-full rounded-2xl" />
                <div className="p-3 sm:p-4 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-5 sm:h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-7 sm:h-8 w-20" />
                    <Skeleton className="h-8 sm:h-9 w-20 sm:w-24 rounded-full" />
                  </div>
                </div>
              </div>
            ))
          ) : products?.length === 0 ? (
            <div className="col-span-full text-center py-10 lg:py-16">
              <p className="text-base sm:text-lg text-gray-500 px-4">
                Nenhum produto disponível no momento.
              </p>
            </div>
          ) : (
            products?.map((product, index) => (
              <MealCard
                key={product.id}
                id={product.id}
                title={product.title}
                description={product.description}
                price={Number(product.price)}
                image={product.images?.[0] || '/placeholder.svg'}
                category="Marmitas"
                rating={4.8}
                prepTime="20-30 min"
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
