"use client";

import { Button } from "@/components/ui/button";
import { FormDescription, FormLabel } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { ImageIcon, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { UseFormReturn } from "react-hook-form";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_FILE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

interface ProductImageUploadProps {
  name: string;
  form: UseFormReturn<any>;
  label?: string;
  description?: string;
  required?: boolean;
  existingImageUrl?: string;
  onDeleteExistingImage?: () => void;
  onUndoDeleteImage?: () => void;
  isMarkedForDeletion?: boolean;
}

export default function ProductImageUpload({
  name,
  form,
  label = "Imagen del producto",
  description = "Sube una imagen para mostrar el producto. JPG, PNG o WebP (máx. 2MB)",
  required = false,
  existingImageUrl,
  onDeleteExistingImage,
  onUndoDeleteImage,
  isMarkedForDeletion = false,
}: ProductImageUploadProps) {
  const file = form.watch(name);

  const dropzone = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        form.setValue(name, acceptedFiles[0], {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        // If we had an existing image marked for deletion, unmark it since we're replacing
        if (isMarkedForDeletion && onUndoDeleteImage) {
          onUndoDeleteImage();
        }
      }
    },
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    maxFiles: 1,
  });

  const removeFile = () => {
    // If there's a new file selected, just clear it from the form
    if (file) {
      form.setValue(name, undefined, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
    // If there's an existing image and no new file, mark for deletion
    else if (existingImageUrl && onDeleteExistingImage) {
      onDeleteExistingImage();
    }
  };

  const error = form.formState.errors[name];
  const previewUrl = file ? URL.createObjectURL(file) : existingImageUrl;

  return (
    <div className="space-y-4">
      <FormLabel className="text-base">
        {label} {required && <span className="text-red-500">*</span>}
      </FormLabel>

      {description && <FormDescription>{description}</FormDescription>}

      {/* Image preview */}
      {previewUrl && (
        <div className="relative w-full max-w-xs">
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            <img
              src={previewUrl}
              alt="Vista previa del producto"
              className={cn(
                "w-full h-full object-cover transition-opacity",
                isMarkedForDeletion && "opacity-50",
              )}
            />

            {/* Deletion overlay */}
            {isMarkedForDeletion && (
              <div className="absolute inset-0 bg-red-500/20 backdrop-blur-[1px] flex items-center justify-center">
                <div className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium">
                  Se eliminará al guardar
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute top-2 right-2 flex gap-1">
            {isMarkedForDeletion && onUndoDeleteImage ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onUndoDeleteImage}
                className="text-xs"
              >
                Deshacer
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removeFile}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Upload dropzone - always visible for easy replacement */}
      <div
        {...dropzone.getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
          dropzone.isDragActive
            ? "border-primary bg-primary/5"
            : "border-border",
          "hover:border-primary hover:bg-primary/5",
        )}
      >
        <input {...dropzone.getInputProps()} />
        <div className="text-center space-y-2">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-sm font-medium">
            {file
              ? "Nueva imagen seleccionada - se subirá al guardar"
              : previewUrl
                ? "Arrastra una nueva imagen o haz clic para reemplazar"
                : "Arrastra y suelta tu imagen aquí, o haz clic para seleccionarla"}
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG o WebP (máx. 2MB)
            {previewUrl && file && " • Reemplazará la imagen actual"}
          </p>
        </div>
      </div>

      {error && typeof error.message === "string" && (
        <p className="text-sm font-medium text-red-500 dark:text-red-400">
          {error.message}
        </p>
      )}
    </div>
  );
}
