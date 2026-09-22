"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";

type BillingTabsProps = {
  teamSlug: string;
  isFacturamaEnabled: boolean;
};

export function BillingTabs({
  teamSlug,
  isFacturamaEnabled,
}: BillingTabsProps) {
  const pathname = usePathname();
  const basePath = `/team/${teamSlug}/billing`;

  let value = "resumen";
  if (pathname.startsWith(`${basePath}/listing`)) {
    value = "historial";
  } else if (pathname.startsWith(`${basePath}/datos-fiscales`)) {
    value = "datos-fiscales";
  }

  return (
    <Tabs value={value} className="w-full">
      <TabsList>
        <TabsTrigger value="resumen" asChild>
          <Link href={basePath}>Resumen</Link>
        </TabsTrigger>
        <TabsTrigger value="historial" asChild>
          <Link href={`${basePath}/listing`}>Historial de Pagos</Link>
        </TabsTrigger>
        {isFacturamaEnabled && (
          <TabsTrigger value="datos-fiscales" asChild>
            <Link href={`${basePath}/datos-fiscales`}>Datos Fiscales</Link>
          </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  );
}
