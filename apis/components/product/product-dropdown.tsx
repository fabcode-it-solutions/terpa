"use client";

import ProductDeleteDialog from "@/components/product/product-delete-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon, PencilIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

type Props = {
  productId: string;
};

export default function ProductDropdown(props: Props) {
  const params = useParams();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <ProductDeleteDialog
        productId={props.productId}
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
            <Link href={`/team/${params.slug}/products/${props.productId}`}>
              <PencilIcon className="w-4 h-4" />
              Editar
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
