"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function InvoicesTabs() {
  const pathname = usePathname();
  const value = pathname.startsWith("/admin/invoices/listado")
    ? "listado"
    : "desglose";

  return (
    <Tabs value={value} className="w-full">
      <TabsList>
        <TabsTrigger value="desglose" asChild>
          <Link href="/admin/invoices">Desglose</Link>
        </TabsTrigger>
        <TabsTrigger value="listado" asChild>
          <Link href="/admin/invoices/listado">Listado</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
