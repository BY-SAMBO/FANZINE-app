"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadProductImage, setMainPhoto, addToGallery } from "@/lib/services/media-service";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PhotoUploaderProps {
  productId: string;
}

export function PhotoUploader({ productId }: PhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imagenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadProductImage(productId, file);
      await addToGallery(productId, url);
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      toast.success("Imagen subida exitosamente");
    } catch {
      toast.error("Error subiendo imagen");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="h-4 w-4" />
          Subir foto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          variant="outline"
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {isUploading ? "Subiendo..." : "Seleccionar imagen"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Formatos: JPG, PNG, WebP. Maximo 5MB.
        </p>
      </CardContent>
    </Card>
  );
}
