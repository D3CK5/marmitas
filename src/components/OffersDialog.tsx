
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { MealCard } from "./MealCard";

interface OffersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OFFERS = [
  {
    id: 1,
    title: "Combo Fitness",
    description: "5 refeições com 20% de desconto",
    price: 89.90,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500"
  },
  {
    id: 2,
    title: "Pacote Semanal",
    description: "7 refeições com 25% de desconto",
    price: 129.90,
    image: "https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?auto=format&fit=crop&q=80&w=500"
  },
];

export function OffersDialog({ open, onOpenChange }: OffersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ofertas Especiais</DialogTitle>
        </DialogHeader>
        <Carousel className="w-full">
          <CarouselContent>
            {OFFERS.map((offer) => (
              <CarouselItem key={offer.id}>
                <MealCard {...offer} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </DialogContent>
    </Dialog>
  );
}
