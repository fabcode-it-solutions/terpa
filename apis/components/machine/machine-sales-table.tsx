import MachineSaleCostIndicator from "@/components/machine/machine-sale-cost-indicator";
import Timestamp from "@/components/timestamp";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { prisma } from "@/lib/prisma";
import { getCdnUrl } from "@/lib/s3";
import { formatNumber, pluralize } from "@/lib/utils";
import { endOfDay, format, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { ImageIcon, Receipt } from "lucide-react";

type Props = {
  machineId: string;
  date: Date;
  isAdmin?: boolean;
};

export default async function MachineSalesTable(props: Props) {
  const start = startOfDay(toZonedTime(props.date, "America/Monterrey"));
  const end = endOfDay(toZonedTime(props.date, "America/Monterrey"));

  const sales = await prisma.sale.findMany({
    select: {
      id: true,
      machineProductId: true,
      machineMdbProductId: true,
      productName: true,
      machineProductCost: true,
      productPriceCents: true,
      productSku: true,
      paymentMethod: true,
      createdAt: true,
      type: true,
      taecelTransactionId: true,
      token: true,
      product: {
        select: {
          productImages: {
            where: { deletedAt: null },
            select: { fileUrl: true },
            orderBy: { position: "asc" },
            take: 1,
          },
        },
      },
      _count: {
        select: {
          saleItems: true,
        },
      },
    },
    where: {
      machineId: props.machineId,
      createdAt: {
        gte: fromZonedTime(start, "America/Monterrey"),
        lte: fromZonedTime(end, "America/Monterrey"),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Transform the sales data to include full CDN URLs for product images
  const salesWithCdnUrls = sales.map((sale) => ({
    ...sale,
    product: sale.product
      ? {
          ...sale.product,
          productImages: sale.product.productImages.map((image) => ({
            ...image,
            fileUrl: getCdnUrl(image.fileUrl),
          })),
        }
      : null,
  }));

  const totalSales = salesWithCdnUrls.reduce((acc, sale) => {
    return acc + sale.machineProductCost;
  }, 0);

  const showPaymentMethod = salesWithCdnUrls.some(
    (sale) => sale.paymentMethod !== null,
  );

  const cardSales = salesWithCdnUrls.filter(
    (sale) => sale.paymentMethod === "CARD",
  );
  const cashSales = salesWithCdnUrls.filter(
    (sale) => sale.paymentMethod === "CASH",
  );
  const remoteSales = salesWithCdnUrls.filter(
    (sale) => sale.paymentMethod === "REMOTE",
  );
  const cardSalesTotal = cardSales.reduce((acc, sale) => {
    return acc + sale.machineProductCost;
  }, 0);
  const cashSalesTotal = cashSales.reduce((acc, sale) => {
    return acc + sale.machineProductCost;
  }, 0);
  const remoteSalesTotal = remoteSales.reduce((acc, sale) => {
    return acc + sale.machineProductCost;
  }, 0);

  const cardProductSales = cardSales.filter((sale) => sale.type === "PRODUCT");
  const cardServiceSales = cardSales.filter((sale) => sale.type === "SERVICE");
  const cardRechargeSales = cardSales.filter(
    (sale) => sale.type === "PHONE_RECHARGE",
  );

  const cardProductSalesTotal = cardProductSales.reduce((acc, sale) => {
    return acc + sale.machineProductCost;
  }, 0);
  const cardServiceSalesTotal = cardServiceSales.reduce((acc, sale) => {
    return acc + sale.machineProductCost;
  }, 0);
  const cardRechargeSalesTotal = cardRechargeSales.reduce((acc, sale) => {
    return acc + sale.machineProductCost;
  }, 0);

  return (
    <div className="flex flex-col">
      <Card className="bg-background rounded-b-none border-b-0">
        <CardHeader>
          <h3 className="text-md font-semibold capitalize">
            {format(start, "PPPP", { locale: es })}
          </h3>
        </CardHeader>
        {salesWithCdnUrls.length > 0 && showPaymentMethod && (
          <div>
            <Separator />
            <div className="px-4 py-8">
              <div className="flex md:flex-row flex-col justify-around md:gap-2 gap-8">
                <div className="flex flex-col gap-1 flex-1 text-center">
                  <p className="text-muted-foreground text-sm">
                    {formatNumber(salesWithCdnUrls.length)}{" "}
                    {pluralize(salesWithCdnUrls.length, "venta", "ventas")}{" "}
                    totales
                  </p>
                  <p className="text-xl font-medium">
                    {formatCurrency(totalSales)}
                  </p>
                </div>
                <div className="flex flex-col gap-1 flex-1 text-center">
                  <p className="text-muted-foreground text-sm">
                    {formatNumber(cardSales.length)}{" "}
                    {pluralize(cardSales.length, "venta", "ventas")} en tarjeta
                  </p>
                  <p className="space-x-2">
                    <span className="text-xl font-medium">
                      {formatCurrency(cardSalesTotal)}{" "}
                    </span>
                  </p>
                  {cardSales.length > 0 && (
                    <div className="flex justify-around gap-4 pt-2 text-center">
                      {cardProductSalesTotal > 0 && (
                        <div className="flex flex-col">
                          <p className="text-muted-foreground text-sm">
                            Productos
                          </p>
                          <p className="text-foreground">
                            {formatCurrency(cardProductSalesTotal)}
                          </p>
                        </div>
                      )}
                      {cardServiceSalesTotal > 0 && (
                        <div className="flex flex-col">
                          <p className="text-muted-foreground text-sm">
                            Servicios
                          </p>
                          <p className="text-foreground">
                            {formatCurrency(cardServiceSalesTotal)}
                          </p>
                        </div>
                      )}
                      {cardRechargeSalesTotal > 0 && (
                        <div className="flex flex-col">
                          <p className="text-muted-foreground text-sm">
                            Recargas
                          </p>
                          <p className="text-foreground">
                            {formatCurrency(cardRechargeSalesTotal)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-1 text-center">
                  <p className="text-muted-foreground text-sm">
                    {formatNumber(cashSales.length)}{" "}
                    {pluralize(cashSales.length, "venta", "ventas")} en efectivo
                  </p>
                  <p className="space-x-2">
                    <span className="text-xl font-medium">
                      {formatCurrency(cashSalesTotal)}
                    </span>
                  </p>
                </div>
                {remoteSalesTotal > 0 && (
                  <div className="flex flex-col gap-1 flex-1 text-center">
                    <p className="text-muted-foreground text-sm">
                      {formatNumber(remoteSales.length)}{" "}
                      {pluralize(
                        remoteSales.length,
                        "venta remota",
                        "ventas remotas",
                      )}
                    </p>
                    <p className="space-x-2">
                      <span className="text-xl font-medium">
                        {formatCurrency(remoteSalesTotal)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
      {salesWithCdnUrls.length === 0 && (
        <EmptyState
          title="No hay ventas"
          description="No hay ventas en la fecha seleccionada."
          className="rounded-t-none"
        />
      )}
      {salesWithCdnUrls.length > 0 && (
        <Table className="rounded-none" wrapperClassName="rounded-t-none">
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Precio de Venta</TableHead>
              {showPaymentMethod && <TableHead>Método de Pago</TableHead>}
              <TableHead>Fecha</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesWithCdnUrls.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {/* Product Image Thumbnail */}
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                      {sale.product?.productImages?.[0]?.fileUrl ? (
                        <img
                          src={sale.product.productImages[0].fileUrl}
                          alt={sale.productName || "Product"}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-muted-foreground text-xs flex gap-2">
                        {sale.machineProductId && (
                          <span>DEX #{sale.machineProductId}</span>
                        )}
                        {sale.machineMdbProductId && (
                          <span>MDB #{sale.machineMdbProductId}</span>
                        )}
                      </p>
                      {sale.type === "SERVICE" ? (
                        <p>Servicio</p>
                      ) : sale.type === "PHONE_RECHARGE" ? (
                        <p>Recarga Telefónica</p>
                      ) : sale._count.saleItems >= 2 ? (
                        <p>Múltiples productos</p>
                      ) : sale.productName ? (
                        <p>{sale.productName}</p>
                      ) : (
                        <p className="italic text-muted-foreground">
                          Sin Nombre
                        </p>
                      )}
                      {sale.type !== "PRODUCT" && sale.taecelTransactionId && (
                        <p className="text-xs text-muted-foreground">
                          No. De Transaccion Taecel: {sale.taecelTransactionId}
                        </p>
                      )}
                      {sale.type === "PRODUCT" &&
                        sale.productSku &&
                        sale._count.saleItems < 2 && (
                          <p className="text-xs text-muted-foreground font-mono">
                            SKU {sale.productSku}
                          </p>
                        )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <p>{formatCurrency(sale.machineProductCost)}</p>
                    {sale._count.saleItems < 2 && (
                      <MachineSaleCostIndicator
                        machineCost={sale.machineProductCost}
                        productCost={sale.productPriceCents}
                      />
                    )}
                  </div>
                </TableCell>
                {showPaymentMethod && (
                  <TableCell>
                    {sale.paymentMethod
                      ? paymentMethodToLabel[sale.paymentMethod]
                      : null}
                  </TableCell>
                )}
                <TableCell>
                  <p className="text-muted-foreground">
                    <Timestamp date={sale.createdAt} />
                  </p>
                </TableCell>
                <TableCell className="flex justify-end">
                  {props.isAdmin && (
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href={`/sale-ticket/${sale.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Receipt className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

const paymentMethodToLabel = {
  CARD: "Tarjeta",
  CASH: "Efectivo",
  FREE: "Venta Gratuita",
  REMOTE: "Venta Remota",
};
