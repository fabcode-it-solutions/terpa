"use client";

import { downloadCfdiXmlAction } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  invoiceId: string;
};

export function DownloadCfdiXmlButton({ invoiceId }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
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

        toast.success("XML descargado exitosamente");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al descargar XML";
      toast.error(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={isDownloading}
      className="gap-2 border-blue-200 text-blue-800 hover:bg-blue-100 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-800/20"
    >
      <Download className="h-4 w-4" />
      {isDownloading ? "Descargando..." : "Descargar XML"}
    </Button>
  );
}
