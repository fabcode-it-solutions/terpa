"use client";

import ProductImageUpload from "@/components/product/product-image-upload";
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
import { useFormContext } from "react-hook-form";

type Props = {
  isEdit?: boolean;
  existingImageUrl?: string;
  onDeleteExistingImage?: () => void;
  onUndoDeleteImage?: () => void;
  isImageMarkedForDeletion?: boolean;
  showBarcode?: boolean;
};

export default function ProductForm(props: Props) {
  const form = useFormContext();

  return (
    <fieldset className="space-y-4" disabled={form.formState.isSubmitting}>
      <FormField
        name="name"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre</FormLabel>
            <FormControl>
              <Input autoFocus {...field} />
            </FormControl>
            <FormDescription>
              El nombre con el que se identificará el producto.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        name="price"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Precio</FormLabel>
            <div className="relative">
              <FormControl>
                <Input className="pl-6" {...field} />
              </FormControl>
              <span className="absolute top-[11px] left-3 text-sm text-muted-foreground/80">
                $
              </span>
            </div>
            <FormDescription>El precio de venta del producto.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        name="purchaseCost"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <span>Costo de compra</span>
              <span className="text-xs text-muted-foreground">Opcional</span>
            </FormLabel>
            <div className="relative">
              <FormControl>
                <Input className="pl-6" {...field} />
              </FormControl>
              <span className="absolute top-[11px] left-3 text-sm text-muted-foreground/80">
                $
              </span>
            </div>
            <FormDescription>
              El costo de compra del producto. Esto nos permite mostarte
              reportes de gastos
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        name="sku"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <span>SKU</span>
              <span className="text-xs text-muted-foreground">Opcional</span>
            </FormLabel>
            <div className="relative">
              <FormControl>
                <Input {...field} />
              </FormControl>
            </div>
            <FormDescription>El SKU del producto.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      {props.showBarcode && (
        <FormField
          name="barcode"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <span>Código de barras</span>
                <span className="text-xs text-muted-foreground">Opcional</span>
              </FormLabel>
              <div className="relative">
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </div>
              <FormDescription>
                El código de barras del producto.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <ProductImageUpload
        name="image"
        form={form}
        existingImageUrl={props.existingImageUrl}
        onDeleteExistingImage={props.onDeleteExistingImage}
        onUndoDeleteImage={props.onUndoDeleteImage}
        isMarkedForDeletion={props.isImageMarkedForDeletion}
      />
      <div className="pt-4">
        <Button type="submit" className="w-full md:w-auto px-10">
          {props.isEdit ? "Guardar" : "Agregar"}
        </Button>
      </div>
    </fieldset>
  );
}
