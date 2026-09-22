"use client";

import {
  spiralDecrementAction,
  spiralIncrementAction,
} from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { MinusCircleIcon, PlusCircleIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  spiralId: string;
  currentCount: number;
  maxCapacity: number;
};

export default function InventoryControls(props: Props) {
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);

  const handleDecrement = async () => {
    setIsLoading(true);
    const result = await spiralDecrementAction({
      teamSlug: params.slug as string,
      machineId: params.machineId as string,
      spiralId: props.spiralId,
    });

    if (result.success) {
      toast.success("Inventario decrementado correctamente.");
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  };

  const handleIncrement = async () => {
    setIsLoading(true);
    const result = await spiralIncrementAction({
      teamSlug: params.slug as string,
      machineId: params.machineId as string,
      spiralId: props.spiralId,
    });

    if (result.success) {
      toast.success("Inventario incrementado correctamente.");
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  };

  return (
    <fieldset disabled={isLoading}>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDecrement}
          disabled={props.currentCount <= 0}
        >
          <MinusCircleIcon className="w-5 h-5" />
        </Button>
        <p className="w-16 text-center text-muted-foreground">
          {props.currentCount} / {props.maxCapacity}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleIncrement}
          disabled={props.currentCount >= props.maxCapacity}
        >
          <PlusCircleIcon className="w-5 h-5" />
        </Button>
      </div>
    </fieldset>
  );
}
