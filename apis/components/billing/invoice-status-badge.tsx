import { InvoiceStatus } from "@prisma/client";

const invoiceStatusToLabel: Partial<Record<InvoiceStatus, string>> &
  Record<"NOT_INVOICED", string> = {
  PAYMENT_VERIFICATION_PENDING: "Revisión Pendiente",
  PAYMENT_VERIFICATION_REJECTED: "Pago Rechazado",
  PAYMENT_SUCCESS: "Pago Exitoso",
  CANCELLED: "Pago Cancelado",
  NOT_INVOICED: "Sin Pago",
};

const invoiceStatusToClass: Partial<Record<InvoiceStatus, string>> &
  Record<"NOT_INVOICED", string> = {
  PAYMENT_VERIFICATION_PENDING:
    "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  PAYMENT_VERIFICATION_REJECTED:
    "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  PAYMENT_SUCCESS:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  CANCELLED:
    "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  NOT_INVOICED: "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

type Props = {
  status: InvoiceStatus | "NOT_INVOICED";
};

export function InvoiceStatusBadge({ status }: Props) {
  // If status is not in our mapping (like PAYMENT_PENDING), don't render anything
  if (
    !invoiceStatusToLabel[status as keyof typeof invoiceStatusToLabel] ||
    !invoiceStatusToClass[status as keyof typeof invoiceStatusToClass]
  ) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-sm font-medium ${invoiceStatusToClass[status as keyof typeof invoiceStatusToClass]}`}
    >
      {invoiceStatusToLabel[status as keyof typeof invoiceStatusToLabel]}
    </span>
  );
}
