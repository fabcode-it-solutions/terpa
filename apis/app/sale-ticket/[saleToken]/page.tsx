import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

type Props = {
  params: { saleToken: string };
};

async function getSaleByToken(token: string) {
  try {
    const sale = await prisma.sale.findFirst({
      where: {
        token: token,
      },
      select: {
        id: true,
        type: true,
        machineProductCost: true,
        description: true,
        productName: true,
        productPriceCents: true,
        paymentMethod: true,
        createdAt: true,
        token: true,
        machineProductId: true,
        machineMdbProductId: true,
        taecelTransactionId: true,
        taecelServiceId: true,
        machine: {
          select: {
            terminalSerialNumber: true,
            team: {
              select: {
                pharosMerchantCode: true,
              },
            },
          },
        },
        product: {
          select: {
            name: true,
            priceCents: true,
          },
        },
        saleItems: {
          select: {
            id: true,
            productName: true,
            productPriceCents: true,
            machineMicromarketCode: true,
          },
        },
      },
    });

    return sale;
  } catch (error) {
    console.error("Error fetching sale:", error);
    return null;
  }
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(cents / 100);
}

function getPaymentMethodLabel(method: string | null) {
  switch (method) {
    case "CASH":
      return "Efectivo";
    case "CARD":
      return "Tarjeta";
    case "FREE":
      return "Gratis";
    case "REMOTE":
      return "Remoto";
    default:
      return "N/A";
  }
}

function getSaleTypeLabel(type: string) {
  switch (type) {
    case "PRODUCT":
      return "Producto";
    case "SERVICE":
      return "Servicio";
    case "PHONE_RECHARGE":
      return "Recarga Telefónica";
    default:
      return "Venta";
  }
}

export default async function SaleTicketPage({ params }: Props) {
  const sale = await getSaleByToken(params.saleToken);

  if (!sale) {
    notFound();
  }

  let itemName = sale.productName || sale.description;

  if (!itemName) {
    const identifiers = [];
    if (sale.machineProductId) {
      identifiers.push(`DEX #${sale.machineProductId}`);
    }
    if (sale.machineMdbProductId) {
      identifiers.push(`MDB #${sale.machineMdbProductId}`);
    }

    itemName =
      identifiers.length > 0
        ? `Artículo (${identifiers.join(" ")})`
        : "Artículo";
  }
  const itemPrice = sale.machineProductCost ?? 0;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">Ticket de Compra</CardTitle>
        <CardDescription>Resumen</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Fecha</span>
            <span className="text-sm">
              {formatInTimeZone(
                sale.createdAt,
                "America/Monterrey",
                "yyyy/MM/dd",
                { locale: es },
              )}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Hora</span>
            <span className="text-sm">
              {formatInTimeZone(
                sale.createdAt,
                "America/Monterrey",
                "HH:mm:ss",
                { locale: es },
              )}
            </span>
          </div>

          {sale.taecelTransactionId && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">ID de transacción:</span>
              <span className="text-sm">{sale.taecelTransactionId}</span>
            </div>
          )}

          {sale.taecelServiceId && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Folio</span>
              <span className="text-sm">{sale.taecelServiceId}</span>
            </div>
          )}

          {sale.machine.terminalSerialNumber && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Num. Serie</span>
              <span className="text-sm">
                {sale.machine.terminalSerialNumber}
              </span>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          {sale.saleItems.length >= 2 ? (
            <>
              <div className="space-y-1">
                <span className="text-sm font-medium">Artículos</span>
                {sale.saleItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center pl-2"
                  >
                    <div className="flex-1">
                      <span className="text-sm">
                        {item.productName || "Sin nombre"}
                      </span>
                      {item.machineMicromarketCode && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({item.machineMicromarketCode})
                        </span>
                      )}
                    </div>
                    <span className="text-sm">
                      {formatCurrency(item.productPriceCents || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Artículo</span>
              <span className="text-sm">{itemName}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Método de Pago</span>
            <span className="text-sm">
              {getPaymentMethodLabel(sale.paymentMethod)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-bold">
              {formatCurrency(itemPrice)}
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Referencia:</span>
            <span className="text-xs font-mono">{sale.token}</span>
          </div>
        </div>

        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">Gracias por su compra</p>
        </div>
      </CardContent>
    </Card>
  );
}
