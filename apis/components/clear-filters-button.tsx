"use client";

import { Button } from "@/components/ui/button";
import { FilterXIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  label?: string;
};

export default function ClearFiltersButton(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Check if there are any active filters
  const hasActiveFilters = searchParams.toString() !== "";

  const onClick = () => {
    router.push(pathname);
    setTimeout(() => router.refresh(), 0);
  };

  return (
    <Button
      variant="outline"
      onClick={onClick}
      size="icon"
      disabled={!hasActiveFilters}
    >
      <FilterXIcon className="size-4 text-muted-foreground" />
    </Button>
  );
}
