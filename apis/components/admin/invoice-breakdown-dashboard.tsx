import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  summary: {
    totalMachines: number;
    paid: number;
    pendingPayment: number;
    pendingReview: number;
    rejected: number;
    cancelled: number;
    notInvoiced: number;
  };
};

export function InvoiceBreakdownDashboard({ summary }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total de Máquinas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{summary.totalMachines}</p>
          </CardContent>
        </Card>
        {summary.paid > 0 && (
          <Card className="border-l-4 border-emerald-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                Pago Exitoso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-emerald-600">
                {summary.paid}
              </p>
            </CardContent>
          </Card>
        )}
        {summary.pendingReview > 0 && (
          <Card className="border-l-4 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                Revisión Pendiente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">
                {summary.pendingReview}
              </p>
            </CardContent>
          </Card>
        )}
        {summary.rejected > 0 && (
          <Card className="border-l-4 border-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                Pago Rechazado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-red-600">
                {summary.rejected}
              </p>
            </CardContent>
          </Card>
        )}
        {summary.cancelled > 0 && (
          <Card className="border-l-4 border-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                Pago Cancelado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-orange-600">
                {summary.cancelled}
              </p>
            </CardContent>
          </Card>
        )}
        {summary.notInvoiced > 0 && (
          <Card className="border-l-4 border-gray-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-500" />
                Sin Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-gray-600">
                {summary.notInvoiced}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
