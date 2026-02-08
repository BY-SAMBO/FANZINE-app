"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePushToFudo } from "@/lib/hooks/use-sync";
import type { SyncComparisonResult } from "@/types/sync";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ComparisonTableProps {
  comparison: SyncComparisonResult;
}

export function ComparisonTable({ comparison }: ComparisonTableProps) {
  const pushToFudo = usePushToFudo();

  async function handlePush(productId: string) {
    try {
      await pushToFudo.mutateAsync(productId);
      toast.success(`Producto ${productId} sincronizado con Fudo`);
    } catch {
      toast.error("Error al sincronizar");
    }
  }

  return (
    <div className="space-y-6">
      {/* Products with differences */}
      {comparison.diffs.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold">
            Con diferencias ({comparison.diffs.length})
          </h3>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Fudo</TableHead>
                  <TableHead className="w-24">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.diffs.map((diff) => (
                  <TableRow key={diff.local_id}>
                    <TableCell className="font-medium">
                      {diff.nombre}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {diff.local_id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {diff.fields.map((f) => (
                          <Badge key={f.field} variant="outline" className="text-xs">
                            {f.field}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {diff.fields.map((f) => String(f.local_value)).join(", ")}
                    </TableCell>
                    <TableCell className="text-xs">
                      {diff.fields.map((f) => String(f.fudo_value)).join(", ")}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePush(diff.local_id)}
                        disabled={pushToFudo.isPending}
                      >
                        {pushToFudo.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Local only */}
      {comparison.local_only.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold">
            Solo en local ({comparison.local_only.length})
          </h3>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-24">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.local_only.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell>{p.nombre}</TableCell>
                    <TableCell>${(p.precio_venta ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={p.activo ? "default" : "secondary"}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handlePush(p.id)}
                        disabled={pushToFudo.isPending}
                      >
                        {pushToFudo.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="mr-1 h-3 w-3" />
                        )}
                        Push
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Fudo only */}
      {comparison.fudo_only.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold">
            Solo en Fudo ({comparison.fudo_only.length})
          </h3>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fudo ID</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.fudo_only.map((p) => (
                  <TableRow key={p.fudo_id}>
                    <TableCell className="font-mono text-xs">
                      {p.fudo_id}
                    </TableCell>
                    <TableCell>{p.code || "—"}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>${(p.price ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={p.active ? "default" : "secondary"}>
                        {p.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
