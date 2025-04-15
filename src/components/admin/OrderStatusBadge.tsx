
import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "awaiting_payment" | "preparing" | "completed" | "cancelled";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusConfig = {
  pending: {
    label: "Pendente",
    classes: "bg-yellow-50 text-yellow-700",
  },
  awaiting_payment: {
    label: "Aguardando Pagamento",
    classes: "bg-blue-50 text-blue-700",
  },
  preparing: {
    label: "Em Preparação",
    classes: "bg-purple-50 text-purple-700",
  },
  completed: {
    label: "Concluído",
    classes: "bg-green-50 text-green-700",
  },
  cancelled: {
    label: "Cancelado",
    classes: "bg-red-50 text-red-700",
  },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        config.classes
      )}
    >
      {config.label}
    </span>
  );
}
