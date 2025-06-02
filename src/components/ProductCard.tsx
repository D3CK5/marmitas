import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useGoogleAnalytics, useAnalyticsTracking } from "@/components/GoogleAnalyticsProvider";
import { useHotjar } from "@/components/HotjarProvider";
import { useFacebookPixel, useGoogleTagManager } from "@/components/TrackingProvider";

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  ingredients?: string[];
  category?: string;
  rating?: number;
  time_estimate?: string;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  
  // Hooks de tracking
  const { trackAddToCart } = useGoogleAnalytics();
  const { trackClick } = useAnalyticsTracking();
  const { trackEvent: trackHotjar } = useHotjar();
  const { trackAddToCart: fbTrackAddToCart } = useFacebookPixel();
  const { pushEvent } = useGoogleTagManager();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.is_available) {
      toast.error("Produto indisponível no momento");
      return;
    }

    addItem({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image_url
    }, 1);
    toast.success(`${product.title} adicionado ao carrinho!`);

    // Tracking em todas as plataformas
    trackAddToCart(product.id.toString(), product.title, product.price);
    trackClick('add_to_cart_button', {
      product_id: product.id,
      product_name: product.title,
      price: product.price,
      category: product.category
    });
    trackHotjar('add_to_cart');
    fbTrackAddToCart(product.price, 'BRL', product.id.toString());
    pushEvent('add_to_cart', {
      item_id: product.id,
      item_name: product.title,
      price: product.price,
      category: product.category
    });
  };

  const handleProductClick = () => {
    // Tracking de visualização de produto
    trackClick('product_view', {
      product_id: product.id,
      product_name: product.title,
      category: product.category
    });
    trackHotjar('product_view');
    pushEvent('view_item', {
      item_id: product.id,
      item_name: product.title,
      price: product.price,
      category: product.category
    });
  };

  return (
    <Link to={`/produto/${product.id}`} onClick={handleProductClick}>
      <Card className="group h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
        <CardHeader className="p-0 relative overflow-hidden">
          <div className="relative">
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {!product.is_available && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive" className="text-white">
                  Indisponível
                </Badge>
              </div>
            )}
            {product.rating && (
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-600 hover:text-red-500 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                trackClick('favorite_button', { product_id: product.id });
                trackHotjar('favorite_click');
                toast.info("Funcionalidade de favoritos em breve!");
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 flex-1">
          <div className="space-y-2">
            {product.category && (
              <Badge variant="secondary" className="text-xs">
                {product.category}
              </Badge>
            )}
            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
              {product.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
            
            {product.ingredients && product.ingredients.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Ingredientes:</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {product.ingredients.join(", ")}
                </p>
              </div>
            )}

            {product.time_estimate && (
              <div className="flex items-center text-xs text-muted-foreground">
                <span>🕒 {product.time_estimate}</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-primary">
              {formatPrice(product.price)}
            </span>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={!product.is_available}
            size="sm"
            className="gap-2 min-w-[100px]"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
} 