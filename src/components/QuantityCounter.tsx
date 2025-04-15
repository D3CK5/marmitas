
import { Minus, Plus } from "lucide-react";

interface QuantityCounterProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
}

export function QuantityCounter({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
}: QuantityCounterProps) {
  const decrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const increase = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={decrease}
        disabled={quantity <= min}
        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center font-medium text-sm">{quantity}</span>
      <button
        onClick={increase}
        disabled={quantity >= max}
        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}
