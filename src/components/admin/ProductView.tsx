import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";

interface ProductViewProps {
  product: Product;
}

export function ProductView({ product }: ProductViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground">Informações Básicas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <p className="text-sm text-muted-foreground">{product.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Preço</label>
              <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Categoria</label>
              <p className="text-sm text-muted-foreground">{product.category?.name || "Sem categoria"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Estoque</label>
              <p className="text-sm text-muted-foreground">{product.stock}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground">Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Ativo</label>
              <p className="text-sm text-muted-foreground">{product.is_active ? "Sim" : "Não"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Destaque</label>
              <p className="text-sm text-muted-foreground">{product.is_featured ? "Sim" : "Não"}</p>
            </div>
          </div>
        </div>

        {product.description && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Descrição</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
          </div>
        )}

        {product.foods && product.foods.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Alimentos</h3>
            <div className="flex flex-wrap gap-2">
              {product.foods.map((food) => (
                <span key={food.id} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                  {food.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 