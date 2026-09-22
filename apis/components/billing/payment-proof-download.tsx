"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  teamSlug: string;
  invoiceId: string;
};

export function PaymentProofDownload({ teamSlug, invoiceId }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isLoading) {
      e.preventDefault();
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <Button variant="secondary" size="sm" asChild disabled={isLoading}>
      <a
        href={`/team/${teamSlug}/billing/listing/${invoiceId}/download`}
        onClick={handleClick}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        {isLoading ? "Descargando..." : "Descargar Comprobante"}
      </a>
    </Button>
  );
}
