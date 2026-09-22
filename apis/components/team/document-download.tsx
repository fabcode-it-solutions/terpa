"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";

type Props = {
  teamSlug: string;
  documentId: string;
  fileName: string;
  variant?: "default" | "secondary" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
};

export function DocumentDownload({
  teamSlug,
  documentId,
  fileName,
  variant = "secondary",
  size = "sm",
}: Props) {
  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/team/${teamSlug}/document/${documentId}/download`,
      );

      if (!response.ok) {
        throw new Error("Failed to get download URL");
      }

      const { url, fileName: downloadFileName } = await response.json();

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.download = downloadFileName || fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Error al descargar el documento");
    }
  }, [teamSlug, documentId, fileName]);

  return (
    <Button variant={variant} size={size} onClick={handleDownload}>
      <Download className="h-4 w-4 mr-2" />
      Descargar
    </Button>
  );
}
