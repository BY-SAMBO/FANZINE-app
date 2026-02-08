"use client";

import { use } from "react";
import { useDeliveryModules } from "@/lib/hooks/use-delivery";
import { ModuleEditor } from "@/components/delivery/module-editor";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function ModuloDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: modules } = useDeliveryModules();
  const queryClient = useQueryClient();

  const module = modules?.find((m) => m.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/delivery">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="min-w-0 truncate text-2xl font-bold">
          Modulo: {module?.titulo || id}
        </h1>
      </div>

      {module && (
        <ModuleEditor
          module={module}
          onSaved={() =>
            queryClient.invalidateQueries({
              queryKey: ["delivery-modules"],
            })
          }
        />
      )}
    </div>
  );
}
