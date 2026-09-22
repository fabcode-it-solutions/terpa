"use client";

import {
  createOrUpdateFacturamaClientAction,
  getCfdiUsesAction,
  getFiscalRegimesAction,
} from "@/actions/billing";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  CfdiUse,
  FiscalRegime,
  GetClientResponse,
} from "@/lib/facturama/validation";
import { cn } from "@/lib/utils";
import {
  FacturamaClientInput,
  facturamaClientSchema,
} from "@/validation/billing";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Info } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  initialData?: GetClientResponse | null;
  initialFiscalRegimes?: FiscalRegime[];
  initialCfdiUses?: CfdiUse[];
  callbackUrl?: string | null;
};

// RFC validation function
function isValidRFC(rfc: string): boolean {
  if (!rfc) return false;
  // Remove spaces and convert to uppercase
  const cleanRfc = rfc.replace(/\s/g, "").toUpperCase();
  // RFC should be 12 or 13 characters
  if (cleanRfc.length < 12 || cleanRfc.length > 13) return false;
  // Basic format check (letters followed by numbers)
  const rfcPattern = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
  return rfcPattern.test(cleanRfc);
}

export default function FacturamaClientForm(props: Props) {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [fiscalRegimes, setFiscalRegimes] = useState<FiscalRegime[]>(
    props.initialFiscalRegimes || [],
  );
  const [loadingRegimes, setLoadingRegimes] = useState(false);
  const [regimeSelectOpen, setRegimeSelectOpen] = useState(false);
  const [cfdiUses, setCfdiUses] = useState<CfdiUse[]>(
    props.initialCfdiUses || [],
  );
  const [loadingCfdiUses, setLoadingCfdiUses] = useState(false);
  const [cfdiUseSelectOpen, setCfdiUseSelectOpen] = useState(false);

  const form = useForm<FacturamaClientInput>({
    resolver: zodResolver(facturamaClientSchema),
    defaultValues: {
      teamSlug: params.slug,
      Email: props.initialData?.Email || "",
      Rfc: props.initialData?.Rfc || "",
      Name: props.initialData?.Name || "",
      CfdiUse: props.initialData?.CfdiUse || "",
      FiscalRegime: props.initialData?.FiscalRegime || "",
      TaxZipCode: props.initialData?.TaxZipCode || "",
    },
  });

  const rfcValue = form.watch("Rfc");
  const cfdiUseValue = form.watch("CfdiUse");
  const fiscalRegimeValue = form.watch("FiscalRegime");

  // Check for invalid combination: G03 CFDI Use with 605 Fiscal Regime
  const hasInvalidCombination =
    cfdiUseValue === "G03" && fiscalRegimeValue === "605";

  // Load initial fiscal regimes and CFDI uses if we have existing RFC data but no server-side data
  useEffect(() => {
    const loadInitialData = async () => {
      if (props.initialData?.Rfc && isValidRFC(props.initialData.Rfc)) {
        // Only fetch if we don't already have server-side data
        const needsRegimes =
          !props.initialFiscalRegimes ||
          props.initialFiscalRegimes.length === 0;
        const needsCfdiUses =
          !props.initialCfdiUses || props.initialCfdiUses.length === 0;

        if (needsRegimes || needsCfdiUses) {
          if (needsRegimes) setLoadingRegimes(true);
          if (needsCfdiUses) setLoadingCfdiUses(true);

          try {
            const promises = [];
            if (needsRegimes)
              promises.push(getFiscalRegimesAction(props.initialData.Rfc));
            if (needsCfdiUses)
              promises.push(getCfdiUsesAction(props.initialData.Rfc));

            const results = await Promise.all(promises);

            let resultIndex = 0;
            if (needsRegimes) {
              setFiscalRegimes(results[resultIndex]);
              resultIndex++;
            }
            if (needsCfdiUses) {
              setCfdiUses(results[resultIndex]);
            }
          } catch (error) {
            console.error("Error loading initial data:", error);
          } finally {
            setLoadingRegimes(false);
            setLoadingCfdiUses(false);
          }
        }
      }
    };

    loadInitialData();
  }, [
    props.initialData?.Rfc,
    props.initialFiscalRegimes,
    props.initialCfdiUses,
  ]);

  useEffect(() => {
    const loadFiscalData = async () => {
      if (!isValidRFC(rfcValue)) {
        setFiscalRegimes([]);
        setCfdiUses([]);
        // Clear selections if RFC becomes invalid
        if (form.getValues("FiscalRegime")) {
          form.setValue("FiscalRegime", "");
        }
        if (form.getValues("CfdiUse")) {
          form.setValue("CfdiUse", "");
        }
        return;
      }

      // Don't fetch if it's the same as initial RFC (already loaded)
      if (rfcValue === props.initialData?.Rfc) {
        return;
      }

      // Set loading immediately to prevent showing "no data available"
      setLoadingRegimes(true);
      setLoadingCfdiUses(true);
      // Clear existing data to show loading state
      setFiscalRegimes([]);
      setCfdiUses([]);

      const loadData = async () => {
        try {
          const [regimes, cfdiUsesData] = await Promise.all([
            getFiscalRegimesAction(rfcValue),
            getCfdiUsesAction(rfcValue),
          ]);
          setFiscalRegimes(regimes);
          setCfdiUses(cfdiUsesData);
        } catch (error) {
          console.error("Error loading fiscal data:", error);
          setFiscalRegimes([]);
          setCfdiUses([]);
          toast.error("Error al cargar datos fiscales");
        } finally {
          setLoadingRegimes(false);
          setLoadingCfdiUses(false);
        }
      };

      // Debounce the API call
      const timeoutId = setTimeout(loadData, 500);
      return () => clearTimeout(timeoutId);
    };

    loadFiscalData();
  }, [rfcValue, form, props.initialData?.Rfc]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createOrUpdateFacturamaClientAction(values);
      toast.success(
        props.initialData
          ? "Datos fiscales actualizados correctamente"
          : "Datos fiscales creados correctamente",
      );

      // If we have a callbackUrl, redirect to it; otherwise refresh
      if (props.callbackUrl) {
        router.push(props.callbackUrl);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar los datos fiscales");
    }
  });

  return (
    <Card>
      <CardContent className="p-4">
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertDescription>
                La razón social debe escribirse exactamente como aparece en la
                constancia de situación fiscal.
              </AlertDescription>
            </Alert>

            <fieldset
              className="space-y-6"
              disabled={form.formState.isSubmitting}
            >
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="Email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="correo@empresa.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="Rfc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RFC</FormLabel>
                      <FormControl>
                        <Input placeholder="XAXX010101000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="TaxZipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Postal Fiscal</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="Name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón Social / Nombre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre de la empresa o persona física"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="CfdiUse"
                  render={({ field }) => {
                    const selectedCfdiUse = cfdiUses.find(
                      (cfdiUse) => cfdiUse.Value === field.value,
                    );

                    return (
                      <FormItem>
                        <FormLabel>Uso de CFDI</FormLabel>
                        <Popover
                          open={cfdiUseSelectOpen}
                          onOpenChange={setCfdiUseSelectOpen}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={cfdiUseSelectOpen}
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground",
                                )}
                                disabled={
                                  loadingCfdiUses || !isValidRFC(rfcValue)
                                }
                              >
                                {loadingCfdiUses ? (
                                  "Cargando usos de CFDI..."
                                ) : !isValidRFC(rfcValue) ? (
                                  "Ingresa un RFC válido"
                                ) : selectedCfdiUse ? (
                                  <div className="flex gap-2">
                                    <span className="text-muted-foreground">
                                      {selectedCfdiUse.Value}
                                    </span>
                                    <span>{selectedCfdiUse.Name}</span>
                                  </div>
                                ) : cfdiUses.length === 0 ? (
                                  "No hay usos de CFDI disponibles"
                                ) : (
                                  "Seleccionar uso de CFDI"
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] max-w-none p-0">
                            <Command>
                              <CommandInput placeholder="Buscar uso de CFDI..." />
                              <CommandEmpty>
                                No se encontraron usos de CFDI.
                              </CommandEmpty>
                              <CommandGroup className="max-h-[300px] overflow-auto">
                                {cfdiUses.map((cfdiUse) => (
                                  <CommandItem
                                    key={cfdiUse.Value}
                                    onSelect={() => {
                                      field.onChange(cfdiUse.Value);
                                      setCfdiUseSelectOpen(false);
                                    }}
                                    className="text-sm"
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedCfdiUse?.Value ===
                                            cfdiUse.Value
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      <span className="text-muted-foreground">
                                        {cfdiUse.Value}
                                      </span>
                                      <span>{cfdiUse.Name}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="FiscalRegime"
                  render={({ field }) => {
                    const selectedRegime = fiscalRegimes.find(
                      (regime) => regime.Value === field.value,
                    );

                    return (
                      <FormItem>
                        <FormLabel>Régimen Fiscal</FormLabel>
                        <Popover
                          open={regimeSelectOpen}
                          onOpenChange={setRegimeSelectOpen}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={regimeSelectOpen}
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground",
                                )}
                                disabled={
                                  loadingRegimes || !isValidRFC(rfcValue)
                                }
                              >
                                {loadingRegimes ? (
                                  "Cargando regímenes..."
                                ) : !isValidRFC(rfcValue) ? (
                                  "Ingresa un RFC válido"
                                ) : selectedRegime ? (
                                  <div className="flex gap-2">
                                    <span className="text-muted-foreground">
                                      {selectedRegime.Value}
                                    </span>
                                    <span>{selectedRegime.Name}</span>
                                  </div>
                                ) : fiscalRegimes.length === 0 ? (
                                  "No hay regímenes disponibles"
                                ) : (
                                  "Seleccionar régimen"
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] max-w-none p-0">
                            <Command>
                              <CommandInput placeholder="Buscar régimen fiscal..." />
                              <CommandEmpty>
                                No se encontraron regímenes.
                              </CommandEmpty>
                              <CommandGroup className="max-h-[300px] overflow-auto">
                                {fiscalRegimes.map((regime) => (
                                  <CommandItem
                                    key={regime.Value}
                                    onSelect={() => {
                                      field.onChange(regime.Value);
                                      setRegimeSelectOpen(false);
                                    }}
                                    className="text-sm"
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedRegime?.Value === regime.Value
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      <span className="text-muted-foreground">
                                        {regime.Value}
                                      </span>
                                      <span>{regime.Name}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              {/* Warning message for invalid combination */}
              {hasInvalidCombination && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">
                        <strong>Combinación no válida:</strong> El uso de CFDI
                        &quot;G03&quot; no puede utilizarse con el régimen
                        fiscal &quot;605&quot;. Por favor, selecciona una
                        combinación diferente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    form.formState.isSubmitting || hasInvalidCombination
                  }
                >
                  {form.formState.isSubmitting
                    ? "Guardando..."
                    : props.initialData
                      ? "Actualizar"
                      : "Guardar"}
                </Button>
              </div>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
