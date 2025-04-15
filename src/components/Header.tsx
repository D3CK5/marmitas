
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="container flex items-center h-16 px-4">
        <a href="/" className="text-2xl font-bold text-primary">
          Marmitas Fit
        </a>
        
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="search"
              placeholder="Buscar marmitas..."
              className="w-full pl-10 bg-secondary/80"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
