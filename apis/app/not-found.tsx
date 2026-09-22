/* eslint-disable @next/next/no-img-element */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ui/theme-toggle";
import { APP_TITLE } from "@/lib/constants/app";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
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

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-6xl font-bold text-muted-foreground">
            404
          </div>
          <CardTitle className="text-xl">Página no encontrada</CardTitle>
          <CardDescription>
            La página que estás buscando no existe o ha sido movida.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Verifica que la URL sea correcta o navega de vuelta al inicio.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="outline" asChild>
              <Link href="javascript:history.back()">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver atrás
              </Link>
            </Button>
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Ir al inicio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <ThemeToggle />
    </div>
  );
}
