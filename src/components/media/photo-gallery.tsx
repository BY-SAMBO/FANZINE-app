"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setMainPhoto, removeFromGallery } from "@/lib/services/media-service";
import { Star, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PhotoGalleryProps {
  productId: string;
  mainPhoto: string | null;
  gallery: string[] | null;
}

export function PhotoGallery({
  productId,
  mainPhoto,
  gallery,
}: PhotoGalleryProps) {
  const queryClient = useQueryClient();

  async function handleSetMain(url: string) {
    try {
      await setMainPhoto(productId, url);
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      toast.success("Foto principal actualizada");
    } catch {
      toast.error("Error actualizando foto principal");
    }
  }

  async function handleRemove(url: string) {
    try {
      await removeFromGallery(productId, url);
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      toast.success("Foto eliminada de la galeria");
    } catch {
      toast.error("Error eliminando foto");
    }
  }

  const allPhotos = [
    ...(mainPhoto ? [mainPhoto] : []),
    ...(gallery || []).filter((url) => url !== mainPhoto),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Galeria ({allPhotos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allPhotos.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            <Package className="mr-2 h-5 w-5" />
            Sin fotos
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {allPhotos.map((url) => (
              <div key={url} className="group relative">
                <div className="aspect-square overflow-hidden rounded-lg border">
                  <img
                    src={url}
                    alt="Producto"
                    className="h-full w-full object-cover"
                  />
                </div>
                {url === mainPhoto && (
                  <Badge className="absolute left-2 top-2" variant="default">
                    Principal
                  </Badge>
                )}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {url !== mainPhoto && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={() => handleSetMain(url)}
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7"
                    onClick={() => handleRemove(url)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
