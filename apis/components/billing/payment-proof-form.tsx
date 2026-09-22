"use client";

import { uploadPaymentProofAction } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/pdf": [".pdf"],
};

const formSchema = z.object({
  file: z
    .custom<File>()
    .refine((file) => file instanceof File, "Por favor selecciona un archivo")
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      "El archivo no puede ser mayor a 10MB",
    )
    .refine(
      (file) => Object.keys(ACCEPTED_FILE_TYPES).includes(file.type),
      "Solo se aceptan archivos JPG, PNG o PDF",
    ),
});

type FormValues = z.infer<typeof formSchema>;

export function PaymentProofForm() {
  const params = useParams();
  const invoiceId = params.invoiceId as string;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        form.setValue("file", acceptedFiles[0], { shouldValidate: true });
      }
    },
    [form],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("invoiceId", invoiceId);

      await uploadPaymentProofAction(formData);

      toast.success("Comprobante de pago enviado correctamente");
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error("Error al enviar el comprobante de pago");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Cuentas Bancarias</CardTitle>
          <CardDescription>
            Tenemos dos cuentas bancarias para que puedas realizar el pago.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-bold">Terpa Solutions SA de CV</h3>
            <p className="text-muted-foreground">RFC: TSO240306URA</p>
          </div>
          <div className="border rounded-lg divide-y">
            {[
              {
                bank: "BBVA — PESOS MEXICANOS (MXN)",
                accountNumber: "0123140385",
                clabe: "012580001231403857",
              },
              {
                bank: "BBVA — DOLARES ESTADOUNIDENSES (USD)",
                accountNumber: "0123574148",
                clabe: "012580001235741489",
              },
            ].map((bank) => (
              <div key={bank.bank} className="p-4">
                <h3 className="font-bold">{bank.bank}</h3>
                <p className="text-muted-foreground">
                  Cuenta: {bank.accountNumber}
                </p>
                <p className="text-muted-foreground">CLABE: {bank.clabe}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Comprobante de Pago</CardTitle>
          <CardDescription>
            Adjunta un comprobante de pago para poder validar tu pago.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormControl>
                      <div
                        {...getRootProps()}
                        className={cn(
                          "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
                          isDragActive
                            ? "border-primary bg-primary/5"
                            : "border-border",
                          "hover:border-primary hover:bg-primary/5",
                        )}
                      >
                        <input {...getInputProps({ onChange })} />
                        <div className="text-center space-y-2">
                          {value ? (
                            <p className="text-sm text-muted-foreground">
                              Archivo seleccionado: {(value as File).name}
                            </p>
                          ) : (
                            <>
                              <p className="text-sm font-medium">
                                Arrastra y suelta tu archivo aquí, o haz click
                                para seleccionarlo
                              </p>
                              <p className="text-xs text-muted-foreground">
                                JPG, PNG o PDF (máx. 10MB)
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={!form.watch("file")}
              >
                Enviar Comprobante
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
