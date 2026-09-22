"use client";

import { generateCfdiAction, sendCfdiEmailAction } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { CfdiStatus } from "@prisma/client";
import { Mail, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  teamSlug: string;
  hasFacturamaId: boolean;
  currentPath: string;
  invoiceId: string;
  cfdi?: {
    id: string;
    status: CfdiStatus;
    facturamaId?: string | null;
    uuid?: string | null;
    errorMessage?: string | null;
  } | null;
};

export function GenerateInvoiceButton({
  teamSlug,
  hasFacturamaId,
  currentPath,
  invoiceId,
  cfdi,
}: Props) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleClick = async () => {
    if (!hasFacturamaId) {
      // Redirect to datos-fiscales with callback URL
      const callbackUrl = encodeURIComponent(currentPath);
      router.push(
        `/team/${teamSlug}/billing/datos-fiscales?callbackUrl=${callbackUrl}`,
      );
      return;
    }

    // Handle CFDI email sending for completed CFDIs
    if (cfdi?.status === CfdiStatus.COMPLETED) {
      setIsSendingEmail(true);
      try {
        const result = await sendCfdiEmailAction(invoiceId);
        if (result.success) {
          toast.success("Factura enviada", {
            description:
              "La factura ha sido enviada al correo que diste de alta en tus datos fiscales",
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error al enviar factura";
        toast.error(errorMessage);
      } finally {
        setIsSendingEmail(false);
      }
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateCfdiAction(invoiceId);
      if (result.success) {
        toast.success("CFDI generado exitosamente", {
          description:
            "La factura ha sido enviada al correo que diste de alta en tus datos fiscales",
        });
        router.refresh(); // Refresh to show updated state
      } else {
        // Show the specific error from Facturama
        toast.error(result.error || "Error al generar CFDI");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al generar CFDI";
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Determine button text and state
  const getButtonText = () => {
    if (!hasFacturamaId) return "Generar Factura";
    if (isGenerating || cfdi?.status === CfdiStatus.PROCESSING)
      return "Generando...";
    if (cfdi?.status === CfdiStatus.COMPLETED) {
      return isSendingEmail ? "Enviando..." : "Enviar a mi correo";
    }
    if (cfdi?.status === CfdiStatus.FAILED) return "Reintentar Factura";
    return "Generar Factura";
  };

  const isDisabled =
    isGenerating || isSendingEmail || cfdi?.status === CfdiStatus.PROCESSING;

  const getIcon = () => {
    if (cfdi?.status === CfdiStatus.COMPLETED) {
      return <Mail className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Button
      variant="outline"
      className="gap-2 border-blue-200 text-blue-800 hover:bg-blue-100 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-800/20"
      onClick={handleClick}
      disabled={isDisabled}
    >
      {getIcon()}
      {getButtonText()}
    </Button>
  );
}
