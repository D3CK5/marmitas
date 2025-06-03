import { useState } from "react";
import { Link } from "react-router-dom";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, Star, Clock, Truck } from "lucide-react";
import { toast } from "sonner";

interface MealCardProps {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  className?: string;
  category?: string;
  rating?: number;
  prepTime?: string;
}

export function MealCard({ 
  id, 
  title, 
  description, 
  price, 
  image, 
  className,
  category = "Marmitas",
  rating = 4.8,
  prepTime = "20-30 min"
}: MealCardProps) {
  const { addItem } = useCart();
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    
    try {
      addItem({ id, title, price, image }, 1);
      toast.success(`${title} adicionado ao carrinho! 🍱`, {
        description: "Vá para o carrinho para finalizar o pedido",
        duration: 3000,
      });
    } catch (error) {
      toast.error("Erro ao adicionar ao carrinho");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    toast.info(isLiked ? "Removido dos favoritos" : "Adicionado aos favoritos");
  };

  return (
    <Link 
      to={`/produto/${id}`} 
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Like Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-2 right-2 sm:top-3 sm:right-3 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 h-8 w-8 sm:h-9 sm:w-9",
            isLiked ? "text-red-500" : "text-gray-600 hover:text-red-500"
          )}
          onClick={handleLike}
        >
          <Heart className={cn("w-3 h-3 sm:w-4 sm:h-4", isLiked && "fill-current")} />
        </Button>

        {/* Quick Add Button - appears on hover for desktop */}
        <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4 opacity-0 lg:group-hover:opacity-100 transition-all duration-300 transform translate-y-2 lg:group-hover:translate-y-0 hidden lg:block">
          <Button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="w-full bg-white text-gray-900 hover:bg-gray-50 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm h-8 sm:h-9"
            size="sm"
          >
            {isLoading ? (
              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Adicionar ao Carrinho</span>
                <span className="sm:hidden">Adicionar</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Category and Rating */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs font-medium">
            {category}
          </Badge>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground font-medium">
              {rating}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base sm:text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Info Row */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span className="text-xs">{prepTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Truck className="w-3 h-3" />
            <span className="text-xs">Entrega grátis</span>
          </div>
        </div>

        {/* Price and Add Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-1">
            <span className="text-xl sm:text-2xl font-bold text-primary">
              {formatPrice(price)}
            </span>
            <p className="text-xs text-muted-foreground">
              por porção
            </p>
          </div>
          
          <Button 
            onClick={handleAddToCart}
            disabled={isLoading}
            size="sm"
            className="rounded-full bg-primary hover:bg-primary-600 font-semibold px-3 sm:px-4 shadow-md hover:shadow-lg transition-all duration-200 h-8 sm:h-9 text-xs sm:text-sm"
          >
            {isLoading ? (
              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Adicionar</span>
                <span className="sm:hidden">Add</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Hover effect border */}
      <div className="absolute inset-0 rounded-2xl border-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Link>
  );
}
