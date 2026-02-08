"use client";

import { Button } from "@/components/ui/button";
import { usePushToFudo } from "@/lib/hooks/use-sync";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SyncActionButtonProps {
  productId: string;
  label?: string;
}

export function SyncActionButton({
  productId,
  label = "Push a Fudo",
}: SyncActionButtonProps) {
  const pushToFudo = usePushToFudo();

  async function handlePush() {
    try {
      const result = await pushToFudo.mutateAsync(productId);
      toast.success(
        `${result.action === "create" ? "Creado" : "Actualizado"} en Fudo`
      );
    } catch {
      toast.error("Error al sincronizar con Fudo");
    }
  }

  return (
    <Button
      onClick={handlePush}
      disabled={pushToFudo.isPending}
      size="sm"
    >
      {pushToFudo.isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Upload className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
