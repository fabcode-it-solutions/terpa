"use client";

import { picklistEditAction, picklistExportAction } from "@/actions/inventory";
import Timestamp from "@/components/timestamp";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency";
import { picklistEditSchema } from "@/validation/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MachinePicklist,
  MachineSpiral,
  PicklistItem,
  Product,
} from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { format } from "date-fns-tz";
import { es } from "date-fns/locale";
import { ArrowLeftIcon, DownloadIcon, MinusIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import slug from "slug";
import { toast } from "sonner";

type Props = {
  machineName: string;
  picklist: MachinePicklist & {
    items: Array<
      PicklistItem & {
        machineSpiral: MachineSpiral & {
          product: Product | null;
        };
      }
    >;
  };
  defaultValues: { items: Record<string, { id: string; quantity: string }> };
};

export default function PicklistForm(props: Props) {
  const params = useParams();

  const form = useForm({
    resolver: zodResolver(picklistEditSchema),
    defaultValues: {
      teamSlug: params.slug,
      machineId: params.machineId,
      picklistId: props.picklist.id,
      ...props.defaultValues,
    },
    mode: "onChange",
  });

  const onSubmit = form.handleSubmit((values) => {
    return picklistEditAction(values)
      .then((result) => {
        if (result?.error) {
          return toast.error(result.error);
        }
        toast.success("Picklist actualizada correctamente.");
      })
      .catch((error) => {
        console.error(error);
        toast.error(
          "Ocurrió un error al actualizar la picklist. Intenta de nuevo más tarde.",
        );
      });
  });

  const onExport = () => {
    picklistExportAction({
      teamSlug: params.slug,
      machineId: params.machineId,
    }).then((result) => {
      if (result?.error) {
        return toast.error(result.error);
      }
      const url = URL.createObjectURL(
        new Blob([result.data || ""], { type: "text/csv" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `picklist-${slug(props.machineName)}-${format(
        props.picklist.createdAt,
        "dd-MM-yyyy hh-mm-ss a",
        { timeZone: "America/Mexico_City" },
      )}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const distanceLabel = formatDistanceToNow(props.picklist.createdAt, {
    locale: es,
    addSuffix: true,
  });

  const handleAdd = (id: string) => {
    const picklistItem = props.picklist.items.find((item) => item.id === id);
    if (!picklistItem) return;
    const values = form.getValues();
    const quantity = parseInt(values.items[id]?.quantity || "0");
    const capacity =
      picklistItem?.machineSpiral.maxCapacity -
      picklistItem?.machineSpiral.currentCount;
    const value = isNaN(quantity) ? 1 : Math.min(quantity + 1, capacity);
    form.setValue(`items.${id}.quantity`, `${isNaN(value) ? 0 : `${value}`}`, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleSubtract = (id: string) => {
    const values = form.getValues();
    const quantity = parseInt(values.items[id]?.quantity || "0");
    const value = Math.max(quantity - 1, 0);
    form.setValue(`items.${id}.quantity`, `${isNaN(value) ? 0 : `${value}`}`, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <fieldset disabled={form.formState.isSubmitting}>
          <Card className="bg-background">
            <CardHeader className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Button
                    size="icon"
                    className="h-9 w-9"
                    variant="outline"
                    asChild
                  >
                    <Link
                      href={`/team/${params.slug}/machines/${params.machineId}/inventory`}
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                    </Link>
                  </Button>
                  <div className="space-y-1">
                    <CardTitle>Picklist</CardTitle>
                    <CardDescription>
                      Generada {distanceLabel} &bull;{" "}
                      <Timestamp date={props.picklist.createdAt} />
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    type="button"
                    onClick={onExport}
                  >
                    Descargar
                    <DownloadIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    type="submit"
                    disabled={
                      !form.formState.isDirty || !form.formState.isValid
                    }
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0 overflow-x-auto">
              <div className="divide-y">
                {props.picklist.items
                  .sort((a, b) => {
                    const isNumber =
                      !isNaN(Number(a.machineSpiral.machineCode)) &&
                      !isNaN(Number(b.machineSpiral.machineCode));

                    if (isNumber) {
                      return (
                        Number(a.machineSpiral.machineCode) -
                        Number(b.machineSpiral.machineCode)
                      );
                    }

                    return a.machineSpiral.machineCode?.localeCompare(
                      b.machineSpiral.machineCode!,
                    )!;
                  })
                  .map((item) => {
                    const availableCount =
                      item.machineSpiral.maxCapacity -
                      item.machineSpiral.currentCount;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-6 py-4 px-4"
                      >
                        <div className="flex-1 text-sm">
                          <div className="flex items-center gap-6 md:gap-12 justify-between">
                            <div className="flex flex-col gap-1">
                              <p className="text-xs text-muted-foreground space-x-4">
                                <span>
                                  Espiral #{item.machineSpiral.machineCode}
                                </span>
                                <span>
                                  MDB #{item.machineSpiral.machineMdbCode}
                                </span>
                              </p>
                              <p>{item.machineSpiral.product?.name || "-"}</p>
                              {item.machineSpiral.product?.sku && (
                                <p className="text-xs text-muted-foreground font-mono">
                                  SKU {item.machineSpiral.product.sku}
                                </p>
                              )}
                            </div>
                            <div className="text-muted-foreground">
                              {item.machineSpiral.product
                                ? formatCurrency(
                                    item.machineSpiral.product.priceCents,
                                  )
                                : "-"}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 flex items-center justify-around gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Button
                              className="w-8 h-8 p-0 active:bg-muted-foreground/60"
                              variant="secondary"
                              type="button"
                              onClick={() => handleSubtract(item.id)}
                            >
                              <MinusIcon className="w-4 h-4" />
                            </Button>
                            <FormField
                              name={`items.${item.id}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      className="w-12 h-8 text-center"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <Button
                              className="w-8 h-8 p-0 active:bg-muted-foreground/60"
                              variant="secondary"
                              type="button"
                              onClick={() => handleAdd(item.id)}
                            >
                              <PlusIcon className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-center text-muted-foreground text-nowrap px-2">
                            Espacio Disponible: {availableCount}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </fieldset>
      </form>
    </Form>
  );
}
