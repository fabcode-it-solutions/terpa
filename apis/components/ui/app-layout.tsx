/* eslint-disable @next/next/no-img-element */
"use client";

import { signOutAction } from "@/app/auth/me/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { APP_TITLE } from "@/lib/constants/app";
import { cn } from "@/lib/utils";
import {
  CheckIcon,
  HelpCircleIcon,
  LogOutIcon,
  Menu,
  MoonIcon,
  MoreHorizontal,
  ShieldIcon,
  SunIcon,
  User2Icon,
  UserCircleIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Navigation = {
  label: string;
  href: string;
};

type AdditionalMenuItem = {
  label: string;
  href: string;
};

export function AppLayout({
  children,
  merchantCode,
  navigation = [],
  teamName = "",
  isAdmin = false,
  additionalMenuItems = [],
}: {
  children: React.ReactNode;
  navigation?: Navigation[];
  teamName?: string;
  isAdmin?: boolean;
  merchantCode?: string | null;
  additionalMenuItems?: AdditionalMenuItem[];
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader
        navigation={navigation}
        teamName={teamName}
        merchantCode={merchantCode}
        isAdmin={isAdmin}
        additionalMenuItems={additionalMenuItems}
      />
      {children}
    </div>
  );
}

function AppHeader({
  navigation,
  teamName,
  merchantCode,
  isAdmin,
  additionalMenuItems = [],
}: {
  navigation: Navigation[];
  teamName: string;
  isAdmin: boolean;
  merchantCode?: string | null;
  additionalMenuItems?: AdditionalMenuItem[];
}) {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="border-b top-0 sticky bg-background z-10">
      <header className="flex h-16 items-center gap-4 px-4 md:px-6 max-w-screen-xl mx-auto">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <div className="flex items-center gap-2 text-lg font-semibold md:text-base">
            <a href="/">
              <span className="sr-only">{APP_TITLE}</span>
              <img
                src="/logo-white.svg"
                className="h-7 hidden dark:block"
                alt="logo"
              />
              <img
                src="/logo-black.svg"
                className="h-7 block dark:hidden"
                alt="logo"
              />
            </a>
          </div>
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-muted-foreground transition-colors hover:text-foreground",
                { "text-foreground": pathname.startsWith(item.href) },
              )}
            >
              {item.label}
            </Link>
          ))}
          {additionalMenuItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground transition-colors hover:text-foreground data-[state=open]:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Más opciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {additionalMenuItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
        <div className="flex items-center justify-between flex-1">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="grid gap-6 text-lg font-medium">
                <a href="/">
                  <span className="sr-only">{APP_TITLE}</span>
                  <img
                    src="/logo-white.svg"
                    className="h-7 hidden dark:block"
                    alt="logo"
                  />
                  <img
                    src="/logo-black.svg"
                    className="h-7 block dark:hidden"
                    alt="logo"
                  />
                </a>
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSheetOpen(false)}
                    className={cn(
                      "text-muted-foreground hover:text-foreground",
                      {
                        "text-foreground": pathname.startsWith(item.href),
                      },
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                {additionalMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSheetOpen(false)}
                    className={cn(
                      "text-muted-foreground hover:text-foreground",
                      {
                        "text-foreground": pathname.startsWith(item.href),
                      },
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className="flex-1"></div>
            <div className="flex flex-col text-sm items-end">
              <p className="font-medium">{teamName}</p>
              {merchantCode && (
                <p className="text-muted-foreground">
                  Comercio: {merchantCode}
                </p>
              )}
            </div>
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <ShieldIcon className="w-4 h-4" />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User2Icon className="w-4 h-4" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="https://wa.me/5628409609">
                      <HelpCircleIcon className="w-4 h-4" />
                      Ayuda
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <SunIcon className="w-4 h-4 block dark:hidden" />
                      <MoonIcon className="w-4 h-4 hidden dark:block" />
                      Apariencia
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        onClick={() => setTheme("system")}
                        className="justify-between"
                      >
                        Sistema
                        {theme === "system" && (
                          <CheckIcon className="w-4 h-4" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setTheme("light")}
                        className="justify-between"
                      >
                        Claro
                        {theme === "light" && <CheckIcon className="w-4 h-4" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setTheme("dark")}
                        className="justify-between"
                      >
                        Oscuro
                        {theme === "dark" && <CheckIcon className="w-4 h-4" />}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => signOutAction()}>
                    <LogOutIcon className="w-4 h-4" />
                    Salir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export function AppContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 bg-neutral-100 dark:bg-neutral-900/60">
      <div className="mx-auto w-full max-w-screen-xl px-2 md:px-4 pt-4">
        <div className="flex flex-col gap-4 pb-[200px]">{children}</div>
      </div>
    </div>
  );
}
