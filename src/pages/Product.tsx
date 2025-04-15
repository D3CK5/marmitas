
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

// Mock data - será substituído por dados do Supabase
const MOCK_PRODUCT = {
  id: 1,
  title: "Frango Grelhado com Quinoa",
  description: "Peito de frango grelhado temperado com ervas finas, acompanhado de quinoa cozida e legumes salteados no azeite de oliva extra virgem. Uma refeição balanceada, rica em proteínas e com baixo teor de gordura.",
  price: 29.90,
  images: [
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?auto=format&fit=crop&q=80&w=500",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=500",
  ],
  nutritionalInfo: {
    calories: 380,
    proteins: 32,
    carbs: 45,
    fats: 12,
    fiber: 6,
    sodium: 580,
  },
};

export default function Product() {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const { addItem } = useCart();

  const handleShare = async () => {
    try {
      await navigator.share({
        title: MOCK_PRODUCT.title,
        text: MOCK_PRODUCT.description,
        url: window.location.href,
      });
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
    }
  };

  const handleAddToCart = () => {
    addItem(
      {
        id: MOCK_PRODUCT.id,
        title: MOCK_PRODUCT.title,
        price: MOCK_PRODUCT.price,
        image: MOCK_PRODUCT.images[0],
        notes,
      },
      quantity
    );
    toast.success("Produto adicionado ao carrinho!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 pb-20">
        <div className="max-w-4xl mx-auto">
          <ImageGallery images={MOCK_PRODUCT.images} title={MOCK_PRODUCT.title} />
          
          <div className="mt-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{MOCK_PRODUCT.title}</h1>
                <p className="text-2xl font-bold text-primary mt-2">
                  R$ {MOCK_PRODUCT.price.toFixed(2)}
                </p>
              </div>
              <button
                onClick={handleShare}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <Share2 className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600">{MOCK_PRODUCT.description}</p>

            <NutritionalTable nutritionalInfo={MOCK_PRODUCT.nutritionalInfo} />

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
