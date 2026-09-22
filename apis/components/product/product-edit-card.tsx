"use client";

import {
  deleteProductImageAction,
  productEditAction,
  uploadProductImageAction,
} from "@/actions/product";
import ProductForm from "@/components/product/product-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { productEditSchema } from "@/validation/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  defaultValues: {
    name: string;
    price: string;
    sku: string | null;
    barcode: string | null;
    purchaseCost: string;
  };
  existingImageUrl?: string;
  productImage?: {
    id: string;
    fileUrl: string;
    fileName: string;
  };
  showBarcode?: boolean;
};

export default function ProductEditCard(props: Props) {
  const params = useParams();
  const router = useRouter();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isImageMarkedForDeletion, setIsImageMarkedForDeletion] =
    useState(false);

  const form = useForm({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      teamSlug: String(params.slug),
      productId: String(params.productId),
      name: props.defaultValues.name,
      price: props.defaultValues.price,
      sku: props.defaultValues.sku,
      barcode: props.defaultValues.barcode,
      purchaseCost: props.defaultValues.purchaseCost,
      image: undefined,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      // Handle image replacement: if we have a new image and existing image, delete existing first
      if (values.image && props.productImage && !isImageMarkedForDeletion) {
        const deleteResult = await deleteProductImageAction({
          teamSlug: String(params.slug),
          productId: String(params.productId),
          imageId: props.productImage.id,
        });

        if (deleteResult.error) {
          toast.error(deleteResult.error);
          return;
        }
      }

      // Handle image deletion if marked for deletion (and no new image to replace)
      if (isImageMarkedForDeletion && props.productImage && !values.image) {
        const deleteResult = await deleteProductImageAction({
          teamSlug: String(params.slug),
          productId: String(params.productId),
          imageId: props.productImage.id,
        });

        if (deleteResult.error) {
          toast.error(deleteResult.error);
          return;
        }
      }

      // Handle image upload separately if there's an image
      if (values.image) {
        setIsUploadingImage(true);
        const formData = new FormData();
        formData.append("teamSlug", String(values.teamSlug));
        formData.append("productId", String(values.productId));
        formData.append("image", values.image);

        const imageResult = await uploadProductImageAction(formData);
        if (imageResult.error) {
          toast.error(imageResult.error);
          return;
        }
      }

      // Update product details (excluding image)
      const { image, ...productData } = values;
      const result = await productEditAction(productData);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      // Success message based on what was done
      let successMessage = "Producto actualizado exitosamente.";
      if (values.image && props.productImage) {
        successMessage =
          "Producto actualizado e imagen reemplazada exitosamente.";
      } else if (isImageMarkedForDeletion && !values.image) {
        successMessage =
          "Producto actualizado e imagen eliminada exitosamente.";
      } else if (values.image) {
        successMessage = "Producto e imagen actualizados exitosamente.";
      }

      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(
        "Ocurrió un error al actualizar el producto. Intenta más tarde.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  });

  const handleDeleteImage = () => {
    setIsImageMarkedForDeletion(true);
  };

  const handleUndoDeleteImage = () => {
    setIsImageMarkedForDeletion(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos Generales</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <ProductForm
              isEdit
              existingImageUrl={props.existingImageUrl}
              onDeleteExistingImage={handleDeleteImage}
              onUndoDeleteImage={handleUndoDeleteImage}
              isImageMarkedForDeletion={isImageMarkedForDeletion}
              showBarcode={props.showBarcode}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
