
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Home, ShoppingBag, Headphones, Info } from "lucide-react";
import { Link } from "react-router-dom";

interface SideMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SideMenu({ open, onOpenChange }: SideMenuProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-6">
          <Button variant="ghost" asChild className="justify-start">
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              Início
            </Link>
          </Button>
          <Button variant="ghost" asChild className="justify-start">
            <Link to="/produtos">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Produtos
            </Link>
          </Button>
          <Button variant="ghost" asChild className="justify-start">
            <Link to="/suporte">
              <Headphones className="mr-2 h-5 w-5" />
              Suporte
            </Link>
          </Button>
          <Button variant="ghost" asChild className="justify-start">
            <Link to="/sobre">
              <Info className="mr-2 h-5 w-5" />
              Sobre
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
