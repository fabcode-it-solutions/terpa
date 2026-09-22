"use client";

import { Button } from "@/components/ui/button";
import { FormDescription, FormLabel } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";
import { UseFormReturn } from "react-hook-form";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_FILE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/heic": [".heic"],
  "image/heif": [".heif"],
  "application/pdf": [".pdf"],
};

interface FileUploadFieldProps {
  name: string;
  form: UseFormReturn<any>;
  label: string;
  description?: string;
  required?: boolean;
  maxFiles?: number;
  additionalNote?: string;
}

export default function FileUploadField({
  name,
  form,
  label,
  description,
  required = false,
  maxFiles = 5,
  additionalNote,
}: FileUploadFieldProps) {
  const files = form.watch(name) || [];

  const dropzone = useDropzone({
    onDrop: (acceptedFiles) => {
      const currentFiles = form.getValues(name) || [];
      form.setValue(name, [...currentFiles, ...acceptedFiles], {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    maxFiles: maxFiles,
  });

  const removeFile = (fileToRemove: File) => {
    const updatedFiles = files.filter((file: File) => file !== fileToRemove);
    form.setValue(name, updatedFiles, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const error = form.formState.errors[name];

  return (
    <div className="space-y-4">
      <FormLabel className="text-base">
        {label} {required && <span className="text-red-500">*</span>}{" "}
        {additionalNote && <span className="italic">({additionalNote})</span>}
      </FormLabel>

      {description && <FormDescription>{description}</FormDescription>}

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
          <p className="text-sm font-medium">
            Arrastra y suelta tus archivos aquí, o haz clic para seleccionarlos
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG o PDF (máx. 100MB por archivo)
          </p>
          <p className="text-xs text-muted-foreground">
            Puedes subir hasta {maxFiles} archivos
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Archivos seleccionados:</h4>
          <ul className="space-y-2">
            {files.map((file: File, index: number) => (
              <li
                key={index}
                className="flex items-center justify-between text-sm p-2 bg-muted rounded"
              >
                <span className="truncate max-w-[80%]">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file)}
                >
                  Eliminar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && typeof error.message === "string" && (
        <p className="text-sm font-medium text-red-500 dark:text-red-400">
          {error.message}
        </p>
      )}
    </div>
  );
}
