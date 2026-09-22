"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { MachineType } from "@prisma/client";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

type Props = {
  products: Array<{ id: string; label: string }>;
  isEdit?: boolean;
  machineType?: MachineType;
};

export default function SpiralForm(props: Props) {
  const form = useFormContext();
  const [isProductPopoverOpen, setIsProductPopoverOpen] = useState(false);
  const isMicromarket = props.machineType === "MICROMARKET";

  return (
    <fieldset className="space-y-6" disabled={form.formState.isSubmitting}>
      {isMicromarket ? (
        <FormField
          control={form.control}
          name="machineMicromarketCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código de Producto</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Este es el código único del producto en el micromarket.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <>
          <FormField
            control={form.control}
            name="machineCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número DEX de Espiral</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  Este es el número de espiral como aparece en la máquina.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="machineMdbCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código MDB</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  Este es el código de espiral como aparece en el sistema.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
      <FormField
        control={form.control}
        name="productId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Producto</FormLabel>
            <Popover
              open={isProductPopoverOpen}
              onOpenChange={setIsProductPopoverOpen}
            >
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {field.value
                      ? props.products.find(
                          (product) => product.id === field.value,
                        )?.label || "Selecciona un producto"
                      : "Selecciona un producto"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="p-0 " side="bottom" align="end">
                <Command>
                  <CommandInput placeholder="Selecciona un producto" />
                  <CommandEmpty>Producto no encontrado.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-y-auto">
                    {props.products.map((product) => (
                      <CommandItem
                        key={product.id}
                        value={product.label}
                        onSelect={() => {
                          form.setValue("productId", product.id);
                          setIsProductPopoverOpen(false);
                        }}
                      >
                        <CheckIcon
                          className={cn(
                            "mr-2 h-4 w-4",
                            product.id === field.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {product.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <FormDescription>
              Selecciona el producto que se venderá en esta espiral.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex flex-col md:flex-row gap-6">
        <FormField
          control={form.control}
          name="currentCount"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Cantidad Actual</FormLabel>
              <FormControl>
                <Input {...field} type="number" />
              </FormControl>
              <FormDescription>¿Cuantos productos hay?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxCapacity"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Cantidad Máxima</FormLabel>
              <FormControl>
                <Input {...field} type="number" />
              </FormControl>
              <FormDescription>¿Cuantos productos caben?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <Button type="submit" className="w-full">
        {props.isEdit ? "Guardar" : "Agregar"}
      </Button>
    </fieldset>
  );
}
