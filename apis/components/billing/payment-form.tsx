"use client";

import { createInvoiceAction } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CreateInvoiceInput, createInvoiceSchema } from "@/validation/billing";
import { zodResolver } from "@hookform/resolvers/zod";
import { InvoicePaymentMethod } from "@prisma/client";
import { addDays, addMonths, format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Check, ChevronsUpDown } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  machines: Array<{
    id: string;
    name: string;
    activeUntilDate: Date;
  }>;
  team: {
    costPerMachineCents: number;
  };
  exchangeRate: number;
};

export default function PaymentForm(props: Props) {
  const params = useParams();
  const router = useRouter();

  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      teamSlug: `${params.slug}`,
      machineIds: [],
      months: 1,
      paymentMethod: InvoicePaymentMethod.MERCADOPAGO,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await createInvoiceAction(values);
      toast.success("Pago creado correctamente");
      router.push(`/team/${params.slug}/billing/listing/${result.invoiceId}`);
    } catch (error) {
      console.error(error);
      toast.error("Error al registrar el pago");
    }
  });

  const machineIds = form.watch("machineIds");
  const months = form.watch("months");

  // Convert exchange rate to cents multiplier (e.g., 17.50 -> 1750)
  const exchangeRateCents = Math.round(props.exchangeRate * 100);

  // VAT rate in cents (16% -> 1600)
  const VAT_RATE_CENTS = 1600;

  // Apply 12-month promotion (pay for 11 months, get 12th free)
  const billableMonths = months === 12 ? 11 : months;

  // Calculate total cost in cents
  const subtotalCents =
    machineIds.length * billableMonths * props.team.costPerMachineCents;
  const vatCents = Math.round((subtotalCents * VAT_RATE_CENTS) / 10000); // Divide by 10000 because we're multiplying cents by cents
  const totalCostCents = subtotalCents + vatCents;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="machineIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Máquinas</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value.length && "text-muted-foreground",
                      )}
                    >
                      {field.value.length === 0
                        ? "Seleccionar máquinas"
                        : `${field.value.length} máquinas seleccionadas`}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-full p-0 min-w-[340px] max-h-[400px]"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Buscar máquina..." />
                    <CommandEmpty>No se encontraron máquinas.</CommandEmpty>
                    <CommandGroup className="overflow-y-auto max-h-[400px]">
                      <CommandItem
                        value="select-all"
                        onSelect={() => {
                          // Get all machine IDs
                          const allMachineIds = props.machines.map(
                            (machine) => machine.id,
                          );
                          // Update form state with all machine IDs
                          field.onChange(allMachineIds);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            props.machines.length === field.value.length &&
                              field.value.length > 0
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        Seleccionar Todo
                      </CommandItem>
                      {props.machines.map((machine) => (
                        <CommandItem
                          value={machine.name}
                          key={machine.id}
                          onSelect={() => {
                            const newValue = field.value.includes(machine.id)
                              ? field.value.filter((id) => id !== machine.id)
                              : [...field.value, machine.id];
                            field.onChange(newValue);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value.includes(machine.id)
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {machine.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="months"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meses a pagar</FormLabel>
              <FormControl>
                <Select
                  value={field.value.toString()}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {field.value} {field.value === 1 ? "mes" : "meses"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(
                      (month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {month === 12
                            ? "12 meses (1 mes gratis)"
                            : `${month} ${month === 1 ? "mes" : "meses"}`}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {machineIds.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Resumen</h3>
            <div className="text-sm text-muted-foreground mb-2">
              Tipo de cambio DOF: 1 USD = {props.exchangeRate.toFixed(2)} MXN
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Máquina</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machineIds.map((id) => {
                  const machine = props.machines.find((m) => m.id === id);
                  if (!machine) return null;

                  const now = new Date();
                  const isExpired = machine.activeUntilDate < now;
                  const startDate = isExpired
                    ? startOfMonth(now)
                    : startOfMonth(addDays(machine.activeUntilDate, 1));
                  const endDate = startOfMonth(
                    addMonths(startDate, form.watch("months")),
                  );

                  // Calculate costs in cents (apply promotion for 12 months)
                  const machineCostCents =
                    billableMonths * props.team.costPerMachineCents;
                  const machineVatCents = Math.round(
                    (machineCostCents * VAT_RATE_CENTS) / 10000,
                  );
                  const machineTotalCents = machineCostCents + machineVatCents;

                  // Convert to MXN cents using cents multiplier and divide by 100 to normalize
                  const machineCostMXNCents = Math.round(
                    (machineCostCents * exchangeRateCents) / 100,
                  );
                  const machineVatMXNCents = Math.round(
                    (machineVatCents * exchangeRateCents) / 100,
                  );
                  const machineTotalMXNCents = Math.round(
                    (machineTotalCents * exchangeRateCents) / 100,
                  );

                  return (
                    <TableRow key={id}>
                      <TableCell>{machine.name}</TableCell>
                      <TableCell>
                        {format(startDate, "d 'de' MMMM 'del' yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        {format(endDate, "d 'de' MMMM 'del' yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>USD {(machineTotalCents / 100).toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          MXN{" "}
                          {formatCurrency(machineTotalMXNCents).replace(
                            "$",
                            "",
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    Subtotal
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <div>USD {(subtotalCents / 100).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      MXN{" "}
                      {formatCurrency(
                        Math.round((subtotalCents * exchangeRateCents) / 100),
                      ).replace("$", "")}
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    IVA (16%)
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <div>USD {(vatCents / 100).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      MXN{" "}
                      {formatCurrency(
                        Math.round((vatCents * exchangeRateCents) / 100),
                      ).replace("$", "")}
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <div>USD {(totalCostCents / 100).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      MXN{" "}
                      {formatCurrency(
                        Math.round((totalCostCents * exchangeRateCents) / 100),
                      ).replace("$", "")}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {machineIds.length > 0 && (
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de Pago</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value: InvoicePaymentMethod) =>
                      field.onChange(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {field.value === InvoicePaymentMethod.MANUAL
                          ? "Pago por Transferencia (Adjuntar Comprobante)"
                          : "MercadoPago"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={InvoicePaymentMethod.MANUAL}>
                        Pago Por Transferencia (Comprobante)
                      </SelectItem>
                      <SelectItem value={InvoicePaymentMethod.MERCADOPAGO}>
                        MercadoPago
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={machineIds.length === 0}
        >
          {machineIds.length === 0 ? (
            "Seleccione al menos una máquina"
          ) : (
            <>Continuar a Pago</>
          )}
        </Button>
      </form>
    </Form>
  );
}
