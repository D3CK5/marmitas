import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";

interface ProductFilters {
  category_id?: number | null;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  is_active?: boolean;
}

interface ProductFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
}

export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { categories } = useCategories();
  const [tempFilters, setTempFilters] = useState<ProductFilters>(filters);

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    setTempFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setTempFilters({});
    onFiltersChange({});
  };

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    setIsOpen(false);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    
    // Categoria
    if (tempFilters.category_id) count++;
    
    // Preços
    if (tempFilters.min_price) count++;
    if (tempFilters.max_price) count++;
    
    // Estoque (agora considera explicitamente true e false)
    if (tempFilters.in_stock !== undefined) count++;
    
    // Status (agora considera explicitamente true e false)
    if (tempFilters.is_active !== undefined) count++;
    
    return count;
  }, [tempFilters]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={tempFilters.category_id?.toString() || undefined}
              onValueChange={(value) => 
                handleFilterChange({ 
                  category_id: value ? parseInt(value) : null 
                })
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preço Mínimo</Label>
              <Input
                type="number"
                placeholder="R$ 0,00"
                value={tempFilters.min_price || ""}
                onChange={(e) => 
                  handleFilterChange({ 
                    min_price: e.target.value ? Number(e.target.value) : undefined 
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Preço Máximo</Label>
              <Input
                type="number"
                placeholder="R$ 999,99"
                value={tempFilters.max_price || ""}
                onChange={(e) => 
                  handleFilterChange({ 
                    max_price: e.target.value ? Number(e.target.value) : undefined 
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Em Estoque</Label>
            <Select
              value={tempFilters.in_stock?.toString() || undefined}
              onValueChange={(value) => 
                handleFilterChange({ 
                  in_stock: value === "all" ? undefined : value === "true" 
                })
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Em estoque</SelectItem>
                <SelectItem value="false">Sem estoque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={tempFilters.is_active?.toString() || undefined}
              onValueChange={(value) => 
                handleFilterChange({ 
                  is_active: value === "all" ? undefined : value === "true" 
                })
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClearFilters}>
              Limpar
            </Button>
            <Button onClick={handleApplyFilters}>
              Aplicar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 