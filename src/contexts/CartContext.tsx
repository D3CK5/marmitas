import { createContext, useContext, useEffect, useState } from "react";
import { generateCartItemId } from "@/lib/utils";

interface CartItem {
  id: number;
  uniqueId: string; // ID único baseado no produto + configurações
  title: string;
  price: number;
  image: string;
  quantity: number;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "uniqueId">, quantity: number) => void;
  removeItem: (uniqueId: string) => void;
  updateQuantity: (uniqueId: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Carregar carrinho do localStorage ao iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Migrar dados antigos do carrinho se necessário
        const migratedCart = parsedCart.map((item: any) => {
          if (!item.uniqueId) {
            return {
              ...item,
              uniqueId: generateCartItemId(item.id, item.notes)
            };
          }
          return item;
        });
        setItems(migratedCart);
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
        setItems([]);
      }
    }
  }, []);

  // Salvar carrinho no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, "quantity" | "uniqueId">, quantity: number) => {
    setItems((currentItems) => {
      const uniqueId = generateCartItemId(newItem.id, newItem.notes);
      const existingItem = currentItems.find((item) => item.uniqueId === uniqueId);
      
      if (existingItem) {
        return currentItems.map((item) =>
          item.uniqueId === uniqueId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...currentItems, { ...newItem, uniqueId, quantity }];
    });
  };

  const removeItem = (uniqueId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.uniqueId !== uniqueId));
  };

  const updateQuantity = (uniqueId: string, quantity: number) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.uniqueId === uniqueId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        setIsOpen,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
