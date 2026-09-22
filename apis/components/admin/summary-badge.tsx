import { Badge } from "@/components/ui/badge";

type Status =
  | "total"
  | "paid"
  | "pendingPayment"
  | "pendingReview"
  | "rejected"
  | "cancelled"
  | "notInvoiced";

const statusToLabel: Record<Status, string> = {
  total: "Total",
  paid: "Pago Exitoso",
  pendingPayment: "Pendiente de Pago",
  pendingReview: "Revisión Pendiente",
  rejected: "Pago Rechazado",
  cancelled: "Pago Cancelado",
  notInvoiced: "Sin Pago",
};

const statusToClass: Record<Status, string> = {
  total: "bg-gray-100 text-gray-800 dark:bg-gray-800/10 dark:text-gray-400",
  paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  pendingPayment:
    "bg-gray-100 text-gray-800 dark:bg-gray-800/10 dark:text-gray-400",
  pendingReview: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  rejected: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  cancelled:
    "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  notInvoiced: "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

type Props = {
  status: Status;
  count: number;
};

export function SummaryBadge({ status, count }: Props) {
  if (count === 0) {
    return null;
  }

  return (
    <Badge variant="outline" className={`font-normal ${statusToClass[status]}`}>
      <span className="hidden sm:inline">{statusToLabel[status]}: </span>
      <span>{count}</span>
    </Badge>
  );
}
