"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-3">
          <SunIcon className="w-4 h-4 block dark:hidden" />
          <MoonIcon className="w-4 h-4 hidden dark:block" />
          Apariencia
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem className="gap-2" onClick={() => setTheme("system")}>
          Sistema
          {theme === "system" && <CheckIcon className="w-4 h-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => setTheme("light")}>
          Claro
          {theme === "light" && <CheckIcon className="w-4 h-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={() => setTheme("dark")}>
          Oscuro
          {theme === "dark" && <CheckIcon className="w-4 h-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
