"use client";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PlusIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";

type Props = {
  isEdit?: boolean;
  teamName?: string | null;
};

export default function TerminalForm(props: Props) {
  const form = useFormContext();
  const type = form.watch("type");

  return (
    <div className="flex flex-col gap-6">
      {props.isEdit && props.teamName !== undefined && (
        <FormField
          control={form.control}
          name="teamName"
          render={() => (
            <FormItem className="max-w-xs">
              <FormLabel>Equipo</FormLabel>
              <FormControl>
                <Input
                  value={props.teamName || "Sin asignar"}
                  disabled
                  className="bg-muted"
                />
              </FormControl>
              <FormDescription>
                El equipo al que está asignada esta terminal.
              </FormDescription>
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>Tipo de uso de la Terminal</FormLabel>
            <FormControl>
              <Select {...field} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un flujo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VENDING">Vending</SelectItem>
                  <SelectItem value="PARKING">Parking</SelectItem>
                  <SelectItem value="MICROMARKET">Micromarket</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>El tipo de uso de la terminal.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>Alias</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              Como quieres identificar esta terminal en la plataforma.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="serialNumber"
        render={({ field }) => (
          <FormItem className="max-w-sm">
            <FormLabel>Serial</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              El número de serie de la terminal.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="merchantCode"
        render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>Código Comercio</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              El código de comercio del agregador de pagos.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="terminalCode"
        render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>Código Terminal</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              El código de terminal del agregador de pagos.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="flowType"
        render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>Flujo</FormLabel>
            <FormControl>
              <Select {...field} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un flujo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Flujo A</SelectItem>
                  <SelectItem value="B">Flujo B</SelectItem>
                  <SelectItem value="C">Flujo C</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              El flujo de pago que esta terminal debe usar.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {type === "PARKING" && (
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Usuario</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>El usuario de la terminal.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {type === "PARKING" && (
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>La contraseña de la terminal.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {type === "PARKING" && (
        <FormField
          control={form.control}
          name="endpointUrl"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Endpoint URL</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                La URL del endpoint de la terminal.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="fixedComissionCents"
        render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>Comisión Fija</FormLabel>
            <div className="relative">
              <FormControl>
                <Input {...field} className="pl-6" />
              </FormControl>
              <div className="absolute left-[10px] top-[21px] -translate-y-1/2 text-sm text-gray-500">
                $
              </div>
            </div>
            <FormDescription>La comisión fija de la terminal.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="percentageCommission"
        render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>Comisión Variable</FormLabel>
            <div className="relative">
              <FormControl>
                <Input {...field} className="pr-6" />
              </FormControl>
              <div className="absolute right-[10px] top-[21px] -translate-y-1/2 text-sm text-gray-500">
                %
              </div>
            </div>
            <FormDescription>La comisión de la terminal.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="extra1"
        render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>Extra 1</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>El extra 1 de la terminal.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="extra2"
        render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>Extra 2</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>El extra 2 de la terminal.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {(type === "VENDING" || type === "MICROMARKET") && (
        <FormField
          control={form.control}
          name="initialCredit"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Crédito Inicial</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                El crédito con el que se realiza la venta con tarjeta.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {(type === "VENDING" || type === "MICROMARKET") && (
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Idioma</FormLabel>
              <FormControl>
                <Select {...field} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ES">Español</SelectItem>
                    <SelectItem value="EN">Inglés</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>El idioma de la terminal</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {(type === "VENDING" || type === "MICROMARKET") && (
        <FormField
          control={form.control}
          name="acceptCreditPayments"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Aceptar Pagos con Tarjeta</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Switch
                    {...field}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {(type === "VENDING" || type === "MICROMARKET") && (
        <FormField
          control={form.control}
          name="acceptCashPayments"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Aceptar Pagos en Efectivo</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Switch
                    {...field}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {(type === "VENDING" || type === "MICROMARKET") && (
        <FormField
          control={form.control}
          name="acceptServicePayments"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Pago de Servicios</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Switch
                    {...field}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {(type === "VENDING" || type === "MICROMARKET") && (
        <FormField
          control={form.control}
          name="decimalMode"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Multiplicador Decimal</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                El multiplicador decimal de la terminal para interpretar el
                monto de las ventas.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {(type === "VENDING" || type === "MICROMARKET") && (
        <FormField
          control={form.control}
          name="nip"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Nip</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>El nip de la terminal.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {(type === "VENDING" || type === "MICROMARKET") && (
        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Key</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>La llave de la terminal.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {props.isEdit && (
        <div className="flex gap-4">
          <div>
            <Button size="sm" type="submit">
              Actualizar Terminal
            </Button>
          </div>
        </div>
      )}

      {!props.isEdit && (
        <div className="flex gap-4">
          <div>
            <Button size="sm" type="submit">
              <PlusIcon className="w-4 h-4 mr-2" />
              Crear Terminal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
