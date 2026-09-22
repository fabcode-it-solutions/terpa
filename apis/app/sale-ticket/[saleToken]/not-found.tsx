import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">Ticket no encontrado</CardTitle>
        <CardDescription>
          El ticket solicitado no existe o no es válido
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Verifica que el enlace del ticket sea correcto.
        </p>
        <Button variant="outline" asChild>
          <Link href="/">Volver al inicio</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
