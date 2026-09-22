/* eslint-disable @next/next/no-img-element */
"use client";

import ThemeToggle from "@/components/ui/theme-toggle";
import { APP_TITLE } from "@/lib/constants/app";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4 bg-neutral-100 dark:bg-neutral-900/60">
      <Link href="/">
        <img
          src="/logo-white.svg"
          className="h-14 hidden dark:block"
          alt="logo"
        />
        <img
          src="/logo-black.svg"
          className="h-14 block dark:hidden"
          alt="logo"
        />
        <h1 className="sr-only">{APP_TITLE}</h1>
      </Link>
      {children}
      <ThemeToggle />
    </div>
  );
}
