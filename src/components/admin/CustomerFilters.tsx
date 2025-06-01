import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
import type { CustomerActivityStatus } from "@/hooks/useCustomer";

interface CustomerFiltersData {
  activityStatus?: CustomerActivityStatus | "all";
}

interface CustomerFiltersProps {
  filters: CustomerFiltersData;
  onFiltersChange: (filters: CustomerFiltersData) => void;
}

export function CustomerFilters({ filters, onFiltersChange }: CustomerFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<CustomerFiltersData>(filters);

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<CustomerFiltersData>) => {
    setTempFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setTempFilters({ activityStatus: "all" });
    onFiltersChange({ activityStatus: "all" });
    setIsOpen(false);
  };

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    setIsOpen(false);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    
    if (filters.activityStatus && filters.activityStatus !== "all") count++;
    
    return count;
  }, [filters]);

  return (
    <div className="flex items-center space-x-2">
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
              <Label>Status de Atividade</Label>
              <Select
                value={tempFilters.activityStatus || "all"}
                onValueChange={(value) => 
                  handleFilterChange({ 
                    activityStatus: value as CustomerActivityStatus | "all"
                  })
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Ativo">Ativo (até 15 dias)</SelectItem>
                  <SelectItem value="Recente">Recente (16-30 dias)</SelectItem>
                  <SelectItem value="Moderado">Moderado (31-60 dias)</SelectItem>
                  <SelectItem value="Distante">Distante (61-90 dias)</SelectItem>
                  <SelectItem value="Inativo">Inativo (mais de 90 dias)</SelectItem>
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

      {activeFiltersCount > 0 && (
        <Button 
          variant="outline" 
          onClick={handleClearFilters}
          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 px-3 py-1 h-9"
        >
          Limpar
        </Button>
      )}
    </div>
  );
} 