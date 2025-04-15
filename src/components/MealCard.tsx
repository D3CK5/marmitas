
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";

interface MealCardProps {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  className?: string;
}

export function MealCard({ id, title, description, price, image, className }: MealCardProps) {
  const { addItem } = useCart();

  return (
    <Link to={`/produto/${id}`} className={cn(
      "group relative overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-lg animate-fade-in",
      className
    )}>
      <div className="aspect-w-4 aspect-h-3">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg truncate">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{description}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            R$ {price.toFixed(2)}
          </span>
          <button 
            onClick={(e) => {
              e.preventDefault();
              addItem({ id, title, price, image }, 1);
            }}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Adicionar
          </button>
        </div>
      </div>
    </Link>
  );
}
