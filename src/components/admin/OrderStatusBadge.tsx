import { Badge } from "@/components/ui/badge";

interface OrderStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: {
    label: "Pendente",
    variant: "secondary"
  },
  awaiting_payment: {
    label: "Aguardando Pagamento",
    variant: "outline"
  },
  preparing: {
    label: "Em Preparação",
    variant: "default"
  },
  completed: {
    label: "Concluído",
    variant: "default"
  },
  cancelled: {
    label: "Cancelado",
    variant: "destructive"
  }
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    variant: "secondary"
  };

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
