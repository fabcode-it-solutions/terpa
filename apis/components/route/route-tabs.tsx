"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

export default function RouteTabs() {
  const params = useParams();
  const path = usePathname();
  const base = `/team/${params.slug}/routes/${params.id}`;
  const last = path.split("/").pop();

  return (
    <Tabs value={last} className="w-full">
      <TabsList>
        <TabsTrigger value={`${params.id}`} asChild>
          <Link href={base}>Máquinas</Link>
        </TabsTrigger>
        <TabsTrigger value="settings" asChild>
          <Link href={`${base}/settings`}>Ajustes</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
