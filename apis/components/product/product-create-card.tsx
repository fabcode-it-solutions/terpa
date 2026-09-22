"use client";

import {
  productCreateAction,
  uploadProductImageAction,
} from "@/actions/product";
import ProductForm from "@/components/product/product-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { productCreateSchema } from "@/validation/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  showBarcode?: boolean;
};

export default function ProductCreateCard(props: Props) {
  const params = useParams();
  const router = useRouter();
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      teamSlug: params.slug,
      name: "",
      price: "",
      sku: "",
      barcode: "",
      purchaseCost: "",
      image: undefined,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      // Create product first (excluding image)
      const { image, ...productData } = values;
      const result = await productCreateAction(productData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      if (!result?.success || !result?.productId) {
        toast.error("Error al crear el producto.");
        return;
      }

      // Handle image upload if there's an image
      if (image) {
        setIsUploadingImage(true);
        const formData = new FormData();
        formData.append("teamSlug", String(values.teamSlug));
        formData.append("productId", String(result.productId));
        formData.append("image", image);

        const imageResult = await uploadProductImageAction(formData);
        if (imageResult.error) {
          toast.error(imageResult.error);
          return;
        }

        toast.success("Producto e imagen creados exitosamente.");
      } else {
        toast.success("Producto creado exitosamente.");
      }

      // Redirect to products page
      router.push(`/team/${params.slug}/products`);
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al crear el producto. Intenta más tarde.");
    } finally {
      setIsUploadingImage(false);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos Generales</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <ProductForm showBarcode={props.showBarcode} />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
