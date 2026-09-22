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

export default function MachineSortDropdown({ currentSort }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sortOptions: SortOption[] = [
    {
      value: "team-asc",
      label: "Nombre de equipo",
      icon: <ArrowUpIcon className="h-4 w-4" />,
    },
    {
      value: "team-desc",
      label: "Nombre de equipo",
      icon: <ArrowDownIcon className="h-4 w-4" />,
    },
    {
      value: "name-asc",
      label: "Nombre de máquina",
      icon: <ArrowUpIcon className="h-4 w-4" />,
    },
    {
      value: "name-desc",
      label: "Nombre de máquina",
      icon: <ArrowDownIcon className="h-4 w-4" />,
    },
    {
      value: "lastPing-asc",
      label: "Última conexión",
      icon: <ArrowUpIcon className="h-4 w-4" />,
    },
    {
      value: "lastPing-desc",
      label: "Última conexión",
      icon: <ArrowDownIcon className="h-4 w-4" />,
    },
    {
      value: "expiration-asc",
      label: "Fecha de vencimiento",
      icon: <ArrowUpIcon className="h-4 w-4" />,
    },
    {
      value: "expiration-desc",
      label: "Fecha de vencimiento",
      icon: <ArrowDownIcon className="h-4 w-4" />,
    },
  ];

  const currentSortOption =
    sortOptions.find((option) => option.value === currentSort) ||
    // Handle backward compatibility for legacy sort values
    sortOptions.find((option) => option.value === `${currentSort}-asc`) ||
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
          className="w-full sm:w-auto flex items-center gap-2 justify-start md:justify-center"
        >
          {currentSortOption.icon}
          <span>{currentSortOption.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sortOptions.map((option, index) => (
          <div key={option.value}>
            <DropdownMenuItem
              onClick={() => handleSortChange(option.value)}
              className="flex items-center gap-2"
            >
              {option.icon}
              <span className="flex-1">{option.label}</span>
              {(currentSort === option.value ||
                (!currentSort && option.value === "team-asc") ||
                (currentSort && option.value === `${currentSort}-asc`)) && (
                <CheckIcon className="h-4 w-4" />
              )}
            </DropdownMenuItem>
            {index % 2 === 1 && index < sortOptions.length - 1 && (
              <DropdownMenuSeparator />
            )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
