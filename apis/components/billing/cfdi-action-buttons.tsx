"use client";

import {
  downloadCfdiPdfAction,
  downloadCfdiXmlAction,
  sendCfdiEmailAction,
} from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { Mail, FileText, Code } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  invoiceId: string;
};

export function CfdiActionButtons({ invoiceId }: Props) {
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [isXmlDownloading, setIsXmlDownloading] = useState(false);

  const handleEmailSend = async () => {
    setIsEmailSending(true);
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
      setIsEmailSending(false);
    }
  };

  const handlePdfDownload = async () => {
    setIsPdfDownloading(true);
    try {
      const result = await downloadCfdiPdfAction(invoiceId);
      if (result.success) {
        // Convert base64 to blob and trigger download
        const byteCharacters = atob(result.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: result.contentType });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al descargar PDF";
      toast.error(errorMessage);
    } finally {
      setIsPdfDownloading(false);
    }
  };

  const handleXmlDownload = async () => {
    setIsXmlDownloading(true);
    try {
      const result = await downloadCfdiXmlAction(invoiceId);
      if (result.success) {
        // Convert base64 to blob and trigger download
        const byteCharacters = atob(result.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: result.contentType });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al descargar XML";
      toast.error(errorMessage);
    } finally {
      setIsXmlDownloading(false);
    }
  };

  const isAnyLoading = isEmailSending || isPdfDownloading || isXmlDownloading;

  return (
    <div className="flex gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={handleEmailSend}
        disabled={isAnyLoading}
        className="border-blue-200 text-blue-800 hover:bg-blue-100 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-800/20"
        title="Enviar por correo"
      >
        <Mail className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={handlePdfDownload}
        disabled={isAnyLoading}
        className="border-blue-200 text-blue-800 hover:bg-blue-100 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-800/20"
        title="Descargar PDF"
      >
        <FileText className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={handleXmlDownload}
        disabled={isAnyLoading}
        className="border-blue-200 text-blue-800 hover:bg-blue-100 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-800/20"
        title="Descargar XML"
      >
        <Code className="h-4 w-4" />
      </Button>
    </div>
  );
}
