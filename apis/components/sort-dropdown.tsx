"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowDownIcon, ArrowUpIcon, CheckIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SortOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

type Props = {
  currentSort?: string;
};

export default function SortDropdown({ currentSort }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sortOptions: SortOption[] = [
    {
      value: "name",
      label: "Alfabéticamente",
      icon: <ArrowUpIcon className="h-4 w-4" />,
    },
    {
      value: "machines",
      label: "Cantidad de máquinas",
      icon: <ArrowDownIcon className="h-4 w-4" />,
    },
    {
      value: "createdAt",
      label: "Fecha de creación",
      icon: <ArrowDownIcon className="h-4 w-4" />,
    },
  ];

  const currentSortOption =
    sortOptions.find((option) => option.value === currentSort) ||
    sortOptions[0];

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);

    // Always set the sort parameter, even for the default sort
    params.set("sort", value);

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <span>
            Ordenar{" "}
            <span className="text-muted-foreground font-normal">
              {currentSortOption.label}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSortChange(option.value)}
            className="flex items-center justify-between"
          >
            <span>{option.label}</span>
            {currentSort === option.value && <CheckIcon className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
