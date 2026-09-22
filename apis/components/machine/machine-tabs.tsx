"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CoinsIcon,
  MoreHorizontalIcon,
  RouterIcon,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";
import { useExperimentStatus } from "@/hooks/use-experiment-status";

export default function MachineTabs() {
  const params = useParams();
  const path = usePathname();
  const [showRemoteSaleDialog, setShowRemoteSaleDialog] = useState(false);
  const base = `/team/${params.slug}/machines/${params.machineId}`;
  const last = path.split("/")[5] || path.split("/")[4];

  // Check if CORTES_CAJA experiment is active for this team
  const { data: showCortesCaja = false, isLoading: isExperimentLoading } =
    useExperimentStatus("CORTES_CAJA", params.slug as string);

  return (
    <Tabs value={last} className="overflow-x-auto">
      <TabsList>
        <TabsTrigger value={`${params.machineId}`} asChild>
          <Link href={base}>General</Link>
        </TabsTrigger>
        <TabsTrigger value="sales" asChild>
          <Link href={`${base}/sales`}>Ventas</Link>
        </TabsTrigger>
        <TabsTrigger value="terminal" asChild>
          <Link href={`${base}/terminal`}>Terminal</Link>
        </TabsTrigger>
        <TabsTrigger value="inventory" asChild>
          <Link href={`${base}/inventory`}>Inventario</Link>
        </TabsTrigger>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hover:bg-transparent">
                <MoreHorizontalIcon className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {showCortesCaja && (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/team/${params.slug}/machines/${params.machineId}/reconciliation`}
                    >
                      <CoinsIcon className="w-4 h-4" />
                      <span>Cortes de Caja</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link
                    href={`/team/${params.slug}/machines/${params.machineId}/dex`}
                  >
                    <RouterIcon className="w-4 h-4" />
                    <span>DEX</span>
                  </Link>
                </DropdownMenuItem>
                {/* <DropdownMenuItem asChild>
                  <Link
                    href={`/team/${params.slug}/machines/${params.machineId}/billing`}
                  >
                    <ReceiptIcon className="w-4 h-4" />
                    <span>Facturación</span>
                  </Link>
                </DropdownMenuItem> */}
                <DropdownMenuItem asChild>
                  <Link
                    href={`/team/${params.slug}/machines/${params.machineId}/settings`}
                  >
                    <SettingsIcon className="w-4 h-4" />
                    <span>Ajustes</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TabsList>
    </Tabs>
  );
}
