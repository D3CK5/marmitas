import { useState } from "react";
import { Share2 } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ImageGallery } from "@/components/ImageGallery";
import { QuantityCounter } from "@/components/QuantityCounter";
import { NutritionalTable } from "@/components/NutritionalTable";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const { addItem } = useCart();
  const { data: product, isLoading } = useProducts().useProduct(Number(id));

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

  const handleAddToCart = () => {
    if (!product) return;

    addItem(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        notes,
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
