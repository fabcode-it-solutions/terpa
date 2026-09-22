"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { FilterIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function TeamArchiveFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const showArchived = searchParams.get("showArchived") === "true";

  const handleToggleArchived = (checked: boolean) => {
    const newSearchParams = new URLSearchParams(searchParams);

    if (checked) {
      newSearchParams.set("showArchived", "true");
    } else {
      newSearchParams.delete("showArchived");
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
          className={cn(
            "flex-1 w-full justify-start md:justify-center",
            showArchived ? "bg-primary/10 border-primary/50" : "",
          )}
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
