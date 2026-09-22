"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ImageIcon, Lock } from "lucide-react";
import { useState } from "react";

type Sale = {
  id: string;
  machineProductCost: number;
  machineProductId: string | null;
  machineMdbProductId: string | null;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    productImages: Array<{
      fileUrl: string;
    }>;
  } | null;
};

type Props = {
  sales: Sale[];
  showFinancials?: boolean;
};

export default function RecentSalesList({
  sales,
  showFinancials = true,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  // Show lock icon if financial access is denied
  if (!showFinancials) {
    return (
      <div className="flex justify-center items-center py-16">
        <Lock className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }

  const displayedSales = showAll ? sales : sales.slice(0, 10);

  return (
    <>
      {displayedSales.map((sale) => (
        <div key={sale.id} className="p-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Product Image Thumbnail */}
            <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
              {sale.product?.productImages?.[0]?.fileUrl ? (
                <img
                  src={sale.product.productImages[0].fileUrl}
                  alt={sale.product?.name || "Product"}
                  className="object-cover w-full h-full"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex gap-2 items-center text-xs text-muted-foreground">
                <p className="flex gap-2">
                  {sale.machineProductId && (
                    <span>DEX #{sale.machineProductId}</span>
                  )}
                  {sale.machineMdbProductId && (
                    <span>MDB #{sale.machineMdbProductId}</span>
                  )}
                </p>
                <p>&bull;</p>
                <p>{formatCurrency(sale.machineProductCost)}</p>
                <p>&bull;</p>
                <p>
                  {formatDistanceToNow(sale.createdAt, {
                    locale: es,
                    addSuffix: true,
                  })}
                </p>
              </div>
              <p className="text-sm">
                {sale.product?.name || (
                  <span className="italic text-muted-foreground">
                    Sin Nombre
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      ))}
      {sales.length > 10 && (
        <div className="p-3 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="text-sm"
          >
            {showAll
              ? "Ver menos"
              : `Ver ${sales.length - 10} más ${sales.length - 10 === 1 ? "venta" : "ventas"}`}
          </Button>
        </div>
      )}
    </>
  );
}
