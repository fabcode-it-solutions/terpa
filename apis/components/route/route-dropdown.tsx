"use client";

import RouteDeleteDialog from "@/components/route/route-delete-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontalIcon,
  PcCaseIcon,
  SettingsIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

type Props = {
  routeId: string;
};

export default function RouteDropdown(props: Props) {
  const params = useParams();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <RouteDeleteDialog
        routeId={props.routeId}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="outline">
            <MoreHorizontalIcon className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/team/${params.slug}/routes/${props.routeId}`}>
              <PcCaseIcon className="w-4 h-4" />
              Máquinas
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/team/${params.slug}/routes/${props.routeId}/settings`}
            >
              <SettingsIcon className="w-4 h-4" />
              Ajustes
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-500 focus:text-red-500"
            onClick={() => setShowDeleteDialog(true)}
          >
            <TrashIcon className="w-4 h-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
