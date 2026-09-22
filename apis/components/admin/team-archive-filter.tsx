"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { FilterIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Props = {
  defaultShowArchived?: boolean;
};

export default function TeamArchiveFilter({
  defaultShowArchived = false,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const showArchivedParam = searchParams.get("showArchived");
  const showArchived =
    showArchivedParam !== null
      ? showArchivedParam === "true"
      : defaultShowArchived;

  const handleToggleArchived = (checked: boolean) => {
    const newSearchParams = new URLSearchParams(searchParams);

    if (checked === defaultShowArchived) {
      // If setting to default value, remove the parameter
      newSearchParams.delete("showArchived");
    } else {
      // If different from default, explicitly set the value
      newSearchParams.set("showArchived", checked.toString());
    }

    const queryString = newSearchParams.toString();
    const url = queryString ? `?${queryString}` : "";

    router.push(`${window.location.pathname}${url}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`justify-start md:justify-center w-full sm:w-auto ${showArchived ? "bg-primary/10 border-primary/50" : ""}`}
        >
          <FilterIcon className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="show-archived" className="text-sm font-medium">
                Mostrar Archivados
              </Label>
              <p className="text-xs text-muted-foreground">
                Incluir equipos archivados en la lista
              </p>
            </div>
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={handleToggleArchived}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
