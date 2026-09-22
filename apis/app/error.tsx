"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-xl">Algo salió mal</CardTitle>
          <CardDescription>
            Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado
            automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Puedes intentar recargar la página o volver al inicio.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="outline" onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Intentar de nuevo
            </Button>
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Ir al inicio
              </Link>
            </Button>
          </div>
          {process.env.NODE_ENV === "development" && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Detalles del error (desarrollo)
              </summary>
              <pre className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded overflow-auto">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
