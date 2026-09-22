"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { formatNumber, pluralize } from "@/lib/utils";
import { ChevronRightIcon, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Product = {
  id: string;
  name: string;
  team_name: string;
  team_slug: string;
  total_sales_value: number;
  sales_count: number;
  image_url: string | null;
};

type Props = {
  products: Product[];
};

export default function AdminTopProductsList({ products }: Props) {
  const [showAll, setShowAll] = useState(false);

  const displayedProducts = showAll ? products : products.slice(0, 10);

  return (
    <>
      {displayedProducts.map((product) => (
        <div key={product.id} className="p-3 flex justify-between items-center">
          <div className="flex items-center gap-4 pl-2">
            {/* Product Image Thumbnail */}
            <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm">{product.name}</p>
              <p className="text-xs text-muted-foreground mb-1">
                Equipo: {product.team_name}
              </p>
              <div className="flex text-sm gap-2 text-muted-foreground">
                <p>
                  {formatNumber(product.sales_count)}{" "}
                  {pluralize(product.sales_count, "venta", "ventas")}
                </p>
                <p>&bull;</p>
                <p>{formatCurrency(product.total_sales_value)}</p>
              </div>
            </div>
          </div>
          <Button size="icon" variant="outline" asChild>
            <Link href={`/team/${product.team_slug}/products/${product.id}`}>
              <ChevronRightIcon className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      ))}
      {products.length > 10 && (
        <div className="p-3 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="text-sm"
          >
            {showAll
              ? "Ver menos"
              : `Ver ${products.length - 10} más ${products.length - 10 === 1 ? "producto" : "productos"}`}
          </Button>
        </div>
      )}
    </>
  );
}
